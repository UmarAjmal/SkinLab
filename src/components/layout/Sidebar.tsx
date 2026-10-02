"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  LayoutDashboard,
  Stethoscope,
  ShoppingCart,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Receipt,
} from "lucide-react";
import NotificationCenter from "@/components/notifications/NotificationCenter";

interface SidebarProps {
  userEmail: string;
  userRole: string;
  userPermissions?: any[];
}

export default function Sidebar({ userEmail, userRole, userPermissions = [] }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [clinicName, setClinicName] = useState("Skin-Lab");
  const [clinicLogo, setClinicLogo] = useState<string | null>(null);
  const pathname = usePathname();

  // Fetch clinic settings for branding
  useEffect(() => {
    const fetchClinicSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.name) setClinicName(data.name);
          if (data.logo) setClinicLogo(data.logo);
        }
      } catch (err) {
        console.error("Failed to load clinic settings in sidebar:", err);
      }
    };
    fetchClinicSettings();
  }, []);

  // Load saved collapse preference from localStorage
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("skinlab_sidebar_collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  // Auto-close mobile drawer and reset desktop hover state upon route navigation
  useEffect(() => {
    setIsMobileOpen(false);
    setIsHovered(false);
  }, [pathname]);

  // Save collapse state changes
  const toggleCollapse = () => {
    setIsHovered(false);
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("skinlab_sidebar_collapsed", String(next));
      return next;
    });
  };

  const closeMobileSidebar = () => setIsMobileOpen(false);
  const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);

  const allLinks = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", module: "dashboard", roles: ["Admin", "Manager", "Doctor", "Cashier"] },
    { href: "/dashboard/patients", icon: Users, label: "Patients (PRM)", module: "patients", roles: ["Admin", "Manager", "Doctor", "Cashier"] },
    { href: "/dashboard/services", icon: Stethoscope, label: "Services", module: "services", roles: ["Admin", "Manager"] },
    { href: "/dashboard/staff", icon: Users, label: "Staff", module: "staff", roles: ["Admin", "Manager"] },
    { href: "/dashboard/expenses", icon: Receipt, label: "Expenses", module: "expenses", roles: ["Admin", "Manager", "Cashier"] },
    // { href: "/dashboard/purchases", icon: Package, label: "Purchases", module: "purchases", roles: ["Admin", "Manager"] },
    { href: "/dashboard/pos", icon: ShoppingCart, label: "POS", module: "pos", roles: ["Admin", "Manager", "Cashier"] },
    { href: "/dashboard/sales", icon: BarChart3, label: "Sales History", module: "sales", roles: ["Admin", "Manager", "Doctor", "Cashier"] },
    { href: "/dashboard/reports", icon: BarChart3, label: "Reports", module: "reports", roles: ["Admin", "Manager"] },
    { href: "/dashboard/settings", icon: Settings, label: "Settings", module: "settings", roles: ["Admin", "Manager"] },
  ];

  const navLinks = allLinks.filter((link) => {
    if (userRole === "Admin") return true;
    if (Array.isArray(userPermissions) && userPermissions.length > 0) {
      const p = userPermissions.find((perm: any) => perm.module === link.module);
      if (p !== undefined) {
        return p.can_read === true;
      }
    }
    return link.roles.includes(userRole);
  });

  // Desktop sidebar is effectively expanded if pinned open OR temporarily hovered while in collapsed mode
  const isDesktopExpanded = !isCollapsed || isHovered;

  const userInitial = (userEmail ? userEmail.charAt(0) : "U").toUpperCase();
  const userName = userEmail ? userEmail.split("@")[0] : "User";

  return (
    <>
      {/* ========================================= */}
      {/* MOBILE TOP NAVIGATION BAR (< md screens)  */}
      {/* ========================================= */}
      <div className="md:hidden bg-indigo-950 text-white flex items-center justify-between px-4 py-3 border-b border-indigo-900/60 shrink-0 z-30">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-600/30 overflow-hidden shrink-0">
            {clinicLogo ? (
              <img
                src={clinicLogo}
                alt={clinicName}
                className="w-full h-full object-contain p-0.5 bg-white/10"
              />
            ) : (
              <FlaskConical className="w-5 h-5 text-white" />
            )}
          </div>
          <span className="text-base font-bold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-200 bg-clip-text text-transparent truncate max-w-[170px]">
            {clinicName}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <NotificationCenter userRole={userRole} />
          <button
            onClick={toggleMobileSidebar}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-xl bg-indigo-900/50 hover:bg-indigo-800 text-indigo-100 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* ========================================= */}
      {/* MOBILE BACKDROP OVERLAY (< md screens)    */}
      {/* ========================================= */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300 animate-in fade-in"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      {/* ========================================= */}
      {/* MOBILE DRAWER SIDEBAR (< md screens)      */}
      {/* ========================================= */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-indigo-950 text-white flex flex-col 
          border-r border-indigo-900/60 shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Mobile Drawer Header */}
        <div className="p-4 border-b border-indigo-900/60 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-600/30 overflow-hidden shrink-0">
              {clinicLogo ? (
                <img
                  src={clinicLogo}
                  alt={clinicName}
                  className="w-full h-full object-contain p-1 bg-white/10"
                />
              ) : (
                <FlaskConical className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <div className="text-base font-bold text-white tracking-tight truncate max-w-[160px]">{clinicName}</div>
              <div className="text-[10px] text-indigo-300 font-semibold tracking-wide uppercase">POS &amp; CLINIC SYSTEM</div>
            </div>
          </div>
          <button
            onClick={closeMobileSidebar}
            aria-label="Close menu"
            className="p-1.5 rounded-xl text-indigo-300 hover:text-white hover:bg-indigo-900/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Navigation Links */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto no-scrollbar">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={true}
                onClick={closeMobileSidebar}
                className={`
                  flex items-center px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-150
                  ${isActive 
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold" 
                    : "text-indigo-200 hover:bg-indigo-900/70 hover:text-white"
                  }
                `}
              >
                <Icon className={`h-5 w-5 mr-3 shrink-0 ${isActive ? "text-white" : "text-indigo-300"}`} />
                <span className="truncate">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile User Profile & Logout */}
        <div className="p-4 border-t border-indigo-900/60 bg-indigo-950/80 mt-auto">
          <div className="flex items-center mb-3.5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold shadow-md shrink-0">
              {userInitial}
            </div>
            <div className="ml-3 overflow-hidden flex-1">
              <div className="text-sm font-semibold text-white truncate" title={userEmail}>
                {userName}
              </div>
              <div className="mt-0.5 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-800/80 text-indigo-200 uppercase tracking-wider">
                {userRole}
              </div>
            </div>
          </div>
          <a
            href="/api/auth/signout"
            className="flex items-center justify-center w-full py-2.5 px-3 rounded-xl bg-indigo-900/80 hover:bg-red-600/90 text-indigo-200 hover:text-white transition-all text-sm font-medium group shadow-sm"
          >
            <LogOut className="mr-2 h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Sign out</span>
          </a>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* DESKTOP SIDEBAR (>= md screens) - Auto Layout Adjust + Collapsible + Hover */}
      {/* ========================================================================= */}
      <aside
        onMouseEnter={() => {
          if (isCollapsed) {
            setIsHovered(true);
          }
        }}
        onMouseLeave={() => {
          if (isCollapsed) {
            setIsHovered(false);
          }
        }}
        className={`
          hidden md:flex flex-col h-screen shrink-0 bg-indigo-950 text-white 
          border-r border-indigo-900/60 z-30 transition-all duration-300 ease-in-out
          ${isDesktopExpanded ? "w-64 shadow-2xl" : "w-20 shadow-md"}
        `}
      >
        {/* Desktop Sidebar Header */}
        <div className="h-16 px-3.5 border-b border-indigo-900/60 flex items-center justify-between shrink-0 relative overflow-hidden">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-600/30 shrink-0 overflow-hidden">
              {clinicLogo ? (
                <img
                  src={clinicLogo}
                  alt={clinicName}
                  className="w-full h-full object-contain p-1 bg-white/10"
                />
              ) : (
                <FlaskConical className="w-5 h-5 text-white" />
              )}
            </div>
            <div className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${
              isDesktopExpanded ? "opacity-100 max-w-[130px]" : "opacity-0 max-w-0 pointer-events-none"
            }`}>
              <div className="text-base font-bold text-white tracking-tight leading-tight truncate" title={clinicName}>
                {clinicName}
              </div>
              <div className="text-[10px] text-indigo-300 font-semibold tracking-wider uppercase">POS SYSTEM</div>
            </div>
          </div>

          {/* Collapse / Expand Pin Toggle Button */}
          {isDesktopExpanded && (
            <button
              onClick={toggleCollapse}
              title={isCollapsed ? "Pin Sidebar Open (Keep Expanded)" : "Collapse Sidebar (Compact Icon Mode)"}
              className="p-1.5 rounded-xl text-indigo-300 hover:text-white hover:bg-indigo-800/60 transition-colors focus:outline-none shrink-0"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Desktop Navigation Links */}
        <nav className="flex-1 py-4 px-2.5 space-y-1.5 overflow-y-auto no-scrollbar">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <div key={link.href} className="relative group">
                <Link
                  href={link.href}
                  prefetch={true}
                  onClick={() => {
                    if (isCollapsed) {
                      setIsHovered(false);
                    }
                  }}
                  className={`
                    flex items-center h-11 rounded-xl transition-all duration-200 relative overflow-hidden
                    ${isDesktopExpanded ? "px-3.5" : "justify-center px-0"}
                    ${isActive 
                      ? "bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30" 
                      : "text-indigo-200 hover:bg-indigo-900/60 hover:text-white font-medium"
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : "text-indigo-300 group-hover:text-white"}`} />

                  {/* Link Label Text for Expanded Mode */}
                  <span
                    className={`
                      ml-3 truncate text-sm transition-all duration-300 whitespace-nowrap
                      ${isDesktopExpanded ? "opacity-100 max-w-[150px]" : "opacity-0 max-w-0 overflow-hidden pointer-events-none"}
                    `}
                  >
                    {link.label}
                  </span>

                  {/* Active Accent Indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-indigo-300 rounded-r-full" />
                  )}
                </Link>

                {/* Floating Tooltip when Collapsed and not Hover-expanded */}
                {!isDesktopExpanded && (
                  <div
                    className="
                      absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 
                      bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl 
                      whitespace-nowrap z-50 pointer-events-none opacity-0 
                      group-hover:opacity-100 group-hover:translate-x-0 -translate-x-1
                      transition-all duration-150 border border-indigo-800/50
                    "
                  >
                    {link.label}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Desktop Collapse Toggle for Collapsed Icon Mode */}
        {!isDesktopExpanded && (
          <div className="px-2 py-2 flex justify-center border-t border-indigo-900/40 shrink-0">
            <button
              onClick={toggleCollapse}
              title="Expand & Pin Sidebar"
              className="p-2 rounded-xl text-indigo-300 hover:text-white hover:bg-indigo-800/60 transition-colors focus:outline-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Desktop User Profile & Logout Footer */}
        <div className="p-3 border-t border-indigo-900/60 bg-indigo-950/70 mt-auto shrink-0 overflow-hidden">
          <div className={`flex items-center mb-3 ${isDesktopExpanded ? "px-1" : "justify-center"}`}>
            <div
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold shadow-md shrink-0"
              title={userEmail}
            >
              {userInitial}
            </div>

            <div className={`ml-3 overflow-hidden flex-1 transition-all duration-300 ${
              isDesktopExpanded ? "opacity-100 max-w-[140px]" : "opacity-0 max-w-0 pointer-events-none"
            }`}>
              <div className="text-sm font-semibold text-white truncate" title={userEmail}>
                {userName}
              </div>
              <div className="mt-0.5 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-800/80 text-indigo-200 uppercase tracking-wider">
                {userRole}
              </div>
            </div>
          </div>

          <div className="relative group">
            <a
              href="/api/auth/signout"
              title={!isDesktopExpanded ? "Sign out" : undefined}
              className={`
                flex items-center justify-center h-10 rounded-xl bg-indigo-900/60 hover:bg-red-600/90 
                text-indigo-200 hover:text-white transition-all duration-200 text-sm font-medium shadow-sm overflow-hidden
                ${isDesktopExpanded ? "w-full px-3" : "w-full"}
              `}
            >
              <LogOut className={`h-4 w-4 shrink-0 ${isDesktopExpanded ? "mr-2" : ""}`} />
              <span className={`transition-all duration-300 whitespace-nowrap ${
                isDesktopExpanded ? "opacity-100 max-w-[100px]" : "opacity-0 max-w-0 overflow-hidden pointer-events-none"
              }`}>
                Sign out
              </span>
            </a>

            {!isDesktopExpanded && (
              <div
                className="
                  absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 
                  bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl 
                  whitespace-nowrap z-50 pointer-events-none opacity-0 
                  group-hover:opacity-100 transition-all duration-150 border border-indigo-800/50
                "
              >
                Sign out
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
