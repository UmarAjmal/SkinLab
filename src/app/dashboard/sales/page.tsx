"use client";

import { useState, useEffect } from "react";
import { Search, Filter } from "lucide-react";
import dayjs from "dayjs";
import { useSession } from "next-auth/react";
import InvoiceModal, { StatusBadge } from "@/components/InvoiceModal";

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

      const res = await fetch(`/api/sales? {query.toString()}`);
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
      const res = await fetch(`/api/sales/ {selectedSale.id}/payment`, {
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales & Returns</h1>
          <p className="text-gray-500 text-sm mt-1">View past transactions, process payments, or handle refunds.</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 flex">
          <button
            onClick={() => setActiveTab("sales")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md  {activeTab === "sales" ? "bg-indigo-50 text-indigo-700" : "text-gray-500 hover:text-gray-700"}`}
          >
            Sales History
          </button>
          <button
            onClick={() => setActiveTab("returns")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md  {activeTab === "returns" ? "bg-indigo-50 text-indigo-700" : "text-gray-500 hover:text-gray-700"}`}
          >
            Returns Log
          </button>
        </div>
      </div>

      {activeTab === "sales" && (
        <>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Invoice # or Customer..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                className="border-gray-200 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
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

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full min-w-0">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-4 font-semibold text-sm text-gray-600">Date</th>
                    <th className="p-4 font-semibold text-sm text-gray-600">Invoice</th>
                    <th className="p-4 font-semibold text-sm text-gray-600">Customer</th>
                    <th className="p-4 font-semibold text-sm text-gray-600 text-right">Amount</th>
                    <th className="p-4 font-semibold text-sm text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading sales data...</td></tr>
                  ) : sales.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-500">No sales found.</td></tr>
                  ) : (
                    sales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => setSelectedSale(sale)}>
                        <td className="p-4 text-sm text-gray-900 whitespace-nowrap">
                          {dayjs(sale.date).format("MMM DD, YYYY")}
                        </td>
                        <td className="p-4">
                          <span className="font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{sale.invoice_number}</span>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-gray-900">{sale.customer?.name || "Unknown"}</div>
                        </td>
                        <td className="p-4 text-right font-medium text-gray-900">
                          {sale.grand_total.toFixed(2)}
                        </td>
                        <td className="p-4">
                          <StatusBadge status={sale.payment_status} />
                        </td>
                      </tr>
                    ))
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 mx-auto">
            <h3 className="font-bold text-gray-900 text-lg mb-4">Process Payment</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount to collect</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"> </span>
                <input
                  type="number"
                  step="0.01"
                  max={(selectedSale.grand_total - (selectedSale.paid_amount || 0)).toFixed(2)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select className="w-full px-4 py-2 border border-gray-200 rounded-lg" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
            {paymentError && <div className="text-red-600 text-sm mb-4 bg-red-50 p-2 rounded">{paymentError}</div>}
            <div className="flex justify-end gap-3">
              <button onClick={() => { setIsPaymentModalOpen(false); setPaymentError(""); }} className="px-4 py-2 text-gray-600 rounded-lg text-sm">Cancel</button>
              <button onClick={processPayment} disabled={paymentProcessing} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">{paymentProcessing ? "..." : "Collect"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
