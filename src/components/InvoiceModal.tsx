"use client";

import { useState } from "react";
import { FileText, X, CheckCircle2, Clock, RotateCcw, AlertCircle, Printer } from "lucide-react";
import dayjs from "dayjs";
import { printThermalReceipt } from "@/lib/thermalPrinter";

export const StatusBadge = ({ status }: { status: string }) => {
  if (status === "PAID") return <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center w-fit"><CheckCircle2 className="w-3 h-3 mr-1" /> PAID</span>;
  if (status === "DUE") return <span className="bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center w-fit"><Clock className="w-3 h-3 mr-1" /> DUE</span>;
  if (status === "PARTIAL") return <span className="bg-orange-100 text-orange-700 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center w-fit"><Clock className="w-3 h-3 mr-1" /> PARTIAL</span>;
  return <span>{status}</span>;
};

export default function InvoiceModal({
  selectedSale,
  userRole,
  onClose,
  onOpenPayment,
  onRefundComplete
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

  if (!selectedSale) return null;

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
          refund_amount: refundQuantities[item.id] * item.unit_price
        }));

      if (itemsToReturn.length === 0) {
        alert("Please select at least one item to return.");
        setRefundProcessing(false);
        return;
      }

      const res = await fetch(`/api/sales/${selectedSale.id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: refundReason, items: itemsToReturn })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to process refund");
      }

      setIsRefundMode(false);
      onRefundComplete?.();
      onClose();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setRefundProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
          <div>
            <h3 className="font-bold text-gray-900 text-lg flex items-center">
              <FileText className="w-5 h-5 mr-2 text-indigo-600" />
              Invoice {selectedSale.invoice_number} {isRefundMode ? "- REFUND MODE" : ""}
            </h3>
            <p className="text-xs text-gray-500 mt-1">{dayjs(selectedSale.date).format("MMMM D, YYYY h:mm A")}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">

          {!isRefundMode && (
            <>
              <div className="flex justify-between mb-8 border-b border-gray-100 pb-6">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Billed To</div>
                  <div className="font-bold text-gray-900">{selectedSale.customer?.name}</div>
                  <div className="text-sm text-gray-600">{selectedSale.customer?.phone}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Status</div>
                  <div className="inline-flex"><StatusBadge status={selectedSale.payment_status} /></div>
                </div>
              </div>

              <table className="w-full text-left mb-6">
                <thead>
                  <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase">
                    <th className="pb-2 font-semibold">Description</th>
                    <th className="pb-2 font-semibold text-center">Qty</th>
                    <th className="pb-2 font-semibold text-right">Unit Price</th>
                    <th className="pb-2 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedSale.items?.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-3 text-sm font-medium text-gray-900">{item.product?.name || "Unknown Product"}</td>
                      <td className="py-3 text-sm text-center text-gray-600">{item.quantity}</td>
                      <td className="py-3 text-sm text-right text-gray-600">Rs. {item.unit_price.toFixed(2)}</td>
                      <td className="py-3 text-sm text-right font-medium text-gray-900">Rs. {item.total_price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="w-64 ml-auto space-y-2 text-sm">
                <div className="flex justify-between font-bold text-lg text-gray-900 border-t border-gray-200 pt-2 mt-2">
                  <span>Grand Total</span>
                  <span>Rs. {selectedSale.grand_total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-indigo-700 border-t border-gray-200 pt-2 mt-2">
                  <span>Balance Due</span>
                  <span>Rs. {(selectedSale.grand_total - (selectedSale.paid_amount || 0)).toFixed(2)}</span>
                </div>
              </div>
            </>
          )}

          {isRefundMode && (
            <div className="space-y-6">
              <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-red-900">Process a Return/Refund</h4>
                  <p className="text-sm text-red-700 mt-1">Select the quantity to return for each item. The refunded amount will be credited back to the patient's wallet (advance balance).</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Return</label>
                <select
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Patient relocation">Patient relocation</option>
                  <option value="Adverse reaction">Adverse reaction</option>
                  <option value="Doctor's advice">Doctor's advice</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <table className="w-full text-left mb-6">
                <thead>
                  <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase">
                    <th className="pb-2 font-semibold">Description</th>
                    <th className="pb-2 font-semibold text-center">Purchased Qty</th>
                    <th className="pb-2 font-semibold text-center">Return Qty</th>
                    <th className="pb-2 font-semibold text-right">Refund Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedSale.items?.map((item: any) => {
                    const maxReturnable = item.sessions_allowed || item.quantity;
                    const currentQty = refundQuantities[item.id] || 0;
                    const lineRefund = currentQty * item.unit_price;

                    return (
                      <tr key={item.id} className={currentQty > 0 ? "bg-red-50/50" : ""}>
                        <td className="py-3 text-sm font-medium text-gray-900 px-2">{item.product?.name}</td>
                        <td className="py-3 text-sm text-center text-gray-600">{maxReturnable}</td>
                        <td className="py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max={maxReturnable}
                            value={currentQty}
                            onChange={(e) => {
                              let val = parseInt(e.target.value) || 0;
                              if (val > maxReturnable) val = maxReturnable;
                              setRefundQuantities(prev => ({ ...prev, [item.id]: val }));
                            }}
                            className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-sm mx-auto focus:ring-red-500 focus:border-red-500"
                          />
                        </td>
                        <td className="py-3 text-sm text-right font-medium text-red-600 px-2">
                          {lineRefund.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Total Refund Amount</div>
                  <div className="text-2xl font-bold text-red-600">Rs. {calculateRefundTotal().toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
          {!isRefundMode ? (
            <>
              <button
                onClick={async () => {
                  try {
                    const settingsRes = await fetch("/api/settings");
                    const clinic = settingsRes.ok ? await settingsRes.json() : null;
                    printThermalReceipt({
                      clinic,
                      invoiceNumber: selectedSale.invoice_number,
                      date: selectedSale.date,
                      customer: {
                        name: selectedSale.customer?.name || "Walk-in Patient",
                        phone: selectedSale.customer?.phone || null,
                        medical_id: selectedSale.customer?.medical_id || null,
                        current_balance: selectedSale.customer?.current_balance,
                      },
                      doctor: selectedSale.doctor || null,
                      tokenNumber: selectedSale.token || "P-01",
                      items: (selectedSale.items || []).map((it: any) => ({
                        name: it.product?.name || "Service",
                        product_name: it.product?.name,
                        item_group_name: it.item_group_name,
                        quantity: it.quantity,
                        unit_price: it.unit_price,
                        total_price: it.total_price,
                        sessions_allowed: it.sessions_allowed,
                      })),
                      subtotal: selectedSale.subtotal || selectedSale.grand_total,
                      discount: selectedSale.discount_amount || 0,
                      grandTotal: selectedSale.grand_total,
                      paidAmount: selectedSale.paid_amount || 0,
                      balanceDue: selectedSale.grand_total - (selectedSale.paid_amount || 0),
                      remainingDue: selectedSale.customer?.current_balance,
                      paymentMethod: selectedSale.payment_method || "Cash",
                    });
                  } catch (e) {
                    window.print();
                  }
                }}
                className="px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-100 font-semibold text-sm flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4 text-indigo-600" /> Print 80mm Slip
              </button>

              <button onClick={() => window.print()} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm flex items-center">
                <FileText className="w-4 h-4 mr-2" /> Full Page Print
              </button>

              {(userRole === "Admin" || userRole === "Manager") && onRefundComplete && (
                <button
                  onClick={() => setIsRefundMode(true)}
                  className="px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium text-sm flex items-center"
                >
                  <RotateCcw className="w-4 h-4 mr-2" /> Process Return
                </button>
              )}

              {selectedSale.payment_status !== "PAID" && userRole !== "Doctor" && onOpenPayment && (
                <button
                  onClick={() => {
                    const amount = (selectedSale.grand_total - (selectedSale.paid_amount || 0)).toFixed(2);
                    onOpenPayment(amount.toString());
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm"
                >
                  Process Payment
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => { setIsRefundMode(false); setRefundQuantities({}); }}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
              >
                Cancel Return
              </button>
              <button
                onClick={processRefund}
                disabled={refundProcessing || calculateRefundTotal() === 0}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm disabled:opacity-50"
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
