"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Edit3, Eye, FileText } from "lucide-react";
import dayjs from "dayjs";
import { useSession } from "next-auth/react";
import InvoiceModal, { StatusBadge } from "@/components/InvoiceModal";
import EditInvoiceModal from "@/components/EditInvoiceModal";

export default function SalesHistoryPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "";

  const [activeTab, setActiveTab] = useState<"sales" | "returns">("sales");
  const [sales, setSales] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal State
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [editingSale, setEditingSale] = useState<any>(null);

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const fetchSales = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.append("search", search);
      if (statusFilter !== "ALL") query.append("status", statusFilter);

      const res = await fetch(`/api/sales?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSales(Array.isArray(data) ? data : []);
      } else {
        setSales([]);
      }
    } catch (e) {
      console.error(e);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/returns`);
      if (res.ok) {
        const data = await res.json();
        setReturns(Array.isArray(data) ? data : []);
      } else {
        setReturns([]);
      }
    } catch (e) {
      console.error(e);
      setReturns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleManualRefresh = () => {
      if (activeTab === "sales") fetchSales();
      else fetchReturns();
    };
    window.addEventListener("refresh-active-page-data", handleManualRefresh);
    return () => window.removeEventListener("refresh-active-page-data", handleManualRefresh);
  }, [activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === "sales") {
        fetchSales();
      } else {
        fetchReturns();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, activeTab]);

  const processPayment = async () => {
    if (!selectedSale) return;
    setPaymentError("");
    setPaymentProcessing(true);

    try {
      const res = await fetch(`/api/sales/${selectedSale.id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(paymentAmount), payment_method: paymentMethod })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process payment");

      setIsPaymentModalOpen(false);
      setSelectedSale(null);
      fetchSales();
    } catch (e: any) {
      setPaymentError(e.message);
    } finally {
      setPaymentProcessing(false);
    }
  };

  return (
    <div className="space-y-6 w-full min-w-0">
      <div className="flex justify-start sm:justify-end items-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 flex">
          <button
            onClick={() => setActiveTab("sales")}
            className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${activeTab === "sales" ? "bg-indigo-50 text-indigo-700" : "text-gray-500 hover:text-gray-700"}`}
          >
            Sales History
          </button>
          <button
            onClick={() => setActiveTab("returns")}
            className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors ${activeTab === "returns" ? "bg-indigo-50 text-indigo-700" : "text-gray-500 hover:text-gray-700"}`}
          >
            Returns Log
          </button>
        </div>
      </div>

      {activeTab === "sales" && (
        <>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Invoice # or Customer..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900 bg-white font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                className="border-gray-200 rounded-xl text-sm focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 bg-white font-medium px-3.5 py-2"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="PAID">Paid</option>
                <option value="PARTIAL">Partial</option>
                <option value="DUE">Due</option>
              </select>
            </div>
          </div>

          {/* MOBILE SALES CARDS (< md screens) */}
          <div className="md:hidden space-y-3">
            {loading ? (
              <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center text-gray-500 text-sm">
                Loading sales records...
              </div>
            ) : sales.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center text-gray-500 text-sm">
                No sales records found.
              </div>
            ) : (
              sales.map((sale) => {
                const balanceDue = Math.max(0, sale.grand_total - (sale.paid_amount || 0));
                return (
                  <div
                    key={sale.id}
                    onClick={() => setSelectedSale(sale)}
                    className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-2xs space-y-3 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-lg">
                          {sale.invoice_number}
                        </span>
                        <div className="font-bold text-slate-900 text-sm mt-1.5">{sale.customer?.name || "Walk-in Customer"}</div>
                        {sale.customer?.phone && (
                          <div className="text-xs text-slate-500 font-mono mt-0.5">{sale.customer.phone}</div>
                        )}
                      </div>

                      <div className="text-right">
                        <StatusBadge status={sale.payment_status} />
                        <div className="text-[11px] text-slate-400 mt-1">
                          {dayjs(sale.date).format("DD-MMM-YYYY")}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Grand Total</span>
                        <span className="font-black text-slate-900 text-sm">
                          PKR {sale.grand_total.toFixed(0)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Paid / Due</span>
                        <span className="font-bold text-emerald-700">PKR {(sale.paid_amount || 0).toFixed(0)}</span>
                        {balanceDue > 0 && (
                          <span className="text-rose-600 font-bold ml-1.5">(Due: {balanceDue.toFixed(0)})</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                      {["Admin", "Manager"].includes(userRole) && (
                        <button
                          type="button"
                          onClick={() => setEditingSale(sale)}
                          className="px-3 py-1.5 rounded-xl border border-indigo-200 text-indigo-700 bg-indigo-50/70 text-xs font-bold flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedSale(sale)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 bg-slate-50 text-xs font-semibold flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* DESKTOP SALES TABLE (>= md screens) */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden w-full min-w-0">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-4 font-semibold text-sm text-gray-600">Date</th>
                    <th className="p-4 font-semibold text-sm text-gray-600">Invoice</th>
                    <th className="p-4 font-semibold text-sm text-gray-600">Customer</th>
                    <th className="p-4 font-semibold text-sm text-gray-600 text-right">Grand Total</th>
                    <th className="p-4 font-semibold text-sm text-gray-600 text-right">Paid Amount</th>
                    <th className="p-4 font-semibold text-sm text-gray-600 text-right">Balance Due</th>
                    <th className="p-4 font-semibold text-sm text-gray-600 text-center">Status</th>
                    <th className="p-4 font-semibold text-sm text-gray-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan={8} className="p-8 text-center text-gray-500">Loading sales data...</td></tr>
                  ) : sales.length === 0 ? (
                    <tr><td colSpan={8} className="p-8 text-center text-gray-500">No sales found.</td></tr>
                  ) : (
                    sales.map((sale) => {
                      const balanceDue = Math.max(0, sale.grand_total - (sale.paid_amount || 0));
                      return (
                        <tr key={sale.id} className="hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => setSelectedSale(sale)}>
                          <td className="p-4 text-sm text-gray-900 whitespace-nowrap">
                            {dayjs(sale.date).format("MMM DD, YYYY")}
                          </td>
                          <td className="p-4">
                            <span className="font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg text-xs font-mono">{sale.invoice_number}</span>
                          </td>
                          <td className="p-4">
                            <div className="font-medium text-gray-900 text-sm">{sale.customer?.name || "Unknown"}</div>
                            {sale.customer?.phone && (
                              <div className="text-xs text-gray-500">{sale.customer.phone}</div>
                            )}
                          </td>
                          <td className="p-4 text-right font-bold text-gray-900 text-sm">
                            PKR {sale.grand_total.toFixed(2)}
                          </td>
                          <td className="p-4 text-right font-bold text-emerald-700 text-sm">
                            PKR {(sale.paid_amount || 0).toFixed(2)}
                          </td>
                          <td className="p-4 text-right font-medium text-sm">
                            {balanceDue > 0 ? (
                              <span className="text-rose-600 font-bold">PKR {balanceDue.toFixed(2)}</span>
                            ) : (
                              <span className="text-gray-400">PKR 0.00</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <StatusBadge status={sale.payment_status} />
                          </td>
                          <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit Invoice Button */}
                              {["Admin", "Manager"].includes(userRole) && (
                                <button
                                  type="button"
                                  onClick={() => setEditingSale(sale)}
                                  title="Edit Invoice"
                                  className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100/60 rounded-xl transition-colors border border-indigo-200 bg-indigo-50/60"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              )}

                              {/* View Details Button */}
                              <button
                                type="button"
                                onClick={() => setSelectedSale(sale)}
                                title="View Invoice Details"
                                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "returns" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full min-w-0">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-4 font-semibold text-sm text-gray-600">Return Date</th>
                  <th className="p-4 font-semibold text-sm text-gray-600">Original Invoice</th>
                  <th className="p-4 font-semibold text-sm text-gray-600">Customer</th>
                  <th className="p-4 font-semibold text-sm text-gray-600">Reason</th>
                  <th className="p-4 font-semibold text-sm text-gray-600 text-right">Refund Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading returns...</td></tr>
                ) : returns.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500">No returns found.</td></tr>
                ) : (
                  returns.map((ret) => (
                    <tr key={ret.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm text-gray-900 whitespace-nowrap">
                        {dayjs(ret.date).format("MMM DD, YYYY hh:mm A")}
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">{ret.sale?.invoice_number}</span>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-gray-900">{ret.sale?.customer?.name || "Unknown"}</div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {ret.reason}
                      </td>
                      <td className="p-4 text-right font-medium text-red-600">
                        - {ret.refund_amount.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT INVOICE MODAL */}
      {editingSale && (
        <EditInvoiceModal
          sale={editingSale}
          onClose={() => setEditingSale(null)}
          onSaveComplete={() => fetchSales()}
        />
      )}

      {/* EXTRACTED INVOICE MODAL */}
      <InvoiceModal
        selectedSale={selectedSale}
        userRole={userRole}
        onClose={() => setSelectedSale(null)}
        onOpenPayment={(amount) => {
          setPaymentAmount(amount);
          setPaymentMethod("Cash");
          setIsPaymentModalOpen(true);
        }}
        onRefundComplete={() => fetchSales()}
      />

      {/* PAYMENT MODAL */}
      {isPaymentModalOpen && selectedSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[60] flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 mx-auto border border-gray-100 max-h-[92vh] flex flex-col">
            <h3 className="font-bold text-gray-900 text-lg mb-4 shrink-0">Process Payment</h3>
            <div className="overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Amount to collect</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-xs">PKR</span>
                  <input
                    type="number"
                    step="0.01"
                    max={(selectedSale.grand_total - (selectedSale.paid_amount || 0)).toFixed(2)}
                    className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900 bg-white font-bold"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Payment Method</label>
                <select className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-slate-900 bg-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
              {paymentError && <div className="text-red-600 text-xs font-medium bg-red-50 p-3 rounded-xl border border-red-200">{paymentError}</div>}
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4 shrink-0">
              <button onClick={() => { setIsPaymentModalOpen(false); setPaymentError(""); }} className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-semibold transition-colors">Cancel</button>
              <button onClick={processPayment} disabled={paymentProcessing} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-60 transition-all">{paymentProcessing ? "Processing..." : "Collect Payment"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
