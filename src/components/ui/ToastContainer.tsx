"use client";

import { useEffect, useState } from "react";
import { subscribeToasts, removeToast, ToastItem } from "@/lib/toast";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToasts((updatedToasts) => {
      setToasts(updatedToasts);
    });
    return unsubscribe;
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999999] flex flex-col items-center gap-2.5 pointer-events-none w-[94vw] max-w-md"
    >
      {toasts.map((toast) => (
        <ToastAlert key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastAlert({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Start countdown line
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / toast.duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 20);

    // Trigger exit animation shortly before removal
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, Math.max(0, toast.duration - 220));

    return () => {
      clearInterval(interval);
      clearTimeout(exitTimer);
    };
  }, [toast.duration]);

  const handleManualClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 180);
  };

  const getStyleConfig = () => {
    switch (toast.type) {
      case "success":
        return {
          border: "border-emerald-500/40",
          bg: "bg-slate-900/95 backdrop-blur-xl",
          glow: "shadow-[0_10px_35px_-5px_rgba(16,185,129,0.3)]",
          barColor: "bg-gradient-to-r from-emerald-500 to-teal-400",
          iconBg: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
          titleColor: "text-emerald-400",
        };
      case "error":
        return {
          border: "border-rose-500/40",
          bg: "bg-slate-900/95 backdrop-blur-xl",
          glow: "shadow-[0_10px_35px_-5px_rgba(244,63,94,0.3)]",
          barColor: "bg-gradient-to-r from-rose-500 to-pink-500",
          iconBg: "bg-rose-500/15 text-rose-400 border border-rose-500/30",
          icon: <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />,
          titleColor: "text-rose-400",
        };
      case "warning":
        return {
          border: "border-amber-500/40",
          bg: "bg-slate-900/95 backdrop-blur-xl",
          glow: "shadow-[0_10px_35px_-5px_rgba(245,158,11,0.3)]",
          barColor: "bg-gradient-to-r from-amber-500 to-yellow-400",
          iconBg: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
          icon: <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />,
          titleColor: "text-amber-400",
        };
      default:
        return {
          border: "border-indigo-500/40",
          bg: "bg-slate-900/95 backdrop-blur-xl",
          glow: "shadow-[0_10px_35px_-5px_rgba(99,102,241,0.3)]",
          barColor: "bg-gradient-to-r from-indigo-500 to-sky-400",
          iconBg: "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30",
          icon: <Info className="w-5 h-5 text-indigo-400 shrink-0" />,
          titleColor: "text-indigo-400",
        };
    }
  };

  const style = getStyleConfig();

  return (
    <div
      role="alert"
      className={`pointer-events-auto relative w-full overflow-hidden rounded-2xl border ${style.border} ${style.bg} ${style.glow} p-3.5 sm:p-4 text-white transition-all duration-200 ease-out ${
        isExiting
          ? "opacity-0 -translate-y-3 scale-95"
          : "opacity-100 translate-y-0 scale-100 animate-in fade-in slide-in-from-top-4"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Animated Icon Avatar */}
        <div
          className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0 ${style.iconBg}`}
        >
          {style.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2">
            <h4 className={`text-xs sm:text-sm font-bold tracking-tight ${style.titleColor}`}>
              {toast.title}
            </h4>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest bg-slate-800/80 px-1.5 py-0.5 rounded">
              DB Alert
            </span>
          </div>
          <p className="text-xs sm:text-[13px] text-slate-200 font-medium mt-0.5 leading-relaxed break-words">
            {toast.message}
          </p>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={handleManualClose}
          aria-label="Dismiss alert"
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2-Second Countdown Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-800/60 overflow-hidden">
        <div
          className={`h-full ${style.barColor} transition-all duration-75 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
