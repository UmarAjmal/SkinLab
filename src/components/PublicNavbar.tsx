"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FlaskConical, Menu, X, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";

export default function PublicNavbar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [clinicName, setClinicName] = useState("Skin-Lab");
  const [clinicLogo, setClinicLogo] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings/public")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.name) setClinicName(data.name);
        if (data?.logo) setClinicLogo(data.logo);
      })
      .catch(() => {});
  }, []);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Product & Features", href: "/product" },
    { label: "Pricing & Plans", href: "/plan" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/90 border-b border-slate-200/80 transition-all font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            style={{
              background: `linear-gradient(135deg, var(--color-primary, #4f46e5), var(--color-accent, #06b6d4))`,
            }}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-white shadow-md shadow-black/5 shrink-0 overflow-hidden group-hover:scale-105 transition-transform"
          >
            {clinicLogo ? (
              <img
                src={clinicLogo}
                alt={clinicName}
                className="w-full h-full object-contain p-1 bg-white/10"
              />
            ) : (
              <FlaskConical className="w-5 h-5 text-white" strokeWidth={2.5} />
            )}
          </div>
          <div>
            <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              {clinicName}
              <span
                style={{
                  backgroundColor: "var(--color-primary, #4f46e5)",
                  color: "var(--color-primary-text, #ffffff)",
                }}
                className="text-[9px] uppercase px-2 py-0.5 rounded-md font-extrabold tracking-wider"
              >
                POS
              </span>
            </span>
            <p className="text-[10px] text-slate-400 font-medium leading-none hidden sm:block">
              by Falcon Swift PVT. LTD.
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={
                  isActive
                    ? {
                        color: "var(--color-primary, #4f46e5)",
                        backgroundColor: "var(--color-primary-light, #eef2ff)",
                      }
                    : {}
                }
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? "font-extrabold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            style={{
              backgroundColor: "var(--color-primary, #4f46e5)",
              color: "var(--color-primary-text, #ffffff)",
            }}
            className="px-5 py-2.5 text-sm font-bold rounded-xl shadow-md hover:brightness-110 hover:shadow-lg transition-all flex items-center gap-2 active:scale-98"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Toggle Navigation"
          className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 md:hidden focus:outline-none"
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top duration-200 shadow-xl">
          <div className="flex flex-col space-y-1">
            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  style={
                    isActive
                      ? {
                          color: "var(--color-primary, #4f46e5)",
                          backgroundColor: "var(--color-primary-light, #eef2ff)",
                        }
                      : {}
                  }
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold ${
                    isActive ? "font-extrabold" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setIsMobileOpen(false)}
              className="w-full text-center py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              onClick={() => setIsMobileOpen(false)}
              style={{
                backgroundColor: "var(--color-primary, #4f46e5)",
                color: "var(--color-primary-text, #ffffff)",
              }}
              className="w-full text-center py-3 text-sm font-bold rounded-xl shadow-md text-white flex items-center justify-center gap-2"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
