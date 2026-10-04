"use client";

import { useState, useEffect } from "react";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import { User, Stethoscope, ShieldCheck, Sparkles, Clock } from "lucide-react";
import dayjs from "dayjs";

interface TopHeaderProps {
  userEmail: string;
  userRole: string;
}

export default function TopHeader({ userEmail, userRole }: TopHeaderProps) {
  const [currentDateTime, setCurrentDateTime] = useState("");
  const [clinicName, setClinicName] = useState<string>("Skin-Lab Clinic");
  const [clinicLogo, setClinicLogo] = useState<string | null>(null);

  useEffect(() => {
    setCurrentDateTime(dayjs().format("ddd, DD MMM YYYY • hh:mm A"));
    const interval = setInterval(() => {
      setCurrentDateTime(dayjs().format("ddd, DD MMM YYYY • hh:mm A"));
    }, 30000);

    const fetchClinicSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.name) setClinicName(data.name);
          if (data.logo) setClinicLogo(data.logo);
        }
      } catch (e) {
        console.error("TopHeader settings fetch error:", e);
      }
    };
    fetchClinicSettings();

    return () => clearInterval(interval);
  }, []);

  const userName = userEmail ? userEmail.split("@")[0] : "Staff";
  const userInitial = (userEmail ? userEmail.charAt(0) : "S").toUpperCase();

  const getRoleBadge = (role: string) => {
    if (role === "Admin")
      return <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-rose-200">Admin</span>;
    if (role === "Doctor")
      return <span className="bg-teal-100 text-teal-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-teal-200">Doctor</span>;
    if (role === "Manager")
      return (
        <span 
          style={{ 
            backgroundColor: "var(--color-primary-light)", 
            color: "var(--color-primary)",
            borderColor: "rgba(0,0,0,0.08)"
          }} 
          className="text-[10px] font-extrabold px-2 py-0.5 rounded-full border"
        >
          Manager
        </span>
      );
    return <span className="bg-slate-100 text-slate-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-slate-200">{role || "Staff"}</span>;
  };

  return (
    <header 
      style={{ backgroundColor: "var(--color-header-bg)" }}
      className="hidden md:flex items-center justify-between px-6 py-3.5 backdrop-blur-md border-b border-gray-100 shrink-0 z-20 w-full transition-colors duration-300"
    >
      {/* Left: Clinic Brand + Date & Time + Status */}
      <div className="flex items-center gap-3">
        {clinicLogo && (
          <div className="flex items-center gap-2 pr-2 border-r border-gray-200">
            <img
              src={clinicLogo}
              alt={clinicName}
              className="w-7 h-7 object-contain rounded-lg border border-gray-100 bg-white shadow-2xs"
            />
            <span className="text-xs font-bold text-gray-800 tracking-tight max-w-[150px] truncate">
              {clinicName}
            </span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
          <Clock style={{ color: "var(--color-primary)" }} className="w-3.5 h-3.5" />
          <span>{currentDateTime || "Live Clinic System"}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>System Online</span>
        </div>
      </div>

      {/* Right: Notification Center + User Profile */}
      <div className="flex items-center gap-3">
        {/* Real-time Notification Bell */}
        <NotificationCenter userRole={userRole} />

        {/* User Pill */}
        <div className="flex items-center gap-2.5 bg-slate-50 border border-gray-200/80 px-3 py-1.5 rounded-2xl shadow-2xs">
          <div 
            style={{ 
              background: `linear-gradient(135deg, var(--color-primary), var(--color-accent))` 
            }}
            className="w-7 h-7 rounded-xl text-white flex items-center justify-center font-bold text-xs shadow-xs"
          >
            {userInitial}
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-gray-900 leading-tight capitalize">
              {userName}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              {getRoleBadge(userRole)}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
