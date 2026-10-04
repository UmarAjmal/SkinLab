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
  X,
  ChevronLeft,
  ChevronRight,
  Receipt,
} from "lucide-react";

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
  const pathname = usePathname();

  // Load saved collapse preference from localStorage
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("skinlab_sidebar_collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  // Listen to mobile menu toggle event from TopHeader
  useEffect(() => {
    const handleToggle = () => setIsMobileOpen((prev) => !prev);
    if (typeof window !== "undefined") {
      window.addEventListener("toggle-mobile-sidebar", handleToggle);
      return () => window.removeEventListener("toggle-mobile-sidebar", handleToggle);
    }
  }, []);

  // Auto-close mobile drawer upon route navigation
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

  const allLinks = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", module: "dashboard", roles: ["Admin", "Manager", "Doctor", "Cashier"] },
    { href: "/dashboard/patients", icon: Users, label: "Patients (PRM)", module: "patients", roles: ["Admin", "Manager", "Doctor", "Cashier"] },
    { href: "/dashboard/services", icon: Stethoscope, label: "Services", module: "services", roles: ["Admin", "Manager"] },
    { href: "/dashboard/staff", icon: Users, label: "Staff", module: "staff", roles: ["Admin", "Manager"] },
    { href: "/dashboard/expenses", icon: Receipt, label: "Expenses", module: "expenses", roles: ["Admin", "Manager", "Cashier"] },
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
      {/* MOBILE BACKDROP OVERLAY (< md screens)    */}
      {/* ========================================= */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 md:hidden transition-opacity duration-300 animate-in fade-in"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      {/* ========================================= */}
      {/* MOBILE DRAWER SIDEBAR (< md screens)      */}
      {/* ========================================= */}
      <aside
        style={{ backgroundColor: "var(--color-sidebar-bg, #0f172a)" }}
        className={`
          fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] text-white flex flex-col 
          border-r border-white/10 shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Mobile Drawer Top Bar */}
        <div className="px-4 py-3.5 border-b border-white/10 flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-white/80">
            Navigation Menu
          </span>
          <button
            onClick={closeMobileSidebar}
            aria-label="Close menu"
            className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
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
                style={
                  isActive
                    ? {
                        backgroundColor: "var(--color-sidebar-active, #4f46e5)",
                        color: "var(--color-primary-text, #ffffff)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      }
                    : {
                        color: "var(--color-sidebar-text, #cbd5e1)",
                      }
                }
                className={`
                  flex items-center px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-150
                  ${!isActive ? "hover:bg-white/10 hover:text-white" : "font-semibold"}
                `}
              >
                <Icon className={`h-5 w-5 mr-3 shrink-0 ${isActive ? "text-white" : "opacity-80"}`} />
                <span className="truncate">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile User Profile & Logout */}
        <div className="p-4 border-t border-white/10 bg-black/20 mt-auto">
          <div className="flex items-center mb-3.5">
            <div 
              style={{ 
                background: `linear-gradient(135deg, var(--color-primary, #4f46e5), var(--color-accent, #06b6d4))` 
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md shrink-0"
            >
              {userInitial}
            </div>
            <div className="ml-3 overflow-hidden flex-1">
              <div className="text-sm font-semibold text-white truncate" title={userEmail}>
                {userName}
              </div>
              <div 
                style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "var(--color-sidebar-text, #cbd5e1)" }}
                className="mt-0.5 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
              >
                {userRole}
              </div>
            </div>
          </div>
          <a
            href="/api/auth/signout"
            className="flex items-center justify-center w-full py-2.5 px-3 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition-all text-sm font-medium group shadow-sm"
          >
            <LogOut className="mr-2 h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Sign out</span>
          </a>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* DESKTOP SIDEBAR (>= md screens) - Starts below full-width TopHeader        */}
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
        style={{ backgroundColor: "var(--color-sidebar-bg, #0f172a)" }}
        className={`
          hidden md:flex flex-col h-full shrink-0 text-white 
          border-r border-white/10 z-30 transition-all duration-300 ease-in-out select-none
          ${isDesktopExpanded ? "w-64 shadow-xl" : "w-20 shadow-md"}
        `}
      >
        {/* Desktop Sidebar Collapse Toggle Header */}
        <div className={`h-11 px-3 border-b border-white/10 flex items-center shrink-0 ${isDesktopExpanded ? "justify-between" : "justify-center"}`}>
          {isDesktopExpanded && (
            <span style={{ color: "var(--color-sidebar-text, #cbd5e1)" }} className="text-[11px] font-bold uppercase tracking-wider opacity-75">
              Menu
            </span>
          )}
          <button
            onClick={toggleCollapse}
            title={isCollapsed ? "Pin Sidebar Open (Expanded)" : "Collapse Sidebar (Compact Icon Mode)"}
            className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors focus:outline-none shrink-0"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="flex-1 py-3 px-2.5 space-y-1.5 overflow-y-auto no-scrollbar">
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
                  style={
                    isActive
                      ? {
                          backgroundColor: "var(--color-sidebar-active, #4f46e5)",
                          color: "var(--color-primary-text, #ffffff)",
                          boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
                        }
                      : {
                          color: "var(--color-sidebar-text, #cbd5e1)",
                        }
                  }
                  className={`
                    flex items-center h-11 rounded-xl transition-all duration-200 relative overflow-hidden
                    ${isDesktopExpanded ? "px-3.5" : "justify-center px-0"}
                    ${!isActive ? "hover:bg-white/10 hover:text-white font-medium" : "font-semibold"}
                  `}
                >
                  <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : "opacity-80 group-hover:opacity-100"}`} />

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
                    <span 
                      style={{ backgroundColor: "var(--color-accent, #06b6d4)" }}
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full" 
                    />
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
                      transition-all duration-150 border border-white/10
                    "
                  >
                    {link.label}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Desktop User Profile & Logout Footer */}
        <div className="p-3 border-t border-white/10 bg-black/20 mt-auto shrink-0 overflow-hidden">
          <div className={`flex items-center mb-3 ${isDesktopExpanded ? "px-1" : "justify-center"}`}>
            <div
              style={{ 
                background: `linear-gradient(135deg, var(--color-primary, #4f46e5), var(--color-accent, #06b6d4))` 
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md shrink-0"
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
              <div 
                style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "var(--color-sidebar-text, #cbd5e1)" }}
                className="mt-0.5 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
              >
                {userRole}
              </div>
            </div>
          </div>

          <div className="relative group">
            <a
              href="/api/auth/signout"
              title={!isDesktopExpanded ? "Sign out" : undefined}
              className={`
                flex items-center justify-center h-10 rounded-xl bg-white/10 hover:bg-rose-600 
                text-white transition-all duration-200 text-sm font-medium shadow-sm overflow-hidden
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
                  group-hover:opacity-100 transition-all duration-150 border border-white/10
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
