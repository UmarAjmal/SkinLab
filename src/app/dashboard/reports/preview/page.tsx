"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Printer,
  X,
  FileText,
  Calendar,
  Building2,
  Phone,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Download,
} from "lucide-react";
import dayjs from "dayjs";

function ReportPreviewContent() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "audit_report";
  const startDate = searchParams.get("startDate") || dayjs().startOf("month").format("YYYY-MM-DD");
  const endDate = searchParams.get("endDate") || dayjs().endOf("month").format("YYYY-MM-DD");
  const categoryId = searchParams.get("categoryId") || "ALL";
  const patientId = searchParams.get("patientId") || "";
  const autoPrint = searchParams.get("autoprint") === "true";

  const [clinic, setClinic] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch clinic settings
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) setClinic(d);
        else {
          fetch("/api/settings/public")
            .then((r2) => (r2.ok ? r2.json() : null))
            .then((d2) => setClinic(d2));
        }
      })
      .catch(() => {});
  }, []);

  // Fetch report data
  useEffect(() => {
    setIsLoading(true);
    const query = `?startDate=${startDate}&endDate=${endDate}T23:59:59.999Z`;

    let fetchUrl = `/api/reports/audit${query}`;
    if (tab === "sales_register") {
      fetchUrl = `/api/sales${query}`;
    } else if (tab === "expense_report") {
      const catQuery = categoryId !== "ALL" ? `&categoryId=${categoryId}` : "";
      fetchUrl = `/api/reports/expenses${query}${catQuery}`;
    } else if (tab === "service_performance") {
      fetchUrl = `/api/reports/service-performance${query}`;
    } else if (tab === "payment_breakdown") {
      fetchUrl = `/api/reports/payment-breakdown${query}`;
    } else if (tab === "patient_ledger" && patientId) {
      fetchUrl = `/api/patients/${patientId}`;
    }

    fetch(fetchUrl)
      .then((res) => res.json())
      .then((result) => {
        setData(result);
        setIsLoading(false);
        if (autoPrint) {
          setTimeout(() => {
            window.print();
          }, 600);
        }
      })
      .catch((err) => {
        console.error("Preview fetch error:", err);
        setIsLoading(false);
      });
  }, [tab, startDate, endDate, categoryId, patientId, autoPrint]);

  const handlePrint = () => {
    window.print();
  };

  const getReportTitle = () => {
    switch (tab) {
      case "audit_report":
        return "COMPREHENSIVE FINANCIAL AUDIT REPORT";
      case "sales_register":
        return "SALES REGISTER & INVOICES REPORT";
      case "expense_report":
        return "OPERATING EXPENSES & VOUCHERS REPORT";
      case "service_performance":
        return "TREATMENT & SERVICE PERFORMANCE REPORT";
      case "payment_breakdown":
        return "REVENUE BY PAYMENT METHOD BREAKDOWN";
      case "patient_ledger":
        return "PATIENT STATEMENT & FINANCIAL LEDGER";
      default:
        return "CLINICAL FINANCIAL REPORT";
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 font-sans print:bg-white print:text-black">
      {/* ─── Non-Printing Top Action Bar ─── */}
      <div className="no-print sticky top-0 z-50 bg-slate-900 text-white px-3 sm:px-8 py-2.5 sm:py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 shadow-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-xs sm:text-sm shrink-0">
            SL
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold tracking-tight truncate">{getReportTitle()}</h2>
            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
              Period: {dayjs(startDate).format("MMM DD, YYYY")} — {dayjs(endDate).format("MMM DD, YYYY")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Print / Save PDF</span>
          </button>
          <button
            type="button"
            onClick={() => window.close()}
            className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Close</span>
          </button>
        </div>
      </div>

      {/* ─── A4 Printable Document Container ─── */}
      <main className="max-w-[210mm] mx-auto my-3 sm:my-8 bg-white p-3.5 sm:p-10 md:p-12 rounded-2xl shadow-md border border-slate-200/80 print:shadow-none print:border-none print:m-0 print:p-0 print:max-w-none">
        {isLoading ? (
          <div className="py-24 text-center text-slate-400 font-medium">
            Generating printable report...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header: Clinic Profile + Report Meta */}
            <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-900 pb-5 gap-4">
              <div className="flex items-start gap-4">
                {clinic?.logo ? (
                  <div className="w-16 h-16 rounded-xl border border-slate-200 flex items-center justify-center p-1 overflow-hidden shrink-0">
                    <img src={clinic.logo} alt={clinic.name} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-900 text-white flex items-center justify-center p-2 overflow-hidden shrink-0">
                    <img src="/logo.png" alt="Falcon Swift" className="w-full h-full object-contain" />
                  </div>
                )}
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-tight">
                    {clinic?.name || "Skin-Lab Clinic"}
                  </h1>
                  <p className="text-xs text-slate-600 font-medium mt-0.5 max-w-sm">
                    {clinic?.address || "Clinical Healthcare & Practice Management"}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium mt-1">
                    {clinic?.phone && <span>Phone: {clinic.phone}</span>}
                    {clinic?.tax_number && <span>NTN / Tax: {clinic.tax_number}</span>}
                  </div>
                </div>
              </div>

              {/* Report Header Metadata */}
              <div className="sm:text-right text-left w-full sm:w-auto bg-slate-50 print:bg-transparent p-3 sm:p-0 rounded-xl border border-slate-100 sm:border-none">
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 block">
                  {getReportTitle()}
                </span>
                <p className="text-xs text-slate-700 font-bold mt-1">
                  From: {dayjs(startDate).format("DD MMM YYYY")} — To: {dayjs(endDate).format("DD MMM YYYY")}
                </p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Print Date: {dayjs().format("DD-MMM-YYYY, hh:mm A")}
                </p>
                <div className="inline-block mt-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Verified Audit Status: OK
                </div>
              </div>
            </div>

            {/* ─── TAB CONTENT SPECIFIC RENDERING ─── */}

            {/* 1. AUDIT REPORT */}
            {tab === "audit_report" && data?.summary && (
              <div className="space-y-6">
                {/* Executive Audit Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Gross Sales</span>
                    <span className="text-base sm:text-lg font-black text-slate-900 block mt-0.5">
                      PKR {Number(data.summary.grossSales || 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-400">{data.summary.totalInvoices} Invoiced Sales</span>
                  </div>

                  <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Total Cash Inflow</span>
                    <span className="text-base sm:text-lg font-black text-emerald-800 block mt-0.5">
                      PKR {Number(data.summary.totalCashInflow || 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-emerald-600">Sales + Adv: PKR {Number(data.summary.totalAdvanceDeposits || 0).toLocaleString()}</span>
                  </div>

                  <div className="bg-rose-50/70 border border-rose-200 p-3.5 rounded-xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">Total Expenses</span>
                    <span className="text-base sm:text-lg font-black text-rose-800 block mt-0.5">
                      PKR {Number(data.summary.totalExpenses || 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-rose-600">{data.summary.totalExpenseTxns} Vouchers Logged</span>
                  </div>

                  <div className="bg-indigo-50/70 border border-indigo-200 p-3.5 rounded-xl">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">Net Operating Cash</span>
                    <span className={`text-base sm:text-lg font-black block mt-0.5 ${Number(data.summary.netOperatingCash || 0) >= 0 ? "text-indigo-900" : "text-rose-700"}`}>
                      PKR {Number(data.summary.netOperatingCash || 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-indigo-600">Cash In minus Expenses</span>
                  </div>
                </div>

                {/* Audit Ledger Table */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2">
                    Master Transaction Audit Log ({data.ledgerEntries?.length || 0} Transactions)
                  </h3>
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left text-xs border border-slate-300 min-w-[700px]">
                      <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 uppercase font-bold text-[10px]">
                        <tr>
                          <th className="p-2.5 border-r border-slate-200">Date/Time</th>
                          <th className="p-2.5 border-r border-slate-200">Type</th>
                          <th className="p-2.5 border-r border-slate-200">Ref #</th>
                          <th className="p-2.5 border-r border-slate-200">Party / Customer</th>
                          <th className="p-2.5 border-r border-slate-200">Method</th>
                          <th className="p-2.5 border-r border-slate-200 text-right">Cash In (+)</th>
                          <th className="p-2.5 border-r border-slate-200 text-right">Cash Out (-)</th>
                          <th className="p-2.5 text-right font-black">Net Cash</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {(!data.ledgerEntries || data.ledgerEntries.length === 0) ? (
                          <tr><td colSpan={8} className="p-6 text-center text-slate-400">No transactions recorded in this period.</td></tr>
                        ) : (
                          data.ledgerEntries.map((row: any, idx: number) => (
                            <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                              <td className="p-2 border-r border-slate-200 whitespace-nowrap">
                                {dayjs(row.date).format("DD-MMM-YYYY HH:mm")}
                              </td>
                              <td className="p-2 border-r border-slate-200 font-bold whitespace-nowrap">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                                  row.type === "SALE" ? "bg-emerald-100 text-emerald-800" :
                                  row.type === "ADVANCE" ? "bg-indigo-100 text-indigo-800" :
                                  "bg-rose-100 text-rose-800"
                                }`}>
                                  {row.type}
                                </span>
                              </td>
                              <td className="p-2 border-r border-slate-200 font-mono font-medium">{row.ref}</td>
                              <td className="p-2 border-r border-slate-200 font-medium">
                                {row.party}
                                {row.notes && <span className="block text-[9px] text-slate-400 font-normal">{row.notes}</span>}
                              </td>
                              <td className="p-2 border-r border-slate-200">{row.method}</td>
                              <td className="p-2 border-r border-slate-200 text-right font-bold text-emerald-700">
                                {row.cashIn > 0 ? `PKR ${row.cashIn.toFixed(2)}` : "—"}
                              </td>
                              <td className="p-2 border-r border-slate-200 text-right font-bold text-rose-600">
                                {row.cashOut > 0 ? `PKR ${row.cashOut.toFixed(2)}` : "—"}
                              </td>
                              <td className={`p-2 text-right font-black ${row.net >= 0 ? "text-slate-900" : "text-rose-600"}`}>
                                PKR {row.net.toFixed(2)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      <tfoot className="bg-slate-100 border-t-2 border-slate-900 font-black text-xs">
                        <tr>
                          <td colSpan={5} className="p-2.5 border-r border-slate-300 uppercase tracking-wider text-slate-900">
                            Total ({data.ledgerEntries?.length || 0} Transactions)
                          </td>
                          <td className="p-2.5 border-r border-slate-300 text-right text-emerald-800">
                            PKR {Number(data.summary.totalCashInflow || 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-2.5 border-r border-slate-300 text-right text-rose-800">
                            PKR {Number(data.summary.totalExpenses || 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                          </td>
                          <td className={`p-2.5 text-right ${Number(data.summary.netOperatingCash || 0) >= 0 ? "text-indigo-950" : "text-rose-700"}`}>
                            PKR {Number(data.summary.netOperatingCash || 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 2. SALES REGISTER */}
            {tab === "sales_register" && Array.isArray(data) && (
              <div className="space-y-4">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-xs border border-slate-300 min-w-[700px]">
                    <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 uppercase font-bold text-[10px]">
                      <tr>
                        <th className="p-2.5 border-r border-slate-200">Date</th>
                        <th className="p-2.5 border-r border-slate-200">Invoice #</th>
                        <th className="p-2.5 border-r border-slate-200">Patient</th>
                        <th className="p-2.5 border-r border-slate-200 text-right">Gross</th>
                        <th className="p-2.5 border-r border-slate-200 text-right">Discount</th>
                        <th className="p-2.5 border-r border-slate-200 text-right">Net Total</th>
                        <th className="p-2.5 border-r border-slate-200 text-right">Paid</th>
                        <th className="p-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {data.length === 0 ? (
                        <tr><td colSpan={8} className="p-8 text-center text-slate-400">No sales recorded in this period.</td></tr>
                      ) : (
                        data.map((s: any, idx: number) => (
                          <tr key={s.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                            <td className="p-2 border-r border-slate-200 whitespace-nowrap">{dayjs(s.date).format("DD-MMM-YYYY")}</td>
                            <td className="p-2 border-r border-slate-200 font-mono font-bold text-indigo-700">{s.invoice_number}</td>
                            <td className="p-2 border-r border-slate-200 font-medium">{s.customer?.name}</td>
                            <td className="p-2 border-r border-slate-200 text-right font-medium">PKR {Number(s.subtotal).toFixed(2)}</td>
                            <td className="p-2 border-r border-slate-200 text-right text-rose-600 font-medium">- PKR {Number(s.discount_amount).toFixed(2)}</td>
                            <td className="p-2 border-r border-slate-200 text-right font-bold text-slate-900">PKR {Number(s.grand_total).toFixed(2)}</td>
                            <td className="p-2 border-r border-slate-200 text-right font-bold text-emerald-700">PKR {Number(s.paid_amount).toFixed(2)}</td>
                            <td className="p-2 text-center font-bold text-[10px]">
                              <span className={`px-2 py-0.5 rounded ${s.payment_status === "PAID" ? "bg-emerald-100 text-emerald-800" : s.payment_status === "PARTIAL" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"}`}>
                                {s.payment_status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-slate-100 border-t-2 border-slate-900 font-black text-xs">
                      <tr>
                        <td colSpan={3} className="p-2.5 border-r border-slate-300 uppercase tracking-wider text-slate-900">
                          Total ({data.length} Invoices)
                        </td>
                        <td className="p-2.5 border-r border-slate-300 text-right">
                          PKR {data.reduce((sum: number, s: any) => sum + (s.subtotal || 0), 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2.5 border-r border-slate-300 text-right text-rose-700">
                          - PKR {data.reduce((sum: number, s: any) => sum + (s.discount_amount || 0), 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2.5 border-r border-slate-300 text-right text-indigo-900">
                          PKR {data.reduce((sum: number, s: any) => sum + (s.grand_total || 0), 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2.5 border-r border-slate-300 text-right text-emerald-800">
                          PKR {data.reduce((sum: number, s: any) => sum + (s.paid_amount || 0), 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2.5 text-center text-[10px] text-slate-500">
                          Due: PKR {data.reduce((sum: number, s: any) => sum + Math.max(0, (s.grand_total || 0) - (s.paid_amount || 0)), 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* 3. EXPENSE REPORT */}
            {tab === "expense_report" && data && (
              <div className="space-y-4">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-xs border border-slate-300 min-w-[650px]">
                    <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 uppercase font-bold text-[10px]">
                      <tr>
                        <th className="p-2.5 border-r border-slate-200">Date/Time</th>
                        <th className="p-2.5 border-r border-slate-200">Voucher / Description</th>
                        <th className="p-2.5 border-r border-slate-200">Category</th>
                        <th className="p-2.5 border-r border-slate-200">Payee</th>
                        <th className="p-2.5 border-r border-slate-200">Payment Mode</th>
                        <th className="p-2.5 text-right font-black">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(!data.expenses || data.expenses.length === 0) ? (
                        <tr><td colSpan={6} className="p-8 text-center text-slate-400">No expenses recorded in this period.</td></tr>
                      ) : (
                        data.expenses.map((exp: any, idx: number) => (
                          <tr key={exp.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                            <td className="p-2 border-r border-slate-200 whitespace-nowrap">
                              {dayjs(exp.date).format("DD-MMM-YYYY HH:mm")}
                            </td>
                            <td className="p-2 border-r border-slate-200 font-medium">
                              {exp.title}
                              {exp.reference_no && <span className="block text-[10px] text-slate-400 font-mono">Ref: {exp.reference_no}</span>}
                            </td>
                            <td className="p-2 border-r border-slate-200">{exp.category?.name || "General"}</td>
                            <td className="p-2 border-r border-slate-200">{exp.payee || "—"}</td>
                            <td className="p-2 border-r border-slate-200">{exp.payment_method || "Cash"}</td>
                            <td className="p-2 text-right font-bold text-rose-700">
                              PKR {Number(exp.amount).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-slate-100 border-t-2 border-slate-900 font-black text-xs">
                      <tr>
                        <td colSpan={5} className="p-2.5 border-r border-slate-300 uppercase tracking-wider text-slate-900">
                          Total ({data.expenses?.length || 0} Expense Vouchers)
                        </td>
                        <td className="p-2.5 text-right text-rose-800">
                          PKR {Number(data.summary?.totalExpenseAmount || 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* 4. SERVICE PERFORMANCE */}
            {tab === "service_performance" && Array.isArray(data) && (
              <div className="space-y-4">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-xs border border-slate-300 min-w-[550px]">
                    <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 uppercase font-bold text-[10px]">
                      <tr>
                        <th className="p-2.5 border-r border-slate-200">Service / Treatment Name</th>
                        <th className="p-2.5 border-r border-slate-200">SKU</th>
                        <th className="p-2.5 border-r border-slate-200 text-right">Quantity Sold</th>
                        <th className="p-2.5 text-right font-black">Revenue Generated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {data.length === 0 ? (
                        <tr><td colSpan={4} className="p-8 text-center text-slate-400">No service performance data found.</td></tr>
                      ) : (
                        data.map((srv: any, idx: number) => (
                          <tr key={srv.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                            <td className="p-2 border-r border-slate-200 font-bold text-slate-900">{srv.name}</td>
                            <td className="p-2 border-r border-slate-200 font-mono text-[11px] text-slate-500">{srv.sku}</td>
                            <td className="p-2 border-r border-slate-200 text-right font-semibold">{srv.quantity_sold}</td>
                            <td className="p-2 text-right font-bold text-indigo-900">PKR {Number(srv.revenue).toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-slate-100 border-t-2 border-slate-900 font-black text-xs">
                      <tr>
                        <td colSpan={2} className="p-2.5 border-r border-slate-300 uppercase tracking-wider text-slate-900">
                          Total ({data.length} Services & Packages)
                        </td>
                        <td className="p-2.5 border-r border-slate-300 text-right">
                          {data.reduce((sum: number, s: any) => sum + (s.quantity_sold || 0), 0).toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right text-indigo-900">
                          PKR {data.reduce((sum: number, s: any) => sum + (s.revenue || 0), 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* 5. PAYMENT BREAKDOWN */}
            {tab === "payment_breakdown" && Array.isArray(data) && (
              <div className="space-y-4 max-w-lg mx-auto">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-xs border border-slate-300 min-w-[320px]">
                    <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 uppercase font-bold text-[10px]">
                      <tr>
                        <th className="p-2.5 border-r border-slate-200">Payment Channel / Mode</th>
                        <th className="p-2.5 text-right font-black">Total Collected</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {data.length === 0 ? (
                        <tr><td colSpan={2} className="p-8 text-center text-slate-400">No payment data available.</td></tr>
                      ) : (
                        data.map((p: any, idx: number) => (
                          <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                            <td className="p-2.5 border-r border-slate-200 font-bold text-slate-800">{p.method}</td>
                            <td className="p-2.5 text-right font-black text-emerald-800">PKR {Number(p.amount).toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-slate-100 border-t-2 border-slate-900 font-black text-xs">
                      <tr>
                        <td className="p-2.5 border-r border-slate-300 uppercase tracking-wider text-slate-900">
                          Total Collections
                        </td>
                        <td className="p-2.5 text-right text-emerald-800 text-sm">
                          PKR {data.reduce((sum: number, p: any) => sum + (p.amount || 0), 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* 6. PATIENT LEDGER */}
            {tab === "patient_ledger" && data && (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap justify-between gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Patient Name</span>
                    <span className="font-bold text-sm text-slate-900">{data.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Medical ID / MR</span>
                    <span className="font-mono font-bold text-indigo-700">{data.medical_id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Phone</span>
                    <span className="font-medium text-slate-700">{data.phone || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Advance Wallet Balance</span>
                    <span className="font-bold text-emerald-700">PKR {Number(data.advance_balance || 0).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Current Outstanding Dues</span>
                    <span className="font-bold text-rose-700">PKR {Number(data.current_balance || 0).toFixed(2)}</span>
                  </div>
                </div>

                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-xs border border-slate-300 min-w-[550px]">
                    <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 uppercase font-bold text-[10px]">
                      <tr>
                        <th className="p-2.5 border-r border-slate-200">Date</th>
                        <th className="p-2.5 border-r border-slate-200">Invoice #</th>
                        <th className="p-2.5 border-r border-slate-200 text-right">Net Bill</th>
                        <th className="p-2.5 border-r border-slate-200 text-right">Amount Paid</th>
                        <th className="p-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(!data.sales || data.sales.length === 0) ? (
                        <tr><td colSpan={5} className="p-8 text-center text-slate-400">No invoices on record for this patient.</td></tr>
                      ) : (
                        data.sales.map((s: any, idx: number) => (
                          <tr key={s.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                            <td className="p-2 border-r border-slate-200 whitespace-nowrap">{dayjs(s.date).format("DD-MMM-YYYY")}</td>
                            <td className="p-2 border-r border-slate-200 font-mono font-bold text-indigo-700">{s.invoice_number}</td>
                            <td className="p-2 border-r border-slate-200 text-right font-bold text-slate-900">PKR {Number(s.grand_total).toFixed(2)}</td>
                            <td className="p-2 border-r border-slate-200 text-right font-bold text-emerald-700">PKR {Number(s.paid_amount).toFixed(2)}</td>
                            <td className="p-2 text-center font-bold text-[10px]">
                              <span className={`px-2 py-0.5 rounded ${s.payment_status === "PAID" ? "bg-emerald-100 text-emerald-800" : s.payment_status === "PARTIAL" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"}`}>
                                {s.payment_status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-slate-100 border-t-2 border-slate-900 font-black text-xs">
                      <tr>
                        <td colSpan={2} className="p-2.5 border-r border-slate-300 uppercase tracking-wider text-slate-900">
                          Total ({(data.sales || []).length} Invoices)
                        </td>
                        <td className="p-2.5 border-r border-slate-300 text-right text-indigo-900">
                          PKR {(data.sales || []).reduce((sum: number, s: any) => sum + (s.grand_total || 0), 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2.5 border-r border-slate-300 text-right text-emerald-800">
                          PKR {(data.sales || []).reduce((sum: number, s: any) => sum + (s.paid_amount || 0), 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2.5 text-center text-rose-700 text-[10px]">
                          Due: PKR {(data.sales || []).reduce((sum: number, s: any) => sum + Math.max(0, (s.grand_total || 0) - (s.paid_amount || 0)), 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Patient Payment History */}
                {data.payments && data.payments.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Payments &amp; Advance Cash Receipts ({data.payments.length} Transactions)
                    </h4>
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left text-xs border border-slate-300 min-w-[550px]">
                        <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 uppercase font-bold text-[10px]">
                          <tr>
                            <th className="p-2.5 border-r border-slate-200">Date/Time</th>
                            <th className="p-2.5 border-r border-slate-200">Invoice / Ref #</th>
                            <th className="p-2.5 border-r border-slate-200">Method</th>
                            <th className="p-2.5 border-r border-slate-200">Remarks</th>
                            <th className="p-2.5 text-right font-black">Amount Received</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {data.payments.map((pmt: any, idx: number) => (
                            <tr key={pmt.id || idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                              <td className="p-2 border-r border-slate-200 whitespace-nowrap">
                                {dayjs(pmt.payment_date).format("DD-MMM-YYYY HH:mm")}
                              </td>
                              <td className="p-2 border-r border-slate-200 font-mono font-bold text-indigo-700">
                                {pmt.sale?.invoice_number || "Advance Deposit"}
                              </td>
                              <td className="p-2 border-r border-slate-200">{pmt.payment_method}</td>
                              <td className="p-2 border-r border-slate-200 text-slate-500">{pmt.notes || "Payment received"}</td>
                              <td className="p-2 text-right font-bold text-emerald-800">
                                PKR {Number(pmt.amount).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-100 border-t-2 border-slate-900 font-black text-xs">
                          <tr>
                            <td colSpan={4} className="p-2.5 border-r border-slate-300 uppercase tracking-wider text-slate-900">
                              Total Receipts ({data.payments.length} Payments)
                            </td>
                            <td className="p-2.5 text-right text-emerald-800">
                              PKR {data.payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── Signatures & Verification Block ─── */}
            <div className="pt-8 mt-8 border-t border-slate-200">
              <div className="grid grid-cols-3 gap-6 text-center text-xs">
                <div>
                  <div className="border-b border-slate-400 pb-8 mb-1.5"></div>
                  <span className="font-bold text-slate-800 block">Prepared By</span>
                  <span className="text-[10px] text-slate-400">Accountant / Cashier</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 pb-8 mb-1.5"></div>
                  <span className="font-bold text-slate-800 block">Audited &amp; Verified By</span>
                  <span className="text-[10px] text-slate-400">Internal Audit / Manager</span>
                </div>
                <div>
                  <div className="border-b border-slate-400 pb-8 mb-1.5"></div>
                  <span className="font-bold text-slate-800 block">Authorized Signatory</span>
                  <span className="text-[10px] text-slate-400">Clinic Director / Owner</span>
                </div>
              </div>

              {/* Watermark / Footer note */}
              <div className="mt-8 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-medium">
                <span>
                  {clinic?.footer_note || "Confidential Financial Audit Document • SkinLab Practice Management Suite"}
                </span>
                <span>Powered by Falcon Swift PVT. LTD.</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Global Print Stylesheet */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          main {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
          }
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
        }
      `}</style>
    </div>
  );
}

export default function ReportPreviewPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500 font-medium">Loading report preview...</div>}>
      <ReportPreviewContent />
    </Suspense>
  );
}
