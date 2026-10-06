"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import { FlaskConical, RefreshCw, Menu } from "lucide-react";

interface TopHeaderProps {
  userEmail: string;
  userRole: string;
}

export default function TopHeader({ userEmail, userRole }: TopHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [clinicName, setClinicName] = useState<string>("Skin-Lab Clinic");
  const [clinicLogo, setClinicLogo] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const fetchClinicSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.name) setClinicName(data.name);
          if (data.logo) setClinicLogo(data.logo);
        } else {
          const pubRes = await fetch("/api/settings/public");
          if (pubRes.ok) {
            const pubData = await pubRes.json();
            if (pubData.name) setClinicName(pubData.name);
            if (pubData.logo) setClinicLogo(pubData.logo);
          }
        }
      } catch (e) {
        console.error("TopHeader settings fetch error:", e);
      }
    };
    fetchClinicSettings();
  }, []);

  // Determine dynamic page title from route
  const getPageTitle = (path: string): string => {
    if (path === "/dashboard") return "Dashboard Overview";
    if (path === "/dashboard/patients") return "Patients Management (PRM)";
    if (path.startsWith("/dashboard/patients/")) return "Patient Profile & Records";
    if (path === "/dashboard/services") return "Services & Packages";
    if (path === "/dashboard/staff") return "Staff & Doctors Directory";
    if (path === "/dashboard/expenses") return "Expense Management";
    if (path === "/dashboard/pos") return "Point of Sale (POS)";
    if (path === "/dashboard/sales") return "Sales History & Invoices";
    if (path === "/dashboard/reports") return "Analytics & Reports";
    if (path === "/dashboard/settings") return "Settings & Access Control";
    return "Clinic Dashboard";
  };

  const pageTitle = getPageTitle(pathname);

  // Live Refresh handler
  const handleRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    
    // Refresh Next.js server components
    router.refresh();
    
    // Broadcast custom event so client pages can refetch immediately
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("refresh-active-page-data"));
    }

    setTimeout(() => {
      setIsRefreshing(false);
    }, 750);
  };

  const handleToggleMobileSidebar = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("toggle-mobile-sidebar"));
    }
  };

  return (
    <header
      style={{ backgroundColor: "var(--color-header-bg, #ffffff)" }}
      className="w-full h-14 shrink-0 border-b border-slate-200/80 px-2.5 sm:px-6 flex items-center justify-between z-40 transition-colors duration-300 shadow-2xs select-none"
    >
      {/* ─── Left Section: Mobile Toggle + Bold Business Name + Page Title ─── */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        {/* Mobile Sidebar Hamburger Toggle */}
        <button
          type="button"
          onClick={handleToggleMobileSidebar}
          aria-label="Toggle Navigation Menu"
          className="p-2 rounded-xl md:hidden text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Business Brand (Logo + Bold Name) */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div
            style={{
              background: `linear-gradient(135deg, var(--color-primary, #4f46e5), var(--color-accent, #06b6d4))`,
            }}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shadow-xs overflow-hidden shrink-0"
          >
            {clinicLogo ? (
              <img
                src={clinicLogo}
                alt={clinicName}
                className="w-full h-full object-contain p-0.5 bg-white/10"
              />
            ) : (
              <FlaskConical className="w-4 h-4 text-white" />
            )}
          </div>

          <span
            className="font-black text-slate-900 text-xs sm:text-base tracking-tight truncate max-w-[110px] min-[380px]:max-w-[150px] sm:max-w-[280px]"
            title={clinicName}
          >
            {clinicName}
          </span>
        </div>

        {/* Divider & Dynamic Page Title */}
        <div className="hidden sm:flex items-center min-w-0">
          <span className="text-slate-300 mx-1.5 sm:mx-2 text-sm font-semibold">/</span>
          <span
            style={{ color: "var(--color-primary, #4f46e5)" }}
            className="text-xs sm:text-sm font-bold truncate max-w-[200px] lg:max-w-[360px]"
          >
            {pageTitle}
          </span>
        </div>
      </div>

      {/* ─── Right Section: Live Refresh Button + Notification Bell ─── */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Live Page Refresh Button */}
        <button
          type="button"
          onClick={handleRefresh}
          title="Refresh current page data"
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-75"
        >
          <RefreshCw
            style={isRefreshing ? { color: "var(--color-primary, #4f46e5)" } : {}}
            className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
          />
          <span className="hidden md:inline">
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </span>
        </button>

        {/* Real-Time Notification Bell */}
        <NotificationCenter userRole={userRole} />
      </div>
    </header>
  );
}
