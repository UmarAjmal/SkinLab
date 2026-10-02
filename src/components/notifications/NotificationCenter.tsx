"use client";

import { useState, useEffect, useRef } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  X,
  AlertTriangle,
  ShoppingBag,
  Receipt,
  RotateCcw,
  CreditCard,
  Edit3,
  Info,
  ExternalLink,
  BarChart3,
  CalendarCheck,
  PackageX,
  PackagePlus,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useRouter } from "next/navigation";
import {
  requestNotificationPermission,
  sendNativeNotification,
  setupCapacitorNotificationListeners,
} from "@/lib/clientNotifications";

dayjs.extend(relativeTime);

export default function NotificationCenter({ userRole = "" }: { userRole?: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "alerts" | "closings">("all");
  const [loading, setLoading] = useState(false);

  const prevIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const fetchNotifications = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        const incomingList: any[] = data.notifications || [];
        const count: number = data.unreadCount || 0;

        // Check for brand new notifications to trigger sound & native mobile push
        if (!isFirstLoadRef.current && incomingList.length > 0) {
          const brandNew = incomingList.filter(
            (n) => !prevIdsRef.current.has(n.id) && !n.is_read
          );
          if (brandNew.length > 0) {
            const newest = brandNew[0];
            sendNativeNotification({
              title: newest.title,
              body: newest.message,
              severity: newest.severity,
              linkUrl: newest.link_url,
            });
          }
        }

        // Store seen IDs
        prevIdsRef.current = new Set(incomingList.map((n) => n.id));
        isFirstLoadRef.current = false;

        setNotifications(incomingList);
        setUnreadCount(count);
      }
    } catch (e) {
      console.error("Error fetching notifications:", e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Initial fetch and 20s polling
  useEffect(() => {
    fetchNotifications(true);
    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  // Request permissions & set up Capacitor tap listeners once on mount
  useEffect(() => {
    requestNotificationPermission().catch(() => {});
    setupCapacitorNotificationListeners((url) => {
      if (url) router.push(url);
    });
  }, [router]);

  // Close dropdown on outside click or ESC key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Mark single notification as read & navigate
  const handleMarkAsRead = async (notif: any) => {
    if (!notif.is_read) {
      try {
        await fetch(`/api/notifications/${notif.id}/read`, { method: "PUT" });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (e) {
        console.error("Error marking read:", e);
      }
    }

    if (notif.link_url) {
      setIsOpen(false);
      router.push(notif.link_url);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "PUT" });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error("Error marking all read:", e);
    }
  };

  // Clear all
  const handleClearAll = async () => {
    if (!confirm("Clear all notification logs?")) return;
    try {
      await fetch("/api/notifications/clear-all", { method: "DELETE" });
      setNotifications([]);
      setUnreadCount(0);
    } catch (e) {
      console.error("Error clearing notifications:", e);
    }
  };

  // Filtered notifications
  const filteredList = notifications.filter((n) => {
    if (activeTab === "unread") return !n.is_read;
    if (activeTab === "alerts")
      return (
        n.severity === "URGENT" ||
        n.severity === "WARNING" ||
        n.type === "OVERDUE_DUES" ||
        n.type === "LOW_STOCK_ALERT"
      );
    if (activeTab === "closings")
      return (
        n.type === "DAILY_CLOSING_SUMMARY" ||
        n.type === "MONTHLY_CLOSING_SUMMARY" ||
        n.type === "YEARLY_CLOSING_SUMMARY"
      );
    return true;
  });

  // Type icon helper
  const getNotificationIcon = (type: string, severity: string) => {
    if (type === "OVERDUE_DUES" || severity === "URGENT") {
      return (
        <div className="p-2.5 rounded-2xl bg-red-100 text-red-700 shrink-0 shadow-xs">
          <AlertTriangle className="w-4 h-4" />
        </div>
      );
    }
    if (type === "DAILY_CLOSING_SUMMARY") {
      return (
        <div className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-700 shrink-0 shadow-xs">
          <BarChart3 className="w-4 h-4" />
        </div>
      );
    }
    if (type === "MONTHLY_CLOSING_SUMMARY" || type === "YEARLY_CLOSING_SUMMARY") {
      return (
        <div className="p-2.5 rounded-2xl bg-violet-100 text-violet-700 shrink-0 shadow-xs">
          <CalendarCheck className="w-4 h-4" />
        </div>
      );
    }
    if (type === "LOW_STOCK_ALERT") {
      return (
        <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700 shrink-0 shadow-xs">
          <PackageX className="w-4 h-4" />
        </div>
      );
    }
    if (type === "PURCHASE_RECEIVED") {
      return (
        <div className="p-2.5 rounded-2xl bg-cyan-100 text-cyan-700 shrink-0 shadow-xs">
          <PackagePlus className="w-4 h-4" />
        </div>
      );
    }
    if (type === "SALE_CREATED") {
      return (
        <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700 shrink-0 shadow-xs">
          <ShoppingBag className="w-4 h-4" />
        </div>
      );
    }
    if (type === "SALE_UPDATED") {
      return (
        <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700 shrink-0 shadow-xs">
          <Edit3 className="w-4 h-4" />
        </div>
      );
    }
    if (type === "EXPENSE_CREATED" || type === "EXPENSE_UPDATED") {
      return (
        <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-700 shrink-0 shadow-xs">
          <Receipt className="w-4 h-4" />
        </div>
      );
    }
    if (type === "REFUND_PROCESSED") {
      return (
        <div className="p-2.5 rounded-2xl bg-orange-100 text-orange-700 shrink-0 shadow-xs">
          <RotateCcw className="w-4 h-4" />
        </div>
      );
    }
    if (type === "PAYMENT_RECEIVED") {
      return (
        <div className="p-2.5 rounded-2xl bg-teal-100 text-teal-700 shrink-0 shadow-xs">
          <CreditCard className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-700 shrink-0 shadow-xs">
        <Info className="w-4 h-4" />
      </div>
    );
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          requestNotificationPermission().catch(() => {});
        }}
        aria-label="View notifications"
        className="relative p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white md:text-gray-700 md:bg-white md:hover:bg-gray-100 md:border md:border-gray-200 shadow-xs transition-all active:scale-95 focus:outline-none"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-rose-600 text-white font-extrabold text-[10px] rounded-full flex items-center justify-center shadow-md animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover / Dropdown */}
      {isOpen && (
        <div className="fixed inset-x-3 top-16 md:absolute md:inset-auto md:right-0 md:top-full md:mt-2.5 w-auto md:w-[420px] max-w-[calc(100vw-24px)] bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[82vh] md:max-h-[580px]">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 bg-slate-50/90 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-1.5">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="bg-rose-100 text-rose-700 font-bold text-[10px] px-2 py-0.5 rounded-full">
                  {unreadCount} New
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 p-1.5 rounded-lg hover:bg-indigo-50 flex items-center gap-1 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mark read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs font-semibold text-gray-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Clear all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center px-3 pt-2.5 pb-2 border-b border-gray-100 bg-white gap-1.5 text-xs font-bold text-gray-500 shrink-0 overflow-x-auto">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                activeTab === "all"
                  ? "bg-indigo-50 text-indigo-700 font-black shadow-2xs"
                  : "hover:text-gray-900"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab("unread")}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                activeTab === "unread"
                  ? "bg-indigo-50 text-indigo-700 font-black shadow-2xs"
                  : "hover:text-gray-900"
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setActiveTab("closings")}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                activeTab === "closings"
                  ? "bg-violet-50 text-violet-700 font-black shadow-2xs"
                  : "hover:text-gray-900"
              }`}
            >
              Closings
            </button>
            <button
              onClick={() => setActiveTab("alerts")}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                activeTab === "alerts"
                  ? "bg-red-50 text-red-700 font-black shadow-2xs"
                  : "hover:text-gray-900"
              }`}
            >
              Alerts
            </button>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
            {loading ? (
              <div className="p-8 text-center text-xs text-gray-400">Loading clinic updates...</div>
            ) : filteredList.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <Bell className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-xs font-bold text-gray-700">No Notifications</p>
                <p className="text-[11px] text-gray-400">
                  {activeTab === "unread"
                    ? "You're all caught up with clinic updates!"
                    : activeTab === "closings"
                    ? "Day-End and Month-End closing reports will appear here."
                    : "Clinic notifications will appear here in real-time."}
                </p>
              </div>
            ) : (
              filteredList.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif)}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer group ${
                    notif.is_read
                      ? "bg-white hover:bg-slate-50/80"
                      : "bg-indigo-50/40 hover:bg-indigo-50/70"
                  }`}
                >
                  {/* Icon */}
                  {getNotificationIcon(notif.type, notif.severity)}

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                      <h4
                        className={`text-xs truncate ${
                          notif.is_read ? "font-semibold text-gray-800" : "font-extrabold text-gray-900"
                        }`}
                      >
                        {notif.title}
                      </h4>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center justify-between mt-1.5 text-[10px] text-gray-400 font-medium">
                      <span>{dayjs(notif.created_at).fromNow()}</span>
                      {notif.link_url && (
                        <span className="text-indigo-600 font-semibold group-hover:underline flex items-center gap-0.5">
                          View details <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-gray-100 text-center shrink-0">
            <span className="text-[10px] text-gray-400 font-medium">
              Role: <strong className="text-gray-700">{userRole || "Staff"}</strong> • Real-time Clinic & Mobile Push
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
