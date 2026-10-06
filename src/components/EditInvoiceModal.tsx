"use client";

import { useState, useEffect } from "react";
import { Edit3, X, Save, AlertCircle, Calendar, User, Stethoscope, FileText, CheckCircle2 } from "lucide-react";
import dayjs from "dayjs";

export default function EditInvoiceModal({
  sale,
  onClose,
  onSaveComplete,
}: {
  sale: any;
  onClose: () => void;
  onSaveComplete: () => void;
}) {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(sale?.doctor_id || "");
  const [invoiceDate, setInvoiceDate] = useState<string>(
    sale?.date ? dayjs(sale.date).format("YYYY-MM-DDTHH:mm") : ""
  );
  const [paymentMethod, setPaymentMethod] = useState<string>(sale?.payment_method || "Cash");
  const [discountAmount, setDiscountAmount] = useState<number>(sale?.discount_amount || 0);
  const [sessionRemarks, setSessionRemarks] = useState<string>(sale?.session_remarks || "");
  const [items, setItems] = useState<any[]>(
    (sale?.items || []).map((it: any) => ({
      id: it.id,
      name: it.product?.name || "Service / Product",
      item_group_name: it.item_group_name || null,
      quantity: it.quantity,
      unit_price: it.unit_price,
      sessions_allowed: it.sessions_allowed || 1,
      sessions_consumed: it.sessions_consumed || 0,
      total_price: it.total_price,
    }))
  );

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch doctors list
  useEffect(() => {
    fetch("/api/employees")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDoctors(data);
        }
      })
      .catch((e) => console.error("Error fetching doctors:", e));
  }, []);

  if (!sale) return null;

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };
    const qty = Math.max(1, parseInt(item.quantity) || 1);
    const unitPrice = Math.max(0, parseFloat(item.unit_price) || 0);
    item.total_price = qty * unitPrice;
    updated[index] = item;
    setItems(updated);
  };

  const calculatedSubtotal = items.reduce((sum, it) => sum + (Number(it.total_price) || 0), 0);
  const calculatedGrandTotal = Math.max(0, calculatedSubtotal - (Number(discountAmount) || 0));
  const paidAmount = Number(sale.paid_amount) || 0;
  const calculatedBalanceDue = Math.max(0, calculatedGrandTotal - paidAmount);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage("");

    try {
      const payload = {
        doctor_id: selectedDoctorId || null,
        date: invoiceDate ? new Date(invoiceDate).toISOString() : sale.date,
        payment_method: paymentMethod,
        discount_amount: discountAmount,
        session_remarks: sessionRemarks,
        items: items.map((it) => ({
          id: it.id,
          quantity: it.quantity,
          unit_price: it.unit_price,
          sessions_allowed: it.sessions_allowed,
          sessions_consumed: it.sessions_consumed,
        })),
      };

      const res = await fetch(`/api/sales/${sale.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update invoice");
      }

      onSaveComplete();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save invoice changes.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-100 my-auto animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/80 shrink-0">
          <div>
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-indigo-600" />
              Edit Invoice {sale.invoice_number}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Billed to: <strong className="text-gray-800">{sale.customer?.name}</strong> {sale.customer?.medical_id ? `(${sale.customer.medical_id})` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-6">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* General Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Stethoscope className="w-3.5 h-3.5 text-indigo-600" /> Assigned Doctor
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden"
              >
                <option value="">No Doctor / General</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} {doc.is_doctor ? "(Doctor)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Invoice Date
              </label>
              <input
                type="datetime-local"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden"
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card / Online</option>
                <option value="Credit">Credit / On Account</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>Invoice Items & Treatments</span>
              <span className="text-gray-400 font-normal">{items.length} items</span>
            </h4>
            <div className="border border-gray-200 rounded-2xl overflow-x-auto w-full bg-white shadow-xs">
              <table className="w-full text-left border-collapse min-w-[550px]">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-3 font-semibold">Service / Deal</th>
                    <th className="p-3 font-semibold text-center w-20">Qty</th>
                    <th className="p-3 font-semibold text-right w-32">Unit Price (PKR)</th>
                    <th className="p-3 font-semibold text-center w-24">Allowed</th>
                    <th className="p-3 font-semibold text-center w-24">Consumed</th>
                    <th className="p-3 font-semibold text-right w-32">Total (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-gray-50/50">
                      <td className="p-3 font-medium text-gray-900 text-xs sm:text-sm">
                        <div>{item.name}</div>
                        {item.item_group_name && (
                          <span className="inline-block mt-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                            Package: {item.item_group_name}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", parseInt(e.target.value) || 1)}
                          className="w-14 px-2 py-1 border border-gray-200 rounded-lg text-center font-bold text-gray-800 text-xs focus:ring-2 focus:ring-indigo-500 outline-hidden"
                        />
                      </td>
                      <td className="p-3 text-right">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(idx, "unit_price", parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 border border-gray-200 rounded-lg text-right font-bold text-gray-800 text-xs focus:ring-2 focus:ring-indigo-500 outline-hidden"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          min="1"
                          title="Total sessions allowed"
                          value={item.sessions_allowed}
                          onChange={(e) => handleItemChange(idx, "sessions_allowed", parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-center font-medium text-gray-700 text-xs focus:ring-2 focus:ring-indigo-500 outline-hidden"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          min="0"
                          title="Sessions consumed so far"
                          value={item.sessions_consumed}
                          onChange={(e) => handleItemChange(idx, "sessions_consumed", parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-center font-medium text-gray-700 text-xs focus:ring-2 focus:ring-indigo-500 outline-hidden"
                        />
                      </td>
                      <td className="p-3 text-right font-bold text-gray-900 text-xs sm:text-sm">
                        PKR {Number(item.total_price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Remarks & Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-indigo-600" /> Session Remarks / Clinical Notes
              </label>
              <textarea
                rows={3}
                value={sessionRemarks}
                onChange={(e) => setSessionRemarks(e.target.value)}
                placeholder="Doctor/clinical remarks, follow-up instructions..."
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-gray-100 space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-900">PKR {calculatedSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Discount (PKR)</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 bg-white border border-gray-200 rounded-lg text-right font-bold text-emerald-700 text-xs focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>
              <div className="flex justify-between font-bold text-sm sm:text-base text-gray-900 border-t border-gray-200 pt-2">
                <span>Grand Total</span>
                <span>PKR {calculatedGrandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Paid To Date</span>
                <span>PKR {paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-indigo-700 border-t border-gray-200 pt-2">
                <span>Balance Due</span>
                <span>PKR {calculatedBalanceDue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
