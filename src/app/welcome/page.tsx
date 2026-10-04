"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FlaskConical,
  Sparkles,
  Users,
  ShoppingCart,
  Package,
  Settings,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Phone,
} from "lucide-react";

export default function WelcomePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const clinicName = (session?.user as any)?.company_name || "SkinLab Aesthetic Clinic";
  const userFullName = (session?.user as any)?.full_name || session?.user?.email?.split("@")[0] || "Admin";
  const userEmail = session?.user?.email;

  const handleGoToDashboard = async (targetUrl = "/dashboard") => {
    setLoading(true);
    try {
      await fetch("/api/auth/complete-welcome", { method: "POST" });
      await update({ is_first_login: false });
    } catch (e) {
      console.error(e);
    } finally {
      router.push(targetUrl);
    }
  };

  const quickSteps = [
    {
      title: "Register Your Patients",
      desc: "Create patient profiles, track visit histories, advance balances, and phone contact records.",
      href: "/dashboard/patients",
      icon: Users,
      color: "from-blue-600 to-indigo-600",
    },
    {
      title: "Point of Sale & Billing",
      desc: "Fast checkout, doctor consultation split, multi-session package redemptions, and 80mm thermal receipts.",
      href: "/dashboard/pos",
      icon: ShoppingCart,
      color: "from-emerald-600 to-teal-600",
    },
    {
      title: "Services & Treatment Packages",
      desc: "Define your aesthetic procedures, pricing, multi-session packages, and session rules.",
      href: "/dashboard/services",
      icon: Package,
      color: "from-purple-600 to-indigo-600",
    },
    {
      title: "Theme & Clinic Settings",
      desc: "Upload high-res clinic logos, configure invoice headers, and customize your software color palette.",
      href: "/dashboard/settings",
      icon: Settings,
      color: "from-pink-600 to-rose-600",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-indigo-100">
      <div className="max-w-4xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
        
        {/* Main Welcome Hero Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-indigo-50/70 -z-0 blur-2xl"></div>

          <div className="relative z-10 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-600 text-white flex items-center justify-center shadow-md">
                  <FlaskConical className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xl font-black text-slate-900 tracking-tight">
                    {clinicName}
                  </span>
                  <p className="text-xs text-slate-400 font-medium">
                    Powered by Falcon Swift PVT. LTD.
                  </p>
                </div>
              </div>

              <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Monthly Plan Active (PKR 3,000/mo)</span>
              </span>
            </div>

            <div className="space-y-2 pt-2">
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Welcome, {userFullName}! 🎉
              </h1>
              <p className="text-slate-600 text-sm sm:text-base font-medium leading-relaxed max-w-2xl">
                Your clinic workspace has been successfully initialized and configured. Everything is set up and ready for your first patient visit.
              </p>
            </div>

            {/* Quick Actions Grid */}
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickSteps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => handleGoToDashboard(step.href)}
                    className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group flex items-start gap-4"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${step.color} text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors flex items-center gap-1">
                        <span>{step.title}</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </h3>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Button Row */}
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
              <div className="text-xs text-slate-400 font-medium flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Logged in as <strong>{userEmail}</strong> (Admin)</span>
              </div>

              <button
                onClick={() => handleGoToDashboard("/dashboard")}
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <span>{loading ? "Entering Dashboard..." : "Launch Clinic Dashboard"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Falcon Swift Footer Support note */}
        <div className="text-center text-xs text-slate-500 space-y-1 font-medium">
          <p>
            Need assistance setting up thermal printers or importing existing patients?
          </p>
          <a
            href="https://wa.me/923263392082"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 hover:text-emerald-700 font-bold inline-flex items-center gap-1"
          >
            <Phone className="w-3.5 h-3.5" /> WhatsApp Support Hotline: 0326-3392082
          </a>
        </div>
      </div>
    </div>
  );
}
