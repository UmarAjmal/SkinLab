"use client";

import { useState, useEffect } from "react";
import {
  Download,
  Search,
  Calendar as CalendarIcon,
  FileText,
  PieChart,
  BarChart3,
  UserSquare,
  Receipt,
  TrendingDown,
  Wallet,
  DollarSign,
  Layers,
  Tag,
  ArrowUpRight,
} from "lucide-react";
import dayjs from "dayjs";
import { useSearchParams } from "next/navigation";

export default function ReportsPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "sales_register";

  const [activeTab, setActiveTab] = useState(initialTab);

  // Date Range
  const [startDate, setStartDate] = useState(dayjs().startOf("month").format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(dayjs().endOf("month").format("YYYY-MM-DD"));

  // Data States
  const [sales, setSales] = useState<any[]>([]);
  const [servicePerformance, setServicePerformance] = useState<any[]>([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState<any[]>([]);
  const [expenseReport, setExpenseReport] = useState<any>(null);
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState("ALL");

  // Patient Ledger State
  const [patients, setPatients] = useState<any[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedPatientData, setSelectedPatientData] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(false);

  // Update tab if URL searchParams change
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Fetch Reports Data
  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      try {
        const queryParams = `?startDate=${startDate}&endDate=${endDate}T23:59:59.999Z`;

        if (activeTab === "sales_register") {
          const res = await fetch(`/api/sales${queryParams}`);
          const data = await res.json();
          setSales(Array.isArray(data) ? data : []);
        } else if (activeTab === "service_performance") {
          const res = await fetch(`/api/reports/service-performance${queryParams}`);
          const data = await res.json();
          setServicePerformance(Array.isArray(data) ? data : []);
        } else if (activeTab === "payment_breakdown") {
          const res = await fetch(`/api/reports/payment-breakdown${queryParams}`);
          const data = await res.json();
          setPaymentBreakdown(Array.isArray(data) ? data : []);
        } else if (activeTab === "expense_report") {
          const catQuery = expenseCategoryFilter !== "ALL" ? `&categoryId=${expenseCategoryFilter}` : "";
          const res = await fetch(`/api/reports/expenses${queryParams}${catQuery}`);
          const data = await res.json();
          setExpenseReport(data);
        }
      } catch (e) {
        console.error("[Reports] Error fetching reports:", e);
      } finally {
        setIsLoading(false);
      }
    };

    if (activeTab !== "patient_ledger") {
      fetchReports();
    }

    const handleManualRefresh = () => {
      if (activeTab !== "patient_ledger") {
        fetchReports();
      }
    };
    window.addEventListener("refresh-active-page-data", handleManualRefresh);
    return () => window.removeEventListener("refresh-active-page-data", handleManualRefresh);
  }, [activeTab, startDate, endDate, expenseCategoryFilter]);

  // Fetch Patients for Ledger
  useEffect(() => {
    if (activeTab === "patient_ledger" && patients.length === 0) {
      fetch("/api/patients")
        .then((r) => r.json())
        .then((data) => setPatients(data));
    }
  }, [activeTab, patients.length]);

  // Fetch specific patient data
  useEffect(() => {
    if (selectedPatientId) {
      fetch(`/api/patients/${selectedPatientId}`)
        .then((r) => r.json())
        .then((data) => setSelectedPatientData(data));
    } else {
      setSelectedPatientData(null);
    }
  }, [selectedPatientId]);

  const filteredPatients = patients
    .filter(
      (p) =>
        p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
        (p.phone && p.phone.includes(patientSearch)) ||
        p.medical_id.toLowerCase().includes(patientSearch.toLowerCase())
    )
    .slice(0, 5);

  const exportCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;

    // Extract headers
    const headers = Object.keys(data[0]);

    // Format CSV
    const csvRows = [];
    csvRows.push(headers.join(","));

    for (const row of data) {
      const values = headers.map((header) => {
        const escaped = ("" + (row[header] !== undefined ? row[header] : "")).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(","));
    }

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExport = () => {
    if (activeTab === "sales_register") {
      const exportData = sales.map((s) => ({
        Date: dayjs(s.date).format("YYYY-MM-DD"),
        Invoice: s.invoice_number,
        Patient: s.customer?.name,
        GrossAmount: s.subtotal,
        Discount: s.discount_amount,
        NetTotal: s.grand_total,
        Paid: s.paid_amount,
        Status: s.payment_status,
      }));
      exportCSV(exportData, `Sales_Register_${startDate}_to_${endDate}`);
    } else if (activeTab === "service_performance") {
      const exportData = servicePerformance.map((s) => ({
        SKU: s.sku,
        Service: s.name,
        QuantitySold: s.quantity_sold,
        Revenue: s.revenue,
      }));
      exportCSV(exportData, `Service_Performance_${startDate}_to_${endDate}`);
    } else if (activeTab === "payment_breakdown") {
      exportCSV(paymentBreakdown, `Payment_Breakdown_${startDate}_to_${endDate}`);
    } else if (activeTab === "expense_report" && expenseReport?.expenses) {
      const exportData = (expenseReport.expenses || []).map((exp: any) => ({
        Date: dayjs(exp.date).format("YYYY-MM-DD HH:mm"),
        Title: exp.title,
        Category: exp.category?.name || "General",
        Payee: exp.payee || "",
        PaymentMethod: exp.payment_method || "Cash",
        VoucherRef: exp.reference_no || "",
        Amount: exp.amount,
        RecordedBy: exp.created_by?.email || "",
        Notes: exp.notes || "",
      }));
      exportCSV(exportData, `Expense_Report_${startDate}_to_${endDate}`);
    } else if (activeTab === "patient_ledger" && selectedPatientData) {
      const exportData = (selectedPatientData.sales || []).map((s: any) => ({
        Date: dayjs(s.date).format("YYYY-MM-DD"),
        Invoice: s.invoice_number,
        NetTotal: s.grand_total,
        Paid: s.paid_amount,
        Status: s.payment_status,
      }));
      exportCSV(exportData, `Patient_Ledger_${selectedPatientData.name.replace(/\s+/g, "_")}`);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Analytics &amp; Financial Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Audit clinic revenue, treatment performance, payments, and expenses.
          </p>
        </div>

        {/* Global Date Filter */}
        {activeTab !== "patient_ledger" && (
          <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl shadow-xs border border-gray-200/80 w-full sm:w-auto">
            <div className="flex items-center px-2.5 sm:border-r border-gray-100 flex-1 sm:flex-initial">
              <CalendarIcon className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
              <input
                type="date"
                className="outline-hidden text-xs sm:text-sm text-gray-700 bg-transparent font-medium w-full sm:w-auto"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex items-center px-2.5 flex-1 sm:flex-initial">
              <span className="text-gray-400 mr-2 text-xs sm:text-sm font-medium">to</span>
              <input
                type="date"
                className="outline-hidden text-xs sm:text-sm text-gray-700 bg-transparent font-medium w-full sm:w-auto"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-xs border border-gray-100 overflow-hidden flex flex-col min-h-[500px] w-full min-w-0">
        {/* Tabs with smooth horizontal scroll */}
        <div className="flex border-b border-gray-100 bg-gray-50/50 px-3 sm:px-4 pt-3 sm:pt-4 overflow-x-auto no-scrollbar whitespace-nowrap shrink-0 gap-1">
          <button
            className={`px-5 py-3 font-semibold text-sm border-b-2 rounded-t-xl flex items-center transition-colors ${activeTab === 'sales_register'
              ? 'border-indigo-600 text-indigo-700 bg-white shadow-xs'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
              }`}
            onClick={() => setActiveTab('sales_register')}
          >
            <FileText className="w-4 h-4 mr-2" /> Sales Register
          </button>
          <button
            className={`px-5 py-3 font-semibold text-sm border-b-2 rounded-t-xl flex items-center transition-colors ${activeTab === 'service_performance'
              ? 'border-indigo-600 text-indigo-700 bg-white shadow-xs'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
              }`}
            onClick={() => setActiveTab('service_performance')}
          >
            <BarChart3 className="w-4 h-4 mr-2" /> Service Performance
          </button>
          <button
            className={`px-5 py-3 font-semibold text-sm border-b-2 rounded-t-xl flex items-center transition-colors ${activeTab === 'payment_breakdown'
              ? 'border-indigo-600 text-indigo-700 bg-white shadow-xs'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
              }`}
            onClick={() => setActiveTab('payment_breakdown')}
          >
            <PieChart className="w-4 h-4 mr-2" /> Payment Breakdown
          </button>
          <button
            className={`px-5 py-3 font-semibold text-sm border-b-2 rounded-t-xl flex items-center transition-colors ${activeTab === 'expense_report'
              ? 'border-rose-600 text-rose-700 bg-white shadow-xs font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
              }`}
            onClick={() => setActiveTab('expense_report')}
          >
            <Receipt className="w-4 h-4 mr-2 text-rose-600" /> Expense Report
          </button>
          <button
            className={`px-5 py-3 font-semibold text-sm border-b-2 rounded-t-xl flex items-center transition-colors ${activeTab === 'patient_ledger'
              ? 'border-indigo-600 text-indigo-700 bg-white shadow-xs'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
              }`}
            onClick={() => setActiveTab('patient_ledger')}
          >
            <UserSquare className="w-4 h-4 mr-2" /> Patient Ledger
          </button>

          <div className="ml-auto pb-2 self-end">
            <button onClick={handleExport} className="flex items-center text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-xl shadow-xs transition-all">
              <Download className="w-4 h-4 mr-2 text-indigo-600" /> Export CSV
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 flex-1 overflow-auto">
          {isLoading ? (
            <div className="h-full min-h-[300px] flex items-center justify-center text-gray-400 font-medium">Loading report data...</div>
          ) : (
            <>
              {/* TAB 1: Sales Register */}
              {activeTab === 'sales_register' && (
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="py-4 px-6 font-semibold">Date</th>
                        <th className="py-4 px-6 font-semibold">Invoice #</th>
                        <th className="py-4 px-6 font-semibold">Patient</th>
                        <th className="py-4 px-6 font-semibold text-right">Gross</th>
                        <th className="py-4 px-6 font-semibold text-right">Discount</th>
                        <th className="py-4 px-6 font-semibold text-right">Net Total</th>
                        <th className="py-4 px-6 font-semibold text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                      {sales.length === 0 ? (
                        <tr><td colSpan={7} className="py-10 text-center text-gray-400 font-medium">No sales found in this date range.</td></tr>
                      ) : (
                        sales.map(s => (
                          <tr key={s.id} className="hover:bg-indigo-50/30 transition-colors">
                            <td className="py-4 px-6 text-gray-500 whitespace-nowrap">{dayjs(s.date).format('MMM DD, YYYY')}</td>
                            <td className="py-4 px-6 font-medium text-indigo-600">{s.invoice_number}</td>
                            <td className="py-4 px-6 font-medium text-gray-900">{s.customer?.name}</td>
                            <td className="py-4 px-6 text-right font-medium text-gray-700">PKR {s.subtotal.toFixed(2)}</td>
                            <td className="py-4 px-6 text-right text-red-500 font-medium">- PKR {s.discount_amount.toFixed(2)}</td>
                            <td className="py-4 px-6 text-right font-bold text-gray-900">PKR {s.grand_total.toFixed(2)}</td>
                            <td className="py-4 px-6 text-center">
                              {s.payment_status === "PAID" && <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide">PAID</span>}
                              {s.payment_status === "PARTIAL" && <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide">PARTIAL</span>}
                              {s.payment_status === "DUE" && <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide">DUE</span>}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 2: Service Performance */}
              {activeTab === 'service_performance' && (
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="py-4 px-6 font-semibold">Service / Product Name</th>
                        <th className="py-4 px-6 font-semibold">SKU</th>
                        <th className="py-4 px-6 font-semibold text-right">Qty Sold</th>
                        <th className="py-4 px-6 font-semibold text-right">Revenue Generated</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                      {servicePerformance.length === 0 ? (
                        <tr><td colSpan={4} className="py-10 text-center text-gray-400 font-medium">No performance data found in this date range.</td></tr>
                      ) : (
                        servicePerformance.map(s => (
                          <tr key={s.id} className="hover:bg-indigo-50/30 transition-colors">
                            <td className="py-4 px-6 font-medium text-gray-900">{s.name}</td>
                            <td className="py-4 px-6 text-gray-500 font-mono text-xs">{s.sku}</td>
                            <td className="py-4 px-6 text-right font-medium">{s.quantity_sold}</td>
                            <td className="py-4 px-6 text-right font-bold text-gray-900">PKR {s.revenue.toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 3: Payment Breakdown */}
              {activeTab === 'payment_breakdown' && (
                <div className="max-w-md mx-auto mt-6 sm:mt-8">
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 shadow-inner">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 text-center">Revenue by Payment Method</h3>
                    <div className="space-y-4">
                      {paymentBreakdown.length === 0 ? (
                        <div className="text-center text-gray-500 py-6">No payment data available.</div>
                      ) : (
                        paymentBreakdown.map(p => (
                          <div key={p.method} className="flex justify-between items-center p-4 bg-white rounded-xl shadow-xs border border-gray-100">
                            <span className="font-medium text-gray-700">{p.method}</span>
                            <span className="font-bold text-gray-900 text-lg">PKR {p.amount.toFixed(2)}</span>
                          </div>
                        ))
                      )}
                    </div>
                    {paymentBreakdown.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between items-center px-2">
                        <span className="font-bold text-gray-900">Total Collected</span>
                        <span className="font-black text-indigo-600 text-2xl">
                          PKR {paymentBreakdown.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: Patient Ledger */}
              {activeTab === 'patient_ledger' && (
                <div>
                  <div className="max-w-xl mx-auto mb-8 relative">
                    <div className="relative">
                      <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search patient by name, phone, or medical ID..."
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl shadow-xs focus:ring-2 focus:ring-indigo-500 outline-hidden text-gray-700 font-medium"
                        value={patientSearch}
                        onChange={(e) => { setPatientSearch(e.target.value); setSelectedPatientId(""); }}
                      />
                    </div>

                    {patientSearch && !selectedPatientId && (
                      <div className="absolute z-10 w-full mt-2 bg-white border border-gray-100 shadow-xl rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                        {filteredPatients.map(p => (
                          <div
                            key={p.id}
                            onClick={() => { setSelectedPatientId(p.id); setPatientSearch(p.name); }}
                            className="p-4 border-b border-gray-50 hover:bg-indigo-50 cursor-pointer flex justify-between items-center transition-colors"
                          >
                            <div>
                              <div className="font-medium text-gray-900">{p.name}</div>
                              <div className="text-xs text-gray-500 mt-1">{p.medical_id} • {p.phone}</div>
                            </div>
                          </div>
                        ))}
                        {filteredPatients.length === 0 && (
                          <div className="p-4 text-center text-gray-500">No patients found.</div>
                        )}
                      </div>
                    )}
                  </div>

                  {selectedPatientData && (
                    <div className="max-w-4xl mx-auto">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl flex flex-col justify-center">
                          <span className="text-indigo-600 text-xs font-semibold mb-1 uppercase tracking-wider">Total Spending</span>
                          <span className="text-2xl sm:text-3xl font-black text-indigo-900">
                            PKR {(selectedPatientData.sales || []).reduce((sum: number, s: any) => sum + s.grand_total, 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="bg-gray-50 border border-gray-100 p-5 rounded-2xl flex flex-col justify-center">
                          <span className="text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wider">Total Visits</span>
                          <span className="text-2xl sm:text-3xl font-black text-gray-900">
                            {(selectedPatientData.sales || []).length}
                          </span>
                        </div>
                        <div className="bg-red-50 border border-red-100 p-5 rounded-2xl flex flex-col justify-center">
                          <span className="text-red-600 text-xs font-semibold mb-1 uppercase tracking-wider">Due Balance</span>
                          <span className="text-2xl sm:text-3xl font-black text-red-900">
                            PKR {(selectedPatientData.current_balance || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="bg-green-50 border border-green-100 p-5 rounded-2xl flex flex-col justify-center">
                          <span className="text-green-600 text-xs font-semibold mb-1 uppercase tracking-wider">Advance Balance</span>
                          <span className="text-2xl sm:text-3xl font-black text-green-900">
                            PKR {(selectedPatientData.advance_balance || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <h3 className="font-bold text-gray-900 mb-4 text-lg">Invoice History</h3>
                      <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white w-full min-w-0 shadow-xs mb-8">
                        <div className="overflow-x-auto w-full">
                          <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider">
                              <tr>
                                <th className="p-4 font-semibold">Date</th>
                                <th className="p-4 font-semibold">Invoice</th>
                                <th className="p-4 font-semibold text-right">Net Total</th>
                                <th className="p-4 font-semibold text-right">Paid To Date</th>
                                <th className="p-4 font-semibold text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                              {(!selectedPatientData.sales || selectedPatientData.sales.length === 0) ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-400">No invoices found for this patient.</td></tr>
                              ) : (
                                selectedPatientData.sales.map((sale: any) => (
                                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 text-gray-900">{dayjs(sale.date).format('MMM DD, YYYY')}</td>
                                    <td className="p-4 font-medium text-indigo-600">{sale.invoice_number}</td>
                                    <td className="p-4 text-right font-medium text-gray-900">PKR {sale.grand_total.toFixed(2)}</td>
                                    <td className="p-4 text-right text-gray-600">PKR {sale.paid_amount.toFixed(2)}</td>
                                    <td className="p-4 text-center">
                                      {sale.payment_status === "PAID" && <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-lg text-xs font-semibold">PAID</span>}
                                      {sale.payment_status === "PARTIAL" && <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-lg text-xs font-semibold">PARTIAL</span>}
                                      {sale.payment_status === "DUE" && <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-lg text-xs font-semibold">DUE</span>}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Payment History Table */}
                      <h3 className="font-bold text-gray-900 mb-4 text-lg">Payments & Cash Receipts</h3>
                      <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white w-full min-w-0 shadow-xs">
                        <div className="overflow-x-auto w-full">
                          <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider">
                              <tr>
                                <th className="p-4 font-semibold">Payment Date</th>
                                <th className="p-4 font-semibold">Invoice Ref</th>
                                <th className="p-4 font-semibold">Method</th>
                                <th className="p-4 font-semibold">Remarks</th>
                                <th className="p-4 font-semibold text-right">Amount Received</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                              {(!selectedPatientData.payments || selectedPatientData.payments.length === 0) ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-400">No payment receipts found for this patient.</td></tr>
                              ) : (
                                selectedPatientData.payments.map((pmt: any) => (
                                  <tr key={pmt.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 text-gray-900">{dayjs(pmt.payment_date).format('MMM DD, YYYY hh:mm A')}</td>
                                    <td className="p-4 font-medium text-indigo-600">{pmt.sale?.invoice_number || "Advance Deposit"}</td>
                                    <td className="p-4 text-gray-700 font-medium">
                                      <span className="bg-slate-100 px-2.5 py-1 rounded-md text-xs">{pmt.payment_method}</span>
                                    </td>
                                    <td className="p-4 text-gray-500 text-xs">{pmt.notes || "Payment received"}</td>
                                    <td className="p-4 text-right font-bold text-emerald-700">PKR {pmt.amount.toFixed(2)}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                  {!selectedPatientId && !patientSearch && (
                    <div className="text-center py-20 text-gray-400">
                      <UserSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
                      <p className="font-medium text-lg text-gray-500">Search for a patient to view their ledger</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: Expense Report & Analytics */}
              {activeTab === 'expense_report' && (
                <div className="space-y-6 w-full min-w-0">
                  {/* Category Filter for Expense Report */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Filter By Category:
                      </span>
                      <select
                        value={expenseCategoryFilter}
                        onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-rose-500 outline-hidden"
                      >
                        <option value="ALL">All Expense Categories</option>
                        {(expenseReport?.categories || []).map((cat: any) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="text-xs text-gray-500 font-medium">
                      Showing expenses from <strong>{startDate}</strong> to <strong>{endDate}</strong>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Expenses */}
                    <div className="bg-gradient-to-br from-rose-50/60 via-white to-white p-5 rounded-2xl border border-rose-100 shadow-2xs">
                      <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider block mb-1">
                        Total Period Expenses
                      </span>
                      <div className="text-2xl font-black text-rose-600">
                        PKR {Number(expenseReport?.summary?.totalExpenseAmount || 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">
                        {expenseReport?.summary?.totalTransactions || 0} expense transaction(s)
                      </p>
                    </div>

                    {/* Total Collections */}
                    <div className="bg-gradient-to-br from-emerald-50/60 via-white to-white p-5 rounded-2xl border border-emerald-100 shadow-2xs">
                      <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                        Total Sales Revenue (Collected)
                      </span>
                      <div className="text-2xl font-black text-emerald-700">
                        PKR {Number(expenseReport?.summary?.totalCollections || 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Gross Invoiced: PKR {Number(expenseReport?.summary?.totalInvoicedSales || 0).toLocaleString()}
                      </p>
                    </div>

                    {/* Net Operating Cash Balance */}
                    <div className="bg-gradient-to-br from-indigo-50/60 via-white to-white p-5 rounded-2xl border border-indigo-100 shadow-2xs">
                      <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block mb-1">
                        Net Operating Cash Flow
                      </span>
                      <div className={`text-2xl font-black ${(expenseReport?.summary?.netOperatingCash || 0) >= 0 ? "text-indigo-900" : "text-rose-600"}`}>
                        PKR {Number(expenseReport?.summary?.netOperatingCash || 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Revenue minus expenses
                      </p>
                    </div>

                    {/* Average Expense per Tx */}
                    <div className="bg-gradient-to-br from-amber-50/60 via-white to-white p-5 rounded-2xl border border-amber-100 shadow-2xs">
                      <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block mb-1">
                        Average Expense / Voucher
                      </span>
                      <div className="text-2xl font-black text-amber-700">
                        PKR {Number(expenseReport?.summary?.averageExpensePerTx || 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Per transaction average
                      </p>
                    </div>
                  </div>

                  {/* Category Distribution & Payment Mode Breakdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Category Distribution */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
                      <h4 className="font-bold text-gray-900 text-sm flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-indigo-600" /> Category Breakdown
                        </span>
                        <span className="text-xs text-gray-400 font-normal">
                          {(expenseReport?.categoryBreakdown || []).length} categories
                        </span>
                      </h4>
                      {(!expenseReport?.categoryBreakdown || expenseReport.categoryBreakdown.length === 0) ? (
                        <p className="text-xs text-gray-400 py-6 text-center">No category data in this period.</p>
                      ) : (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                          {expenseReport.categoryBreakdown.map((cat: any, cIdx: number) => (
                            <div key={cIdx} className="space-y-1">
                              <div className="flex justify-between text-xs font-semibold text-gray-700">
                                <span>{cat.name} ({cat.count} txns)</span>
                                <span>PKR {Number(cat.amount).toLocaleString()} ({cat.percentage}%)</span>
                              </div>
                              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-rose-500 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(100, cat.percentage)}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Payment Method Distribution */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
                      <h4 className="font-bold text-gray-900 text-sm flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Wallet className="w-4 h-4 text-emerald-600" /> Payment Modes
                        </span>
                      </h4>
                      {(!expenseReport?.paymentMethodBreakdown || expenseReport.paymentMethodBreakdown.length === 0) ? (
                        <p className="text-xs text-gray-400 py-6 text-center">No payment method data available.</p>
                      ) : (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                          {expenseReport.paymentMethodBreakdown.map((pm: any, pIdx: number) => (
                            <div key={pIdx} className="space-y-1">
                              <div className="flex justify-between text-xs font-semibold text-gray-700">
                                <span>{pm.method} ({pm.count} txns)</span>
                                <span>PKR {Number(pm.amount).toLocaleString()} ({pm.percentage}%)</span>
                              </div>
                              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(100, pm.percentage)}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Detailed Expenses Table */}
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm mb-3">Expense Vouchers Log</h4>
                    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                      <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse min-w-[650px]">
                          <thead className="bg-slate-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider">
                            <tr>
                              <th className="p-4 font-semibold">Date</th>
                              <th className="p-4 font-semibold">Description</th>
                              <th className="p-4 font-semibold">Category</th>
                              <th className="p-4 font-semibold">Payee</th>
                              <th className="p-4 font-semibold">Method</th>
                              <th className="p-4 font-semibold text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-sm">
                            {(!expenseReport?.expenses || expenseReport.expenses.length === 0) ? (
                              <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-400">
                                  No expenses recorded for the selected period.
                                </td>
                              </tr>
                            ) : (
                              expenseReport.expenses.map((exp: any) => (
                                <tr key={exp.id} className="hover:bg-gray-50/70 transition-colors">
                                  <td className="p-4 text-gray-900 whitespace-nowrap text-xs sm:text-sm">
                                    <div className="font-bold">{dayjs(exp.date).format("MMM DD, YYYY")}</div>
                                    <div className="text-[11px] text-gray-400">{dayjs(exp.date).format("hh:mm A")}</div>
                                  </td>
                                  <td className="p-4 font-medium text-gray-900 text-xs sm:text-sm">
                                    {exp.title}
                                    {exp.reference_no && (
                                      <span className="block text-[10px] text-gray-500 font-normal">
                                        Ref: {exp.reference_no}
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-4 whitespace-nowrap">
                                    <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-indigo-100">
                                      {exp.category?.name || "General"}
                                    </span>
                                  </td>
                                  <td className="p-4 text-gray-600 text-xs sm:text-sm">
                                    {exp.payee || "—"}
                                  </td>
                                  <td className="p-4 text-gray-600 text-xs sm:text-sm">
                                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs">
                                      {exp.payment_method || "Cash"}
                                    </span>
                                  </td>
                                  <td className="p-4 text-right font-black text-rose-600 whitespace-nowrap text-xs sm:text-sm">
                                    PKR {Number(exp.amount).toFixed(2)}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
