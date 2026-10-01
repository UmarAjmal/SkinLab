"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const fetchSuppliers = async () => {
    try {
      const res = await fetch("/api/suppliers");
      const data = await res.json();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const onSubmit = async (data: any) => {
    try {
      const url = selectedSupplier ? `/api/suppliers/ {selectedSupplier.id}` : "/api/suppliers";
      const method = selectedSupplier ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setIsModalOpen(false);
        reset();
        fetchSuppliers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openAddModal = () => {
    setSelectedSupplier(null);
    reset({ name: "", contact_person: "", phone: "", address: "", tax_number: "", balance: 0 });
    setIsModalOpen(true);
  };

  const openEditModal = (supplier: any) => {
    setSelectedSupplier(supplier);
    reset(supplier);
    setIsModalOpen(true);
  };

  const deleteSupplier = async (id: string) => {
    if (!confirm("Are you sure you want to delete this supplier?")) return;
    try {
      await fetch(`/api/suppliers/ {id}`, { method: "DELETE" });
      fetchSuppliers();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-4 sm:p-6 w-full min-w-0">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Suppliers</h2>
        <button
          onClick={openAddModal}
          className="flex items-center px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all text-sm font-semibold shadow-md shadow-indigo-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Supplier
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8 text-gray-500 font-medium">Loading suppliers...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden w-full min-w-0 shadow-xs">
          <div className="overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-gray-100 min-w-[600px]">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Balance</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100 text-sm">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">{s.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{s.contact_person || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{s.phone || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-bold">Rs. {s.balance?.toFixed(2) || "0.00"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                      <button onClick={() => openEditModal(s)} className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-xl mr-2 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteSupplier(s.id)} className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-50 rounded-xl transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {suppliers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 font-medium">No suppliers found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden mx-auto border border-gray-100 max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 shrink-0">
              <h3 className="text-base font-bold text-gray-900">{selectedSupplier ? "Edit Supplier" : "Add Supplier"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-200 transition-colors">×</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Company Name *</label>
                  <input {...register("name", { required: true })} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-slate-900 bg-white font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Contact Person</label>
                  <input {...register("contact_person")} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-slate-900 bg-white font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Phone</label>
                  <input {...register("phone")} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-slate-900 bg-white font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Address</label>
                  <input {...register("address")} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-slate-900 bg-white font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Tax Number</label>
                  <input {...register("tax_number")} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl shadow-2xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-slate-900 bg-white font-medium" />
                </div>

                <div className="mt-6 flex justify-end space-x-3 pt-3 border-t border-gray-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all">Save Supplier</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
