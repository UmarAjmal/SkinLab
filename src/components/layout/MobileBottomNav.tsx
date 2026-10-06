"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Receipt,
  Menu,
} from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();

  const handleOpenMobileSidebar = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("toggle-mobile-sidebar"));
    }
  };

  const navItems = [
    {
      label: "Home",
      href: "/dashboard",
      icon: LayoutDashboard,
      isActive: pathname === "/dashboard",
    },
    {
      label: "PRM",
      href: "/dashboard/patients",
      icon: Users,
      isActive: pathname.startsWith("/dashboard/patients"),
    },
    {
      label: "POS Bill",
      href: "/dashboard/pos",
      icon: ShoppingCart,
      isSpecial: true,
      isActive: pathname === "/dashboard/pos",
    },
    {
      label: "Sales",
      href: "/dashboard/sales",
      icon: Receipt,
      isActive: pathname === "/dashboard/sales",
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation Bar"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)] transition-all select-none"
    >
      <div className="flex items-center justify-around h-14 px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.isSpecial) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -top-3 flex flex-col items-center group focus:outline-none"
              >
                <div
                  style={{
                    background: `linear-gradient(135deg, var(--color-primary, #4f46e5), var(--color-accent, #06b6d4))`,
                    boxShadow: "0 6px 16px rgba(79, 70, 229, 0.35)",
                  }}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-transform ${
                    item.isActive ? "ring-2 ring-indigo-400 ring-offset-2" : ""
                  }`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span
                  style={item.isActive ? { color: "var(--color-primary, #4f46e5)" } : {}}
                  className="text-[10px] font-black mt-0.5 tracking-tight text-slate-800"
                >
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              style={item.isActive ? { color: "var(--color-primary, #4f46e5)" } : {}}
              className={`flex flex-col items-center justify-center w-14 h-full py-1 text-slate-500 hover:text-slate-900 active:scale-95 transition-all focus:outline-none ${
                item.isActive ? "font-bold" : "font-medium"
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform ${
                  item.isActive ? "scale-110" : "opacity-80"
                }`}
              />
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[50px]">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* More / Menu Drawer Toggle */}
        <button
          type="button"
          onClick={handleOpenMobileSidebar}
          aria-label="Open Full Menu"
          className="flex flex-col items-center justify-center w-14 h-full py-1 text-slate-500 hover:text-slate-900 active:scale-95 transition-all focus:outline-none font-medium"
        >
          <Menu className="w-5 h-5 opacity-80" />
          <span className="text-[10px] mt-0.5 tracking-tight">Menu</span>
        </button>
      </div>
    </nav>
  );
}
