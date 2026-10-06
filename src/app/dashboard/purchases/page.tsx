"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Trash2, ArrowLeft } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const { register, control, handleSubmit, watch, setValue, reset, formState: { isSubmitting } } = useForm({
    defaultValues: {
      supplier_id: "",
      invoice_number: "",
      date: new Date().toISOString().slice(0, 10),
      status: "RECEIVED",
      delivery_charges: 0,
      tax: 0,
      items: [{ product_id: "", quantity: 1, unit_cost: 0, total_cost: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchItems = watch("items");
  const watchDelivery = watch("delivery_charges") || 0;
  const watchTax = watch("tax") || 0;

  // Auto-calculate totals
  const subtotal = watchItems.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_cost) || 0), 0);
  const grandTotal = subtotal + Number(watchDelivery) + Number(watchTax);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pRes, sRes, prRes] = await Promise.all([
        fetch("/api/purchases"),
        fetch("/api/suppliers"),
        fetch("/api/products")
      ]);
      const pData = await pRes.json();
      const sData = await sRes.json();
      const prData = await prRes.json();

      setPurchases(Array.isArray(pData) ? pData : []);
      setSuppliers(Array.isArray(sData) ? sData : []);
      setProducts(Array.isArray(prData) ? prData : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    // Recalculate item totals before submitting
    const formattedData = {
      ...data,
      subtotal,
      delivery_charges: Number(data.delivery_charges),
      tax: Number(data.tax),
      grand_total: grandTotal,
      items: data.items.map((item: any) => ({
        product_id: item.product_id,
        quantity: Number(item.quantity),
        unit_cost: Number(item.unit_cost),
        total_cost: Number(item.quantity) * Number(item.unit_cost)
      }))
    };

    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedData)
      });
      if (res.ok) {
        setIsCreating(false);
        reset();
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create purchase");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isCreating) {
    return (
      <div className="p-4 sm:p-6 w-full min-w-0">
        <div className="flex items-center mb-6">
          <button onClick={() => setIsCreating(false)} className="mr-4 p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h2 className="text-xl font-bold text-gray-900">New Purchase Order</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Supplier *</label>
                <select {...register("supplier_id", { required: true })} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-slate-900 bg-white font-medium">
                  <option value="">Select a supplier...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Invoice Number *</label>
                <input {...register("invoice_number", { required: true })} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-slate-900 bg-white font-medium" placeholder="INV-12345" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Date</label>
                <input type="date" {...register("date")} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-slate-900 bg-white font-medium" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Status</label>
                <select {...register("status")} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-slate-900 bg-white font-medium">
                  <option value="RECEIVED">Received</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm w-full min-w-0">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-gray-900">Line Items</h3>
              <button type="button" onClick={() => append({ product_id: "", quantity: 1, unit_cost: 0, total_cost: 0 })} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center">
                <Plus className="w-4 h-4 mr-1" /> Add Row
              </button>
            </div>

            <div className="space-y-3 w-full min-w-0">
              {fields.map((field, index) => (
                <div key={field.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-gray-50/80 p-3.5 rounded-xl border border-gray-200/70">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-medium text-gray-500 mb-1 sm:hidden">Product</label>
                    <select {...register(`items.${index}.product_id` as const, { required: true })} className="w-full px-3 py-2 border border-gray-200 rounded-xl shadow-2xs text-sm text-slate-900 bg-white font-medium focus:ring-2 focus:ring-indigo-500">
                      <option value="">Select product...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="w-full sm:w-24">
                    <label className="block text-xs font-medium text-gray-500 mb-1 sm:hidden">Qty</label>
                    <input type="number" step="1" {...register(`items.${index}.quantity` as const, { required: true, min: 1 })} className="w-full px-3 py-2 border border-gray-200 rounded-xl shadow-2xs text-sm text-slate-900 bg-white font-medium text-center focus:ring-2 focus:ring-indigo-500" placeholder="Qty" />
                  </div>
                  <div className="w-full sm:w-36">
                    <label className="block text-xs font-medium text-gray-500 mb-1 sm:hidden">Unit Cost (PKR)</label>
                    <input type="number" step="0.01" {...register(`items.${index}.unit_cost` as const, { required: true, min: 0 })} className="w-full px-3 py-2 border border-gray-200 rounded-xl shadow-2xs text-sm text-slate-900 bg-white font-medium focus:ring-2 focus:ring-indigo-500" placeholder="Cost" />
                  </div>
                  <div className="w-full sm:w-36 pt-2 sm:pt-0 font-bold text-gray-900 sm:text-right">
                    PKR {(Number(watchItems[index]?.quantity || 0) * Number(watchItems[index]?.unit_cost || 0)).toFixed(2)}
                  </div>
                  <button type="button" onClick={() => remove(index)} className="text-gray-400 hover:text-rose-600 p-1.5 rounded-xl hover:bg-rose-50 transition-colors ml-auto sm:ml-0 mt-[-2rem] sm:mt-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-end">
            <div className="w-full max-w-sm space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Subtotal:</span>
                <span className="font-bold text-gray-900">PKR {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-500 font-medium">Delivery / Shipping:</span>
                <input type="number" step="0.01" {...register("delivery_charges")} className="w-28 px-3 py-1.5 border border-gray-200 rounded-xl text-sm font-semibold text-right text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex justify-between text-sm items-center border-b border-gray-100 pb-3">
                <span className="text-gray-500 font-medium">Tax (PKR):</span>
                <input type="number" step="0.01" {...register("tax")} className="w-28 px-3 py-1.5 border border-gray-200 rounded-xl text-sm font-semibold text-right text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2">
                <span>Grand Total:</span>
                <span className="text-indigo-600">PKR {grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-8 flex space-x-3">
              <button type="button" onClick={() => setIsCreating(false)} className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <button type="submit" disabled={isSubmitting || fields.length === 0} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all">
                {isSubmitting ? "Saving..." : "Save Purchase"}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Purchase Orders</h2>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">Manage vendor purchases, inventory receipts, and supplier bills.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="w-full sm:w-auto flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Purchase
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8 text-gray-500 font-medium">Loading purchases...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden w-full min-w-0 shadow-xs">
          {/* Mobile Cards (< md) */}
          <div className="md:hidden divide-y divide-gray-100">
            {purchases.map((p) => (
              <div key={p.id} className="p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold">
                    {p.invoice_number}
                  </span>
                  <span className={`px-2 py-0.5 inline-flex text-[10px] font-bold rounded-lg ${
                    p.status === 'RECEIVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {p.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="font-semibold text-gray-900">{p.supplier?.name || "No Supplier"}</span>
                  <span>{new Date(p.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-gray-50 text-xs">
                  <span className="text-gray-400">Total Order Amount:</span>
                  <span className="font-black text-gray-900 text-sm">
                    PKR {Number(p.grand_total || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
            {purchases.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm font-medium">No purchases found.</div>
            )}
          </div>

          {/* Desktop Table (>= md) */}
          <div className="hidden md:block overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-gray-100 min-w-[600px]">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Invoice #</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100 text-sm">
                {purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">{new Date(p.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-indigo-600">
                      <span className="bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg text-xs font-mono">{p.invoice_number}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{p.supplier?.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-bold">PKR {p.grand_total?.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs font-bold rounded-lg ${p.status === 'RECEIVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {purchases.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 font-medium">No purchases found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
