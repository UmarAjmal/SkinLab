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
  Package,
  ChevronLeft,
  ChevronRight,
  FlaskConical
} from "lucide-react";

interface SidebarProps {
  userEmail: string;
  userRole: string;
}

export default function Sidebar({ userEmail, userRole }: SidebarProps) {
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

  // Save collapse state changes
  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem("skinlab_sidebar_collapsed", String(next));
      return next;
    });
  };

  const closeMobileSidebar = () => setIsMobileOpen(false);
  const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);

  const allLinks = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["Admin", "Manager", "Doctor", "Cashier"] },
    { href: "/dashboard/patients", icon: Users, label: "Patients (PRM)", roles: ["Admin", "Manager", "Doctor", "Cashier"] },
    { href: "/dashboard/services", icon: Stethoscope, label: "Services", roles: ["Admin", "Manager"] },
    { href: "/dashboard/staff", icon: Users, label: "Staff", roles: ["Admin", "Manager"] },
    { href: "/dashboard/purchases", icon: Package, label: "Purchases", roles: ["Admin", "Manager"] },
    { href: "/dashboard/pos", icon: ShoppingCart, label: "POS", roles: ["Admin", "Manager", "Cashier"] },
    { href: "/dashboard/sales", icon: BarChart3, label: "Sales History", roles: ["Admin", "Manager", "Doctor", "Cashier"] },
    { href: "/dashboard/reports", icon: BarChart3, label: "Reports", roles: ["Admin", "Manager"] },
    { href: "/dashboard/settings", icon: Settings, label: "Settings", roles: ["Admin", "Manager"] },
  ];

  const navLinks = allLinks.filter(link => link.roles.includes(userRole));

  // Desktop sidebar is effectively expanded if pinned open OR temporarily hovered while collapsed
  const isDesktopExpanded = !isCollapsed || isHovered;

  const userInitial = (userEmail ? userEmail.charAt(0) : "U").toUpperCase();
  const userName = userEmail ? userEmail.split("@")[0] : "User";

  return (
    <>
      {/* ========================================= */}
      {/* MOBILE TOP NAVIGATION BAR (< md screens)  */}
      {/* ========================================= */}
      <div className="md:hidden bg-indigo-950 text-white flex items-center justify-between px-4 py-3.5 border-b border-indigo-900/60 shrink-0 z-30">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-600/30">
            <FlaskConical className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-200 bg-clip-text text-transparent">
            Skin-Lab POS
          </span>
        </div>
        <button 
          onClick={toggleMobileSidebar} 
          aria-label="Toggle navigation menu"
          className="p-2 rounded-lg bg-indigo-900/50 hover:bg-indigo-800 text-indigo-100 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-600/30">
              <FlaskConical className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-base font-bold text-white tracking-tight">Skin-Lab</div>
              <div className="text-[11px] text-indigo-300 font-medium tracking-wide">POS & CLINIC SYSTEM</div>
            </div>
          </div>
          <button 
            onClick={closeMobileSidebar}
            aria-label="Close menu"
            className="p-1.5 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-900/60 transition-colors"
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
              <div className="mt-0.5 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-800/80 text-indigo-200 uppercase tracking-wider">
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
      {/* DESKTOP SIDEBAR (>= md screens) - Collapsible + Hover Expand + No-Scrollbar */}
      {/* ========================================================================= */}
      <div 
        className={`hidden md:block shrink-0 transition-[width] duration-300 ease-in-out ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        <aside 
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`
            fixed top-0 left-0 h-screen z-40 bg-indigo-950 text-white flex flex-col 
            border-r border-indigo-900/60 shadow-xl transition-all duration-300 ease-in-out
            ${isDesktopExpanded ? "w-64 shadow-2xl" : "w-20"}
          `}
        >
          {/* Desktop Sidebar Header */}
          <div className="h-16 px-4 border-b border-indigo-900/60 flex items-center justify-between shrink-0 relative">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-600/30 shrink-0">
                <FlaskConical className="w-5 h-5 text-white" />
              </div>
              <div className={`transition-opacity duration-200 whitespace-nowrap overflow-hidden ${
                isDesktopExpanded ? "opacity-100" : "opacity-0 w-0 pointer-events-none"
              }`}>
                <div className="text-base font-bold text-white tracking-tight leading-tight">Skin-Lab</div>
                <div className="text-[10px] text-indigo-300 font-semibold tracking-wider uppercase">POS SYSTEM</div>
              </div>
            </div>

            {/* Collapse / Expand Pin Toggle Button */}
            {isDesktopExpanded && (
              <button
                onClick={toggleCollapse}
                title={isCollapsed ? "Pin Sidebar Open" : "Collapse Sidebar to Icons"}
                className="p-1.5 rounded-lg text-indigo-300 hover:text-white hover:bg-indigo-800/60 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Desktop Navigation Links */}
          <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto no-scrollbar">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <div key={link.href} className="relative group">
                  <Link
                    href={link.href}
                    className={`
                      flex items-center h-11 rounded-xl transition-all duration-200 relative
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
                        ml-3 truncate text-sm transition-all duration-200 whitespace-nowrap
                        ${isDesktopExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden pointer-events-none"}
                      `}
                    >
                      {link.label}
                    </span>

                    {/* Active Accent Indicator */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-indigo-300 rounded-r-full" />
                    )}
                  </Link>

                  {/* Tooltip on Hover when Collapsed */}
                  {!isDesktopExpanded && (
                    <div 
                      className="
                        absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 
                        bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl 
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
            <div className="px-3 py-2 flex justify-center border-t border-indigo-900/40">
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
          <div className="p-3 border-t border-indigo-900/60 bg-indigo-950/70 mt-auto shrink-0">
            <div className={`flex items-center mb-3 ${isDesktopExpanded ? "px-1" : "justify-center"}`}>
              <div 
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold shadow-md shrink-0"
                title={userEmail}
              >
                {userInitial}
              </div>

              {isDesktopExpanded && (
                <div className="ml-3 overflow-hidden flex-1 transition-opacity duration-200">
                  <div className="text-sm font-semibold text-white truncate" title={userEmail}>
                    {userName}
                  </div>
                  <div className="mt-0.5 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-800/80 text-indigo-200 uppercase tracking-wider">
                    {userRole}
                  </div>
                </div>
              )}
            </div>

            <div className="relative group">
              <a 
                href="/api/auth/signout" 
                title={!isDesktopExpanded ? "Sign out" : undefined}
                className={`
                  flex items-center justify-center h-10 rounded-xl bg-indigo-900/60 hover:bg-red-600/90 
                  text-indigo-200 hover:text-white transition-all duration-200 text-sm font-medium shadow-sm
                  ${isDesktopExpanded ? "w-full px-3" : "w-full"}
                `}
              >
                <LogOut className={`h-4 w-4 shrink-0 ${isDesktopExpanded ? "mr-2" : ""}`} />
                {isDesktopExpanded && <span>Sign out</span>}
              </a>

              {!isDesktopExpanded && (
                <div 
                  className="
                    absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 
                    bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl 
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
      </div>
    </>
  );
}
