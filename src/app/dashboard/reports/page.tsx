"use client";

import { useState, useEffect } from "react";
import { Download, Search, Calendar as CalendarIcon, FileText, PieChart, BarChart3, UserSquare } from "lucide-react";
import dayjs from "dayjs";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("sales_register");

  // Date Range
  const [startDate, setStartDate] = useState(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));

  // Data States
  const [sales, setSales] = useState<any[]>([]);
  const [servicePerformance, setServicePerformance] = useState<any[]>([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState<any[]>([]);

  // Patient Ledger State
  const [patients, setPatients] = useState<any[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedPatientData, setSelectedPatientData] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(false);

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
        }
        else if (activeTab === "service_performance") {
          const res = await fetch(`/api/reports/service-performance${queryParams}`);
          const data = await res.json();

          setServicePerformance(Array.isArray(data) ? data : []);
        }
        else if (activeTab === "payment_breakdown") {
          const res = await fetch(`/api/reports/payment-breakdown${queryParams}`);
          const data = await res.json();

          setPaymentBreakdown(Array.isArray(data) ? data : []);
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
  }, [activeTab, startDate, endDate]);

  // Fetch Patients for Ledger
  useEffect(() => {
    if (activeTab === "patient_ledger" && patients.length === 0) {
      fetch("/api/patients").then(r => r.json()).then(data => setPatients(data));
    }
  }, [activeTab, patients.length]);

  // Fetch specific patient data
  useEffect(() => {
    if (selectedPatientId) {
      fetch(`/api/patients/${selectedPatientId}`)
        .then(r => r.json())
        .then(data => setSelectedPatientData(data));
    } else {
      setSelectedPatientData(null);
    }
  }, [selectedPatientId]);

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    (p.phone && p.phone.includes(patientSearch)) ||
    p.medical_id.toLowerCase().includes(patientSearch.toLowerCase())
  ).slice(0, 5);

  const exportCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;

    // Extract headers
    const headers = Object.keys(data[0]);

    // Format CSV
    const csvRows = [];
    csvRows.push(headers.join(","));

    for (const row of data) {
      const values = headers.map(header => {
        const escaped = ('' + row[header]).replace(/"/g, '\\"');
        return `" {escaped}"`;
      });
      csvRows.push(values.join(","));
    }

    const blob = new Blob([csvRows.join("\n")], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', ` {filename}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExport = () => {
    if (activeTab === "sales_register") {
      const exportData = sales.map(s => ({
        Date: dayjs(s.date).format('YYYY-MM-DD'),
        Invoice: s.invoice_number,
        Patient: s.customer?.name,
        GrossAmount: s.subtotal,
        Discount: s.discount_amount,
        NetTotal: s.grand_total,
        Paid: s.paid_amount,
        Status: s.payment_status
      }));
      exportCSV(exportData, `Sales_Register_ {startDate}_to_ {endDate}`);
    } else if (activeTab === "service_performance") {
      const exportData = servicePerformance.map(s => ({
        SKU: s.sku,
        Service: s.name,
        QuantitySold: s.quantity_sold,
        Revenue: s.revenue
      }));
      exportCSV(exportData, `Service_Performance_ {startDate}_to_ {endDate}`);
    } else if (activeTab === "payment_breakdown") {
      exportCSV(paymentBreakdown, `Payment_Breakdown_ {startDate}_to_ {endDate}`);
    } else if (activeTab === "patient_ledger" && selectedPatientData) {
      const exportData = (selectedPatientData.sales || []).map((s: any) => ({
        Date: dayjs(s.date).format('YYYY-MM-DD'),
        Invoice: s.invoice_number,
        NetTotal: s.grand_total,
        Paid: s.paid_amount,
        Status: s.payment_status
      }));
      exportCSV(exportData, `Patient_Ledger_ {selectedPatientData.name.replace(/\s+/g, '_')}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50 -m-4 p-4 sm:-m-8 sm:p-8 overflow-y-auto w-full min-w-0">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">View insights and track business performance.</p>
        </div>

        {/* Global Date Filter */}
        {activeTab !== "patient_ledger" && (
          <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center px-3 border-r border-gray-100">
              <CalendarIcon className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="date"
                className="outline-none text-sm text-gray-700 bg-transparent font-medium"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex items-center px-3">
              <span className="text-gray-400 mr-2 text-sm font-medium">to</span>
              <input
                type="date"
                className="outline-none text-sm text-gray-700 bg-transparent font-medium"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[500px] w-full min-w-0">
        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50/50 px-4 pt-4 overflow-x-auto whitespace-nowrap shrink-0">
          <button
            className={`px-6 py-3 font-semibold text-sm border-b-2 rounded-t-lg flex items-center transition-colors  {activeTab === 'sales_register' ? 'border-indigo-600 text-indigo-700 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'}`}
            onClick={() => setActiveTab('sales_register')}
          >
            <FileText className="w-4 h-4 mr-2" /> Sales Register
          </button>
          <button
            className={`px-6 py-3 font-semibold text-sm border-b-2 rounded-t-lg flex items-center transition-colors  {activeTab === 'service_performance' ? 'border-indigo-600 text-indigo-700 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'}`}
            onClick={() => setActiveTab('service_performance')}
          >
            <BarChart3 className="w-4 h-4 mr-2" /> Service Performance
          </button>
          <button
            className={`px-6 py-3 font-semibold text-sm border-b-2 rounded-t-lg flex items-center transition-colors  {activeTab === 'payment_breakdown' ? 'border-indigo-600 text-indigo-700 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'}`}
            onClick={() => setActiveTab('payment_breakdown')}
          >
            <PieChart className="w-4 h-4 mr-2" /> Payment Breakdown
          </button>
          <button
            className={`px-6 py-3 font-semibold text-sm border-b-2 rounded-t-lg flex items-center transition-colors  {activeTab === 'patient_ledger' ? 'border-indigo-600 text-indigo-700 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'}`}
            onClick={() => setActiveTab('patient_ledger')}
          >
            <UserSquare className="w-4 h-4 mr-2" /> Patient Ledger
          </button>

          <div className="ml-auto pb-2 self-end">
            <button onClick={handleExport} className="flex items-center text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-lg shadow-sm transition-all">
              <Download className="w-4 h-4 mr-2 text-indigo-600" /> Export CSV
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 flex-1 overflow-auto">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-gray-400 font-medium">Loading report data...</div>
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
                          <tr key={s.id} className="hover:bg-indigo-50/30">
                            <td className="py-4 px-6 text-gray-500 whitespace-nowrap">{dayjs(s.date).format('MMM DD, YYYY')}</td>
                            <td className="py-4 px-6 font-medium text-indigo-600">{s.invoice_number}</td>
                            <td className="py-4 px-6 font-medium text-gray-900">{s.customer?.name}</td>
                            <td className="py-4 px-6 text-right"> {s.subtotal.toFixed(2)}</td>
                            <td className="py-4 px-6 text-right text-red-500">- {s.discount_amount.toFixed(2)}</td>
                            <td className="py-4 px-6 text-right font-bold text-gray-900"> {s.grand_total.toFixed(2)}</td>
                            <td className="py-4 px-6 text-center">
                              {s.payment_status === "PAID" && <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-md text-xs font-bold tracking-wide">PAID</span>}
                              {s.payment_status === "PARTIAL" && <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-md text-xs font-bold tracking-wide">PARTIAL</span>}
                              {s.payment_status === "DUE" && <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-md text-xs font-bold tracking-wide">DUE</span>}
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
                          <tr key={s.id} className="hover:bg-indigo-50/30">
                            <td className="py-4 px-6 font-medium text-gray-900">{s.name}</td>
                            <td className="py-4 px-6 text-gray-500 font-mono text-xs">{s.sku}</td>
                            <td className="py-4 px-6 text-right font-medium">{s.quantity_sold}</td>
                            <td className="py-4 px-6 text-right font-bold text-gray-900"> {s.revenue.toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 3: Payment Breakdown */}
              {activeTab === 'payment_breakdown' && (
                <div className="max-w-md mx-auto mt-8">
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 shadow-inner">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 text-center">Revenue by Payment Method</h3>
                    <div className="space-y-4">
                      {paymentBreakdown.length === 0 ? (
                        <div className="text-center text-gray-500">No payment data available.</div>
                      ) : (
                        paymentBreakdown.map(p => (
                          <div key={p.method} className="flex justify-between items-center p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                            <span className="font-medium text-gray-700">{p.method}</span>
                            <span className="font-bold text-gray-900 text-lg"> {p.amount.toFixed(2)}</span>
                          </div>
                        ))
                      )}
                    </div>
                    {paymentBreakdown.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between items-center px-4">
                        <span className="font-bold text-gray-900">Total Collected</span>
                        <span className="font-black text-indigo-600 text-2xl">
                          {paymentBreakdown.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
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
                        className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 font-medium"
                        value={patientSearch}
                        onChange={(e) => { setPatientSearch(e.target.value); setSelectedPatientId(""); }}
                      />
                    </div>

                    {patientSearch && !selectedPatientId && (
                      <div className="absolute z-10 w-full mt-2 bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                        {filteredPatients.map(p => (
                          <div
                            key={p.id}
                            onClick={() => { setSelectedPatientId(p.id); setPatientSearch(p.name); }}
                            className="p-4 border-b border-gray-50 hover:bg-indigo-50 cursor-pointer flex justify-between items-center"
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
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl flex flex-col justify-center">
                          <span className="text-indigo-600 text-sm font-semibold mb-1 uppercase tracking-wider">Total Spending</span>
                          <span className="text-3xl font-black text-indigo-900">
                            {(selectedPatientData.sales || []).reduce((sum: number, s: any) => sum + s.grand_total, 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="bg-gray-50 border border-gray-100 p-6 rounded-xl flex flex-col justify-center">
                          <span className="text-gray-500 text-sm font-semibold mb-1 uppercase tracking-wider">Total Visits</span>
                          <span className="text-3xl font-black text-gray-900">
                            {(selectedPatientData.sales || []).length}
                          </span>
                        </div>
                        <div className="bg-red-50 border border-red-100 p-6 rounded-xl flex flex-col justify-center">
                          <span className="text-red-600 text-sm font-semibold mb-1 uppercase tracking-wider">Due Balance</span>
                          <span className="text-3xl font-black text-red-900">
                            {(selectedPatientData.current_balance || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="bg-green-50 border border-green-100 p-6 rounded-xl flex flex-col justify-center">
                          <span className="text-green-600 text-sm font-semibold mb-1 uppercase tracking-wider">Advance Balance</span>
                          <span className="text-3xl font-black text-green-900">
                            {(selectedPatientData.advance_balance || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <h3 className="font-bold text-gray-900 mb-4">Invoice History</h3>
                      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white w-full min-w-0">
                        <div className="overflow-x-auto w-full">
                          <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead className="bg-gray-50 border-b border-gray-200">
                              <tr>
                                <th className="p-4 font-semibold text-sm text-gray-600">Date</th>
                                <th className="p-4 font-semibold text-sm text-gray-600">Invoice</th>
                                <th className="p-4 font-semibold text-sm text-gray-600 text-right">Net Total</th>
                                <th className="p-4 font-semibold text-sm text-gray-600 text-right">Paid</th>
                                <th className="p-4 font-semibold text-sm text-gray-600 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {(!selectedPatientData.sales || selectedPatientData.sales.length === 0) ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-400">No invoices found for this patient.</td></tr>
                              ) : (
                                selectedPatientData.sales.map((sale: any) => (
                                  <tr key={sale.id} className="hover:bg-gray-50">
                                    <td className="p-4 text-sm text-gray-900">{dayjs(sale.date).format('MMM DD, YYYY')}</td>
                                    <td className="p-4 font-medium text-indigo-600">{sale.invoice_number}</td>
                                    <td className="p-4 text-right font-medium text-gray-900"> {sale.grand_total.toFixed(2)}</td>
                                    <td className="p-4 text-right text-gray-600"> {sale.paid_amount.toFixed(2)}</td>
                                    <td className="p-4 text-center">
                                      {sale.payment_status === "PAID" && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-semibold">PAID</span>}
                                      {sale.payment_status === "PARTIAL" && <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-semibold">PARTIAL</span>}
                                      {sale.payment_status === "DUE" && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-semibold">DUE</span>}
                                    </td>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
