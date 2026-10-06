"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Banknote, Users, CreditCard, Activity, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import dayjs from "dayjs";
import InvoiceModal, { StatusBadge } from "@/components/InvoiceModal";

export default function DashboardPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const userEmail = session?.user?.email;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Invoice Modal State for Recent Transactions
  const [selectedSale, setSelectedSale] = useState<any>(null);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const handleManualRefresh = () => fetchDashboardData();
    window.addEventListener("refresh-active-page-data", handleManualRefresh);

    // Auto refresh every 30s
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);
    return () => {
      clearInterval(interval);
      window.removeEventListener("refresh-active-page-data", handleManualRefresh);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50/50">
        <div className="text-gray-500 animate-pulse flex items-center">
          <Activity className="w-5 h-5 mr-2 animate-spin" />
          Loading analytics...
        </div>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-red-500">Failed to load dashboard data.</div>;

  const { todayRevenue, patientsTreatedToday, activeDues, revenueTrend, topTreatments, recentTransactions } = data;

  return (
    <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6 w-full min-w-0">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 shadow-xs border border-gray-100 flex items-center">
          <div className="bg-indigo-50 p-3 sm:p-4 rounded-2xl mr-3.5 sm:mr-4 border border-indigo-100 shrink-0">
            <Banknote className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">Today's Revenue</p>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-0.5 truncate">
              PKR {(todayRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 shadow-xs border border-gray-100 flex items-center">
          <div className="bg-emerald-50 p-3 sm:p-4 rounded-2xl mr-3.5 sm:mr-4 border border-emerald-100 shrink-0">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">Patients Treated Today</p>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-0.5 truncate">
              {patientsTreatedToday || 0}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 shadow-xs border border-gray-100 flex items-center">
          <div className="bg-rose-50 p-3 sm:p-4 rounded-2xl mr-3.5 sm:mr-4 border border-rose-100 shrink-0">
            <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-rose-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">Active Pending Dues</p>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-rose-600 mt-0.5 truncate">
              PKR {(activeDues || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </h3>
          </div>
        </div>
      </div>

      {/* Middle Row: Chart & Top Treatments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">

        {/* Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xs border border-gray-100 p-4 sm:p-6 min-w-0 w-full overflow-hidden">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900">Revenue Trend (30 Days)</h3>
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          </div>
          <div className="h-60 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={(val) => `${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`PKR ${Number(value).toFixed(2)}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Treatments */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 sm:p-6 flex flex-col min-w-0 w-full overflow-hidden">
          <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-4 sm:mb-6">Top Treatments (30 Days)</h3>
          <div className="flex-1 overflow-y-auto max-h-72 sm:max-h-none">
            {topTreatments && topTreatments.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {topTreatments.map((treatment: any, index: number) => (
                  <div key={index} className="flex justify-between items-center group">
                    <div className="flex items-center min-w-0 pr-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs sm:text-sm mr-2.5 sm:mr-3 border border-indigo-100 shrink-0">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-xs sm:text-sm group-hover:text-indigo-600 transition-colors truncate">{treatment.name}</p>
                        <p className="text-[11px] text-gray-500">{treatment.count} units sold</p>
                      </div>
                    </div>
                    <div className="font-bold text-gray-900 text-xs sm:text-sm shrink-0">
                      PKR {treatment.revenue.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-500 py-6">No data available</div>
            )}
          </div>
        </div>

      </div>

      {/* Bottom Row: Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden w-full min-w-0">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <h3 className="text-base sm:text-lg font-bold text-gray-900">Recent Transactions</h3>
        </div>

        {/* Mobile Transactions List (< md) */}
        <div className="md:hidden divide-y divide-gray-100">
          {recentTransactions && recentTransactions.length > 0 ? (
            recentTransactions.map((tx: any) => (
              <div
                key={tx.id}
                onClick={() => setSelectedSale(tx)}
                className="p-3.5 space-y-2 active:bg-gray-50 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-900 text-sm">{tx.customer?.name || "Walk-in"}</div>
                  <StatusBadge status={tx.payment_status} />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{dayjs(tx.date).format("MMM DD, YYYY hh:mm A")}</span>
                  <span>{tx.doctor?.name ? `Dr. ${tx.doctor.name}` : "None"}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-gray-50 text-xs">
                  <span className="text-gray-400 font-mono">{tx.invoice_number || `#${tx.id.slice(-6)}`}</span>
                  <span className="font-bold text-gray-900 text-sm">
                    PKR {tx.grand_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-sm text-gray-500">No recent transactions.</div>
          )}
        </div>

        {/* Desktop Transactions Table (>= md) */}
        <div className="hidden md:block overflow-x-auto w-full">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Doctor</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Amount</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentTransactions && recentTransactions.length > 0 ? (
                recentTransactions.map((tx: any) => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedSale(tx)}
                    className="hover:bg-indigo-50/30 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {dayjs(tx.date).format("MMM DD, YYYY hh:mm A")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{tx.customer?.name || "Walk-in"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tx.doctor?.name || "None"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                      PKR {tx.grand_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={tx.payment_status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">No recent transactions.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REUSABLE INVOICE MODAL */}
      <InvoiceModal
        selectedSale={selectedSale}
        userRole={userRole}
        onClose={() => setSelectedSale(null)}
        onRefundComplete={() => fetchDashboardData()}
      />

    </div>
  );
}
