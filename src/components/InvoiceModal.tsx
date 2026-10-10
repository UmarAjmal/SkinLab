"use client";

import { useState, useEffect } from "react";
import dayjs from "dayjs";
import {
  X,
  FileText,
  Printer,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  Stethoscope,
  Sparkles,
  Layers,
  Building2,
} from "lucide-react";
import { printThermalReceipt } from "@/lib/thermalPrinter";

export const StatusBadge = ({ status }: { status: string }) => {
  if (status === "PAID")
    return (
      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" /> Paid
      </span>
    );
  if (status === "PARTIAL")
    return (
      <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
        <AlertCircle className="w-3 h-3" /> Partial
      </span>
    );
  if (status === "DUE")
    return (
      <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
        <AlertCircle className="w-3 h-3" /> Due
      </span>
    );
  return <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full text-xs font-bold">{status}</span>;
};

export default function InvoiceModal({
  selectedSale,
  userRole,
  onClose,
  onOpenPayment,
  onRefundComplete,
}: {
  selectedSale: any;
  userRole: string;
  onClose: () => void;
  onOpenPayment?: (amount: string) => void;
  onRefundComplete?: () => void;
}) {
  const [isRefundMode, setIsRefundMode] = useState(false);
  const [refundReason, setRefundReason] = useState("Patient relocation");
  const [refundQuantities, setRefundQuantities] = useState<Record<string, number>>({});
  const [refundProcessing, setRefundProcessing] = useState(false);
  const [clinicSettings, setClinicSettings] = useState<any>(null);

  // Fetch clinic settings for logo and brand info
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem("pos_cache_settings");
      if (cached) setClinicSettings(JSON.parse(cached));
    } catch (_) {}

    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setClinicSettings(data);
          try { sessionStorage.setItem("pos_cache_settings", JSON.stringify(data)); } catch (_) {}
        }
      })
      .catch(() => { });
  }, []);

  if (!selectedSale) return null;

  // Group items by item_group_name (Deals / Packages) and Standalone Services
  const packageGroups: Record<
    string,
    {
      groupName: string;
      totalPrice: number;
      items: any[];
    }
  > = {};
  const standaloneItems: any[] = [];

  (selectedSale.items || []).forEach((item: any) => {
    if (item.item_group_name && String(item.item_group_name).trim() !== "") {
      const gName = String(item.item_group_name).trim();
      if (!packageGroups[gName]) {
        packageGroups[gName] = {
          groupName: gName,
          totalPrice: 0,
          items: [],
        };
      }
      packageGroups[gName].totalPrice += Number(item.total_price) || 0;
      packageGroups[gName].items.push(item);
    } else {
      standaloneItems.push(item);
    }
  });

  const packagesList = Object.values(packageGroups);

  const calculateRefundTotal = () => {
    let total = 0;
    (selectedSale.items || []).forEach((item: any) => {
      const qty = refundQuantities[item.id] || 0;
      total += qty * item.unit_price;
    });
    return total;
  };

  const processRefund = async () => {
    setRefundProcessing(true);
    try {
      const itemsToReturn = (selectedSale.items || [])
        .filter((item: any) => refundQuantities[item.id] > 0)
        .map((item: any) => ({
          sale_item_id: item.id,
          quantity_returned: refundQuantities[item.id],
          refund_amount: refundQuantities[item.id] * item.unit_price,
        }));

      if (itemsToReturn.length === 0) {
        alert("Please select at least one item to return.");
        setRefundProcessing(false);
        return;
      }

      const res = await fetch(`/api/sales/${selectedSale.id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: itemsToReturn,
          reason: refundReason,
        }),
      });

      if (res.ok) {
        alert("Refund processed successfully! Amount credited to patient advance wallet.");
        setIsRefundMode(false);
        setRefundQuantities({});
        if (onRefundComplete) onRefundComplete();
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to process refund");
      }
    } catch (e) {
      console.error(e);
      alert("Error processing refund");
    } finally {
      setRefundProcessing(false);
    }
  };

  const handlePrintSlip = () => {
    try {
      printThermalReceipt({
        invoiceNumber: selectedSale.invoice_number,
        date: selectedSale.date,
        tokenNumber: selectedSale.token_number || selectedSale.tokenNumber || "P-01",
        visitNo: selectedSale.visit_count || selectedSale.visitNo || 1,
        customer: {
          name: selectedSale.customer?.name || "Walk-in Patient",
          phone: selectedSale.customer?.phone || "",
          medical_id: selectedSale.customer?.medical_id || "",
          current_balance: selectedSale.customer?.current_balance ?? 0,
          advance_balance: selectedSale.customer?.advance_balance ?? 0,
        },
        doctor: selectedSale.doctor ? { name: selectedSale.doctor.name } : null,
        clinic: {
          name: (selectedSale?.company || clinicSettings)?.name || "Skin-Lab Clinic",
          phone: (selectedSale?.company || clinicSettings)?.phone || "",
          logo: (selectedSale?.company || clinicSettings)?.logo || "",
          address: (selectedSale?.company || clinicSettings)?.address || "",
          tax_number: (selectedSale?.company || clinicSettings)?.tax_number || "",
          footer_note: (selectedSale?.company || clinicSettings)?.footer_note || "Thank you for choosing our clinic!",
        },
        items: (selectedSale.items || []).map((it: any) => ({
          name: it.product?.name || "Service",
          item_group_name: it.item_group_name || null,
          quantity: it.quantity,
          unit_price: it.unit_price,
          total_price: it.total_price,
          sessions_allowed: it.sessions_allowed || 1,
          sessions_consumed: it.sessions_consumed ?? 0,
          is_prepaid: it.unit_price === 0 && (it.sessions_allowed || 1) > 1,
        })),
        subtotal: selectedSale.subtotal || selectedSale.grand_total,
        discountAmount: selectedSale.discount_amount || 0,
        grandTotal: selectedSale.grand_total,
        paidAmount: selectedSale.paid_amount || 0,
        balanceDue: Math.max(0, selectedSale.grand_total - (selectedSale.paid_amount || 0)),
        remainingDue: selectedSale.customer?.current_balance,
        paymentMethod: selectedSale.payment_method || "Cash",
      });
    } catch (e) {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:fixed">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-100 my-auto animate-in fade-in zoom-in-95 duration-200 print:max-h-none print:shadow-none print:border-none print:w-full">
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/80 shrink-0 print:bg-white print:border-b-2">
          <div>
            <h3 className="font-bold text-gray-900 text-lg sm:text-xl flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
              Invoice {selectedSale.invoice_number}{" "}
              {isRefundMode ? (
                <span className="text-red-600 font-semibold text-sm">
                  (Return / Refund Mode)
                </span>
              ) : null}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              {dayjs(selectedSale.date).format("MMMM D, YYYY h:mm A")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors print:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {!isRefundMode && (
            <>
              {/* Clinic Branding Header Card (4K Logo & Clinic Info) */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-5 border-b border-gray-100">
                <div className="flex items-center gap-3.5">
                  {clinicSettings?.logo ? (
                    <img
                      src={clinicSettings.logo}
                      alt="Clinic Logo"
                      className="w-14 h-14 object-contain rounded-2xl border border-gray-200/80 bg-white p-1 shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-indigo-600/20 shrink-0">
                      SL
                    </div>
                  )}
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight leading-tight">
                      {clinicSettings?.name || "Skin-Lab Aesthetics Clinic"}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {clinicSettings?.address || "Clinical Aesthetics & Skin Care"}
                      {clinicSettings?.phone ? ` • ${clinicSettings.phone}` : ""}
                    </p>
                    {clinicSettings?.tax_number && (
                      <p className="text-[10px] font-bold text-gray-400 mt-0.5">
                        NTN: {clinicSettings.tax_number}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Patient & Doctor Meta Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 rounded-2xl bg-slate-50 border border-gray-100">
                <div>
                  <div className="text-[11px] text-gray-400 uppercase tracking-wider font-bold mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-indigo-500" /> Billed To Patient
                  </div>
                  <div className="font-bold text-gray-900 text-base">
                    {selectedSale.customer?.name || "Walk-in Patient"}
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">
                    {selectedSale.customer?.phone || "No phone recorded"}
                  </div>
                  {selectedSale.customer?.medical_id && (
                    <div className="text-[11px] font-semibold text-indigo-700 mt-1">
                      MR #: {selectedSale.customer.medical_id}
                    </div>
                  )}
                </div>

                <div className="sm:text-right flex flex-col sm:items-end justify-between">
                  <div>
                    <div className="text-[11px] text-gray-400 uppercase tracking-wider font-bold mb-1">
                      Invoice Status
                    </div>
                    <div className="inline-flex">
                      <StatusBadge status={selectedSale.payment_status} />
                    </div>
                  </div>
                  {selectedSale.doctor?.name && (
                    <div className="mt-2 text-xs text-gray-600 flex items-center sm:justify-end gap-1 font-medium">
                      <Stethoscope className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>
                        Ref Doctor: <strong className="text-gray-900">Dr. {selectedSale.doctor.name}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Section: Grouped Packages & Standalone Services */}
              <div className="space-y-4 mb-6">
                {/* A. Grouped Packages / Deals */}
                {packagesList.map((pkg, pIdx) => (
                  <div
                    key={pIdx}
                    className="rounded-2xl border border-indigo-100/90 bg-gradient-to-br from-indigo-50/50 via-purple-50/20 to-white overflow-hidden shadow-xs"
                  >
                    {/* Package Header */}
                    <div className="px-4 py-3 bg-indigo-50/90 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-xs shrink-0">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-gray-900 text-sm sm:text-base">
                              {pkg.groupName}
                            </h4>
                            <span className="bg-indigo-100 text-indigo-800 border border-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase">
                              Package / Deal
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            Includes {pkg.items.length} procedure{pkg.items.length > 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                          Package Total
                        </div>
                        <div className="font-extrabold text-gray-900 text-sm sm:text-base">
                          PKR {pkg.totalPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Sub-services inside Package */}
                    <div className="p-3 sm:p-4">
                      <div className="text-[11px] font-bold text-indigo-900/80 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-600" />
                        Included Services & Session Progress
                      </div>
                      <div className="divide-y divide-gray-100 bg-white rounded-xl border border-indigo-100/60 overflow-hidden shadow-2xs">
                        {pkg.items.map((item: any) => {
                          const allowed = item.sessions_allowed || item.quantity || 1;
                          const consumed = item.sessions_consumed || 0;
                          const remaining = Math.max(0, allowed - consumed);
                          const isCompleted = consumed >= allowed && allowed > 0;
                          const cleanName = (item.product?.name || "Service").replace(
                            new RegExp(`^${pkg.groupName}\\s*-\\s*`, "i"),
                            ""
                          );

                          return (
                            <div
                              key={item.id}
                              className="p-3 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                            >
                              <div className="min-w-[180px] flex-1">
                                <div className="font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                  {cleanName}
                                </div>
                                <div className="text-[11px] text-gray-500 mt-0.5 pl-3">
                                  Bundled Qty: {item.quantity} {item.unit_price > 0 ? `•PKR ${Number(item.unit_price).toFixed(2)} / session` : ""}
                                </div>
                              </div>

                              {/* Session consumption badge & progress bar */}
                              <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                                <div className="text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <span className="text-xs font-bold text-gray-900">
                                      Session {consumed} of {allowed}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-end gap-1.5 mt-0.5">
                                    {isCompleted ? (
                                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                                        <CheckCircle2 className="w-2.5 h-2.5" /> All Consumed
                                      </span>
                                    ) : (
                                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                                        {remaining} Session{remaining > 1 ? "s" : ""} Remaining
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Visual Progress Bar */}
                                <div className="w-16 sm:w-20 bg-gray-100 h-2.5 rounded-full overflow-hidden border border-gray-200 shrink-0">
                                  <div
                                    className={`h-full transition-all duration-300 ${isCompleted ? "bg-emerald-500" : "bg-indigo-600"
                                      }`}
                                    style={{
                                      width: `${Math.min(100, Math.round((consumed / allowed) * 100))}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                {/* B. Standalone / Individual Services */}
                {standaloneItems.length > 0 && (
                  <div>
                    {packagesList.length > 0 && (
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-gray-400" /> Individual Services & Products
                      </h4>
                    )}
                    <div className="border border-gray-200 rounded-2xl overflow-x-auto w-full bg-white shadow-xs">
                      <table className="w-full text-left border-collapse min-w-[460px]">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider">
                          <tr>
                            <th className="p-3 font-semibold">Description</th>
                            <th className="p-3 font-semibold text-center">Qty</th>
                            <th className="p-3 font-semibold text-center">Sessions</th>
                            <th className="p-3 font-semibold text-right">Unit Price</th>
                            <th className="p-3 font-semibold text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                          {standaloneItems.map((item: any) => {
                            const allowed = item.sessions_allowed || item.quantity || 1;
                            const consumed = item.sessions_consumed || 0;
                            const remaining = Math.max(0, allowed - consumed);

                            return (
                              <tr key={item.id} className="hover:bg-gray-50/50">
                                <td className="p-3 font-medium text-gray-900 text-xs sm:text-sm">
                                  {item.product?.name || "Unknown Product"}
                                </td>
                                <td className="p-3 text-xs sm:text-sm text-center text-gray-600">
                                  {item.quantity}
                                </td>
                                <td className="p-3 text-center">
                                  {allowed > 1 ? (
                                    <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-semibold border border-indigo-100">
                                      {consumed}/{allowed} ({remaining} left)
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 text-xs font-medium">1 Session</span>
                                  )}
                                </td>
                                <td className="p-3 text-xs sm:text-sm text-right text-gray-600">
                                  PKR {Number(item.unit_price).toFixed(2)}
                                </td>
                                <td className="p-3 text-xs sm:text-sm text-right font-bold text-gray-900">
                                  PKR {Number(item.total_price).toFixed(2)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Session Remarks / Clinical Notes */}
              {selectedSale.session_remarks && (
                <div className="bg-amber-50/80 border border-amber-200/70 rounded-2xl p-3.5 mb-6 text-xs text-amber-900 flex items-start gap-2.5 shadow-2xs">
                  <FileText className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold uppercase tracking-wider text-[10px] text-amber-800 block mb-0.5">
                      Clinical Remarks & Session Notes
                    </span>
                    <p className="text-amber-900/90 leading-relaxed font-medium">
                      {selectedSale.session_remarks}
                    </p>
                  </div>
                </div>
              )}

              {/* Financial Breakdown Summary */}
              <div className="w-full sm:w-80 ml-auto space-y-2 text-sm bg-slate-50/70 p-4 rounded-2xl border border-gray-100 mb-6">
                <div className="flex justify-between text-gray-600 text-xs sm:text-sm">
                  <span>Subtotal</span>
                  <span className="font-medium">
                    PKR {(selectedSale.subtotal || selectedSale.grand_total).toFixed(2)}
                  </span>
                </div>
                {selectedSale.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-600 text-xs sm:text-sm font-medium">
                    <span>Discount</span>
                    <span>-PKR {selectedSale.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base text-gray-900 border-t border-gray-200 pt-2 mt-2">
                  <span>Grand Total</span>
                  <span>PKR {selectedSale.grand_total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-emerald-700">
                  <span>Paid To Date</span>
                  <span>PKR {(selectedSale.paid_amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-base text-indigo-700 border-t border-gray-200 pt-2 mt-2">
                  <span>Balance Due</span>
                  <span>
                    PKR{" "}
                    {Math.max(
                      0,
                      selectedSale.grand_total - (selectedSale.paid_amount || 0)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment History / Receipts */}
              {selectedSale.payments && selectedSale.payments.length > 0 && (
                <div className="mt-6 pt-5 border-t border-gray-100">
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Payment & Collection History
                  </div>
                  <div className="bg-gray-50 rounded-xl border border-gray-100 divide-y divide-gray-100 overflow-hidden text-xs">
                    {selectedSale.payments.map((p: any, idx: number) => (
                      <div key={p.id || idx} className="p-3 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-gray-900">
                            PKR {Number(p.amount).toFixed(2)}{" "}
                            <span className="font-normal text-gray-500">via {p.payment_method}</span>
                          </div>
                          <div className="text-gray-500 text-[11px] mt-0.5">
                            {dayjs(p.payment_date).format("DD-MMM-YYYY hh:mm A")}{" "}
                            {p.notes ? `• ${p.notes}` : ""}
                          </div>
                        </div>
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px] border border-emerald-200">
                          RECORDED
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Refund / Return Mode UI */}
          {isRefundMode && (
            <div className="space-y-6">
              <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-red-900">Process a Return / Refund</h4>
                  <p className="text-xs text-red-700 mt-1 leading-relaxed">
                    Select the quantity/sessions to return for each item. The refunded amount will be credited back to the patient's wallet (advance balance).
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Reason for Return
                </label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl shadow-xs text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="Patient relocation">Patient relocation</option>
                  <option value="Adverse reaction">Adverse reaction</option>
                  <option value="Doctor's advice">Doctor's advice</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="p-3 font-semibold">Description</th>
                      <th className="p-3 font-semibold text-center">Allowed</th>
                      <th className="p-3 font-semibold text-center">Consumed</th>
                      <th className="p-3 font-semibold text-center">Return Qty</th>
                      <th className="p-3 font-semibold text-right">Refund Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedSale.items?.map((item: any) => {
                      const maxReturnable = item.sessions_allowed || item.quantity || 1;
                      const currentQty = refundQuantities[item.id] || 0;
                      const lineRefund = currentQty * item.unit_price;

                      return (
                        <tr
                          key={item.id}
                          className={currentQty > 0 ? "bg-red-50/50" : "hover:bg-gray-50/50"}
                        >
                          <td className="p-3 text-xs sm:text-sm font-medium text-gray-900">
                            {item.item_group_name && (
                              <span className="block text-[10px] font-bold text-indigo-600 uppercase">
                                [Package: {item.item_group_name}]
                              </span>
                            )}
                            {item.product?.name || "Service"}
                          </td>
                          <td className="p-3 text-xs sm:text-sm text-center text-gray-600 font-medium">
                            {maxReturnable}
                          </td>
                          <td className="p-3 text-xs sm:text-sm text-center text-gray-600 font-medium">
                            {item.sessions_consumed || 0}
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max={maxReturnable}
                              value={currentQty}
                              onChange={(e) => {
                                let val = parseInt(e.target.value) || 0;
                                if (val > maxReturnable) val = maxReturnable;
                                setRefundQuantities((prev) => ({ ...prev, [item.id]: val }));
                              }}
                              className="w-20 px-3 py-1.5 text-center border border-gray-300 rounded-xl text-xs sm:text-sm font-bold mx-auto focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                            />
                          </td>
                          <td className="p-3 text-xs sm:text-sm text-right font-bold text-red-600">
                            PKR {lineRefund.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <div className="text-right">
                  <div className="text-xs text-gray-500 uppercase font-semibold">
                    Total Refund Amount
                  </div>
                  <div className="text-2xl font-extrabold text-red-600">
                    PKR {calculateRefundTotal().toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-4 border-t border-gray-100 bg-slate-50/80 shrink-0 flex flex-wrap items-center justify-end gap-2 sm:gap-3 print:hidden">
          {!isRefundMode ? (
            <>
              <button
                onClick={handlePrintSlip}
                className="px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl hover:bg-indigo-100 font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
              >
                <Printer className="w-4 h-4 text-indigo-600" /> Print 80mm Slip
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium text-xs sm:text-sm flex items-center shadow-xs transition-all"
              >
                <FileText className="w-4 h-4 mr-1.5" /> Full Page Print
              </button>

              {(userRole === "Admin" || userRole === "Manager") && onRefundComplete && (
                <button
                  onClick={() => setIsRefundMode(true)}
                  className="px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-medium text-xs sm:text-sm flex items-center shadow-xs transition-all"
                >
                  <RotateCcw className="w-4 h-4 mr-1.5" /> Process Return
                </button>
              )}

              {selectedSale.payment_status !== "PAID" &&
                userRole !== "Doctor" &&
                onOpenPayment && (
                  <button
                    onClick={() => {
                      const amount = (
                        selectedSale.grand_total - (selectedSale.paid_amount || 0)
                      ).toFixed(2);
                      onOpenPayment(amount.toString());
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold text-xs sm:text-sm shadow-xs transition-all active:scale-95"
                  >
                    Process Payment
                  </button>
                )}
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setIsRefundMode(false);
                  setRefundQuantities({});
                }}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium text-xs sm:text-sm transition-all"
              >
                Cancel Return
              </button>
              <button
                onClick={processRefund}
                disabled={refundProcessing || calculateRefundTotal() === 0}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold text-xs sm:text-sm disabled:opacity-50 transition-all shadow-xs"
              >
                {refundProcessing ? "Processing..." : "Confirm Refund"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
