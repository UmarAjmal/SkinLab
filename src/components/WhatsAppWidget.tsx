"use client";

import { useState } from "react";
import { MessageCircle, X, Send, ShieldCheck, Sparkles } from "lucide-react";

interface WhatsAppWidgetProps {
  phoneNumber?: string;
  defaultMessage?: string;
}

export default function WhatsAppWidget({
  phoneNumber = "923263392082",
  defaultMessage = "Hello Falcon Swift Team, I am interested in SkinLab Clinic POS Software. Please guide me with demo and setup.",
}: WhatsAppWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customMsg, setCustomMsg] = useState(defaultMessage);

  const handleOpenWhatsApp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const encoded = encodeURIComponent(customMsg || defaultMessage);
    const url = `https://wa.me/${phoneNumber}?text=${encoded}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans selection:bg-emerald-100">
      {/* Interactive Chat Popup Card */}
      {isOpen && (
        <div className="mb-4 w-[340px] sm:w-[380px] bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 sm:p-5 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold text-white shadow-inner">
                  <MessageCircle className="w-6 h-6 fill-white text-emerald-600" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-300 border-2 border-emerald-600 rounded-full animate-pulse"></span>
              </div>
              <div>
                <h4 className="font-bold text-sm sm:text-base leading-tight">
                  Falcon Swift Support
                </h4>
                <p className="text-[11px] text-emerald-100 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full"></span>
                  Official WhatsApp Agent • Online
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close WhatsApp chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-5 bg-slate-50/70 space-y-3.5">
            {/* Agent Message Bubble */}
            <div className="bg-white p-3.5 rounded-2xl rounded-tl-xs shadow-xs border border-gray-100 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <p className="font-semibold text-emerald-800 mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Assalam-o-Alaikum!
              </p>
              Need assistance with <strong>SkinLab Clinic POS</strong> or custom subscription packages? We're here to help you set up your clinic workspace in minutes!
            </div>

            <div className="text-[11px] text-slate-400 text-right px-1 font-medium">
              Direct Phone / WhatsApp: <strong className="text-slate-700 font-mono">0326-3392082</strong>
            </div>

            {/* Message input & send form */}
            <form onSubmit={handleOpenWhatsApp} className="space-y-2.5">
              <textarea
                rows={2}
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                className="w-full text-xs sm:text-sm p-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white resize-none shadow-2xs font-medium text-slate-800 placeholder-gray-400"
                placeholder="Type your message..."
              />

              <button
                type="submit"
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-98 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Start WhatsApp Chat</span>
              </button>
            </form>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Falcon Swift PVT. LTD. Official Portal</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open WhatsApp Agent"
        className="group relative flex items-center gap-3 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3.5 sm:px-5 sm:py-4 rounded-full shadow-2xl hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer z-50 border-2 border-white/20"
      >
        {/* Pulsing glow ring */}
        <span className="absolute -inset-1 rounded-full bg-emerald-400 opacity-40 group-hover:opacity-75 animate-ping -z-10"></span>

        <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 fill-white text-emerald-500 shrink-0" />
        
        <span className="font-bold text-xs sm:text-sm tracking-tight flex flex-col items-start leading-tight">
          <span>Chat on WhatsApp</span>
          <span className="text-[10px] text-emerald-100 font-normal font-mono">0326-3392082</span>
        </span>
      </button>
    </div>
  );
}
