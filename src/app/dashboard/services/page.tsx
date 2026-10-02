"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, X, Edit2, Trash2, Tag, LayoutList, Package } from "lucide-react";

// Schemas
const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
});

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category_id: z.string().min(1, "Category is required"),
  sku: z.string().optional(),
  cost_price: z.preprocess((val) => (val === "" || val === undefined || val === null ? 0 : val), z.coerce.number().min(0)).default(0),
  selling_price: z.preprocess((val) => (val === "" || val === undefined || val === null ? 0 : val), z.coerce.number().min(0)).default(0),
  tax_class: z.string().default("Standard"),
  stock_quantity: z.preprocess((val) => (val === "" || val === undefined || val === null ? 0 : val), z.coerce.number().min(0)).default(0),
});

const dealSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.preprocess((val) => (val === "" || val === undefined || val === null ? 0 : val), z.coerce.number().min(0)).default(0),
  items: z.array(z.object({
    product_id: z.string().min(1, "Product is required"),
    sessions: z.coerce.number().min(1, "Must be at least 1 session")
  })).min(1, "At least one service is required"),
});

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState<"services" | "deals">("services");

  // Data State
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Modal States
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingDealId, setEditingDealId] = useState<string | null>(null);

  // Forms
  const categoryForm = useForm({ resolver: zodResolver(categorySchema) });
  const productForm = useForm({ resolver: zodResolver(productSchema), defaultValues: { cost_price: 0, stock_quantity: 0, tax_class: "Standard" } });

  const dealForm = useForm({
    resolver: zodResolver(dealSchema),
    defaultValues: { items: [{ product_id: "", sessions: 1 }] }
  });
  const { fields: dealItems, append: appendDealItem, remove: removeDealItem } = useFieldArray({ control: dealForm.control, name: "items" });

  const fetchData = async () => {
    try {
      const [catsRes, prodsRes, dealsRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/products"),
        fetch("/api/deals")
      ]);
      const cats = await catsRes.json();
      const prods = await prodsRes.json();
      const dls = await dealsRes.json();

      setCategories(Array.isArray(cats) ? cats : []);
      setProducts(Array.isArray(prods) ? prods : []);
      setDeals(Array.isArray(dls) ? dls : []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, []);

  // Submit Handlers
  const onCategorySubmit = async (values: any) => {
    try {
      const res = await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || "Failed to create category");
        return;
      }
      setIsCategoryModalOpen(false);
      categoryForm.reset();
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Error saving category");
    }
  };

  const onProductSubmit = async (values: any) => {
    try {
      const url = editingProductId ? `/api/products/${editingProductId}` : "/api/products";
      const method = editingProductId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || "Failed to save service");
        return;
      }
      setIsProductModalOpen(false);
      setEditingProductId(null);
      productForm.reset();
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Error saving service");
    }
  };

  const onDealSubmit = async (values: any) => {
    const url = editingDealId ? `/api/deals/${editingDealId}` : "/api/deals";
    const method = editingDealId ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    setIsDealModalOpen(false);
    setEditingDealId(null);
    dealForm.reset({ items: [{ product_id: "", sessions: 1 }] });
    fetchData();
  };

  const deleteProduct = async (id: string) => {
    if (confirm("Are you sure you want to delete this service?")) {
      await fetch(`/api/products/${id}`, { method: "DELETE" });
      fetchData();
    }
  };

  const deleteDeal = async (id: string) => {
    if (confirm("Are you sure you want to delete this package?")) {
      await fetch(`/api/deals/${id}`, { method: "DELETE" });
      fetchData();
    }
  };

  const filteredProducts = selectedCategory ? products.filter(p => p.category_id === selectedCategory) : products;

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      <header className="bg-white border-b border-gray-200 min-h-16 py-3 px-6 sm:px-8 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-xs z-10">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <LayoutList className="w-6 h-6 text-indigo-600" />
            Services & Packages
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">Configure clinic treatments, pricing, and multi-session bundles</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3.5 py-2 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-xs sm:text-sm font-semibold flex items-center shadow-xs transition-all active:scale-95"
          >
            <Tag className="w-4 h-4 mr-1.5 text-gray-500" /> Add Category
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingProductId(null);
              productForm.reset({
                name: "",
                category_id: "",
                sku: "",
                cost_price: 0,
                selling_price: 0,
                stock_quantity: 0,
                tax_class: "Standard"
              });
              setIsProductModalOpen(true);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-xs sm:text-sm font-semibold flex items-center shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add Service
          </button>
        </div>
      </header>

      <div className="px-6 sm:px-8 pt-6">
        <div className="flex space-x-2 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab("services")}
            className={`px-4 py-2.5 border-b-2 text-sm font-semibold flex items-center transition-all ${activeTab === "services"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            <LayoutList className="w-4 h-4 mr-2" /> Services & Procedures
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("deals")}
            className={`px-4 py-2.5 border-b-2 text-sm font-semibold flex items-center transition-all ${activeTab === "deals"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
          >
            <Package className="w-4 h-4 mr-2" /> Packages & Multi-Sessions
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-8 flex-1 overflow-auto w-full min-w-0">
        {activeTab === "services" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Category Filter:</label>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-xl text-sm pl-3 pr-8 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white shadow-xs"
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-xs w-full min-w-0 overflow-hidden">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[650px]">
                  <thead className="bg-slate-50/80 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-6 font-semibold">SKU / Service Name</th>
                      <th className="py-3.5 px-6 font-semibold">Category</th>
                      <th className="py-3.5 px-6 font-semibold">Selling Price</th>
                      <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                    {filteredProducts.map(p => (
                      <tr key={p.id} className="hover:bg-indigo-50/40 transition-colors">
                        <td className="py-3.5 px-6">
                          <div className="font-semibold text-gray-900">{p.name}</div>
                          <div className="text-xs text-gray-400 font-mono mt-0.5">{p.sku || "N/A"}</div>
                        </td>
                        <td className="py-3.5 px-6">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {p.category?.name || "General"}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 font-bold text-gray-900">
                          PKR {Number(p.selling_price || 0).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProductId(p.id);
                                productForm.reset({
                                  name: p.name,
                                  category_id: p.category_id || "",
                                  sku: p.sku || "",
                                  cost_price: p.cost_price || 0,
                                  selling_price: p.selling_price || 0,
                                  stock_quantity: p.stock_quantity || 0,
                                  tax_class: p.tax_class || "Standard"
                                });
                                setIsProductModalOpen(true);
                              }}
                              className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-gray-200"
                              title="Edit Service"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteProduct(p.id)}
                              className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-gray-200"
                              title="Delete Service"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 && (
                      <tr><td colSpan={4} className="py-16 text-center text-gray-500 font-medium">No services or products found in this category.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "deals" && (
          <div className="space-y-4">
            <div className="flex justify-end mb-4 w-full min-w-0">
              <button
                type="button"
                onClick={() => { setEditingDealId(null); dealForm.reset({ name: "", price: 0, items: [{ product_id: "", sessions: 1 }] }); setIsDealModalOpen(true); }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-xs sm:text-sm font-semibold flex items-center shadow-xs transition-all active:scale-95"
              >
                <Plus className="w-4 h-4 mr-1.5" /> Create Treatment Package
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full min-w-0">
              {deals.map(d => (
                <div key={d.id} className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden hover:shadow-md transition-all">
                  <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-slate-50/60">
                    <div>
                      <h3 className="font-bold text-base text-gray-900">{d.name}</h3>
                      <p className="text-indigo-600 font-bold text-lg mt-0.5">
                        PKR {Number(d.total_price || d.price || 0).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDealId(d.id);
                          dealForm.reset({
                            name: d.name,
                            price: d.total_price || d.price || 0,
                            items: d.items.map((i: any) => ({ product_id: i.product_id, sessions: i.sessions }))
                          });
                          setIsDealModalOpen(true);
                        }}
                        className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-gray-200"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteDeal(d.id)}
                        className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-gray-200"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">Included Treatments:</p>
                    <ul className="space-y-2">
                      {d.items.map((item: any) => (
                        <li key={item.id} className="flex justify-between items-center text-xs border-b border-gray-100 pb-2 last:border-0">
                          <span className="text-gray-700 font-medium">{item.product?.name || "Procedure"}</span>
                          <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold border border-indigo-100">{item.sessions} Session(s)</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
              {deals.length === 0 && (
                <div className="col-span-full py-16 text-center text-gray-500 bg-white border border-dashed border-gray-300 rounded-2xl">
                  No multi-session packages created yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden mx-auto border border-gray-100 my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 bg-slate-50/80">
              <h2 className="text-base font-bold text-gray-900">New Category</h2>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Category Name</label>
                <input {...categoryForm.register("name")} className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs" placeholder="e.g. Skin Care, Laser, Facial" />
              </div>
              <div className="pt-2 flex justify-end space-x-2">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-4 py-2 text-xs sm:text-sm font-medium bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all">Cancel</button>
                <button type="submit" className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-xs transition-all active:scale-95">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product / Service Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden mx-auto max-h-[92vh] flex flex-col border border-gray-100 my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 bg-slate-50/80 shrink-0">
              <h2 className="text-base font-bold text-gray-900">{editingProductId ? 'Edit Service' : 'New Service'}</h2>
              <button onClick={() => setIsProductModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-5 sm:p-6 flex-1">
              <form id="productForm" onSubmit={productForm.handleSubmit(onProductSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Name <span className="text-red-500">*</span></label>
                  <input {...productForm.register("name")} className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs" placeholder="e.g. HydraFacial Deluxe" />
                  {productForm.formState.errors.name && <p className="mt-1 text-xs text-red-500 font-medium">{productForm.formState.errors.name.message as string}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Category <span className="text-red-500">*</span></label>
                    <select {...productForm.register("category_id")} className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white shadow-xs">
                      <option value="">Select Category...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {productForm.formState.errors.category_id && <p className="mt-1 text-xs text-red-500 font-medium">{productForm.formState.errors.category_id.message as string}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                      SKU Code <span className="text-gray-400 font-normal text-xs">(Auto if blank)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SRV-0002"
                      {...productForm.register("sku")}
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                      Selling Price (PKR) <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                    </label>
                    <input type="number" step="0.01" placeholder="0.00" {...productForm.register("selling_price")} className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs" />
                    {productForm.formState.errors.selling_price && <p className="mt-1 text-xs text-red-500 font-medium">{productForm.formState.errors.selling_price.message as string}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Cost Price (PKR)</label>
                    <input type="number" step="0.01" placeholder="0.00" {...productForm.register("cost_price")} className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Stock (Retail only)</label>
                  <input type="number" placeholder="0" {...productForm.register("stock_quantity")} className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs" />
                </div>
              </form>
            </div>
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-slate-50/80 flex justify-end space-x-3 shrink-0">
              <button type="button" onClick={() => setIsProductModalOpen(false)} className="px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 shadow-xs transition-colors">Cancel</button>
              <button type="submit" form="productForm" disabled={productForm.formState.isSubmitting} className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-70 shadow-xs transition-all active:scale-95">{productForm.formState.isSubmitting ? 'Saving...' : 'Save Service'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Package / Deal Modal */}
      {isDealModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col mx-auto border border-gray-100 my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 bg-slate-50/80 shrink-0">
              <h2 className="text-base font-bold text-gray-900">{editingDealId ? 'Edit Package' : 'New Package / Multi-Session Deal'}</h2>
              <button onClick={() => setIsDealModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-5 sm:p-6 flex-1">
              <form id="dealForm" onSubmit={dealForm.handleSubmit(onDealSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Bundle Name <span className="text-red-500">*</span></label>
                    <input {...dealForm.register("name")} className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs" placeholder="e.g. Laser Hair Removal - 6 Sessions" />
                    {dealForm.formState.errors.name && <p className="mt-1 text-xs text-red-500 font-medium">{dealForm.formState.errors.name.message as string}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                      Bundle Price (PKR) <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                    </label>
                    <input type="number" step="0.01" placeholder="0.00" {...dealForm.register("price")} className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs" />
                    {dealForm.formState.errors.price && <p className="mt-1 text-xs text-red-500 font-medium">{dealForm.formState.errors.price.message as string}</p>}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Included Procedures & Sessions</label>
                    <button type="button" onClick={() => appendDealItem({ product_id: "", sessions: 1 })} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5" /> Add Treatment Item
                    </button>
                  </div>

                  <div className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-gray-200">
                    {dealItems.map((field, index) => (
                      <div key={field.id} className="flex items-center space-x-3">
                        <div className="flex-1">
                          <select {...dealForm.register(`items.${index}.product_id`)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white shadow-xs">
                            <option value="">Select Service...</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                        <div className="w-28">
                          <input type="number" min="1" {...dealForm.register(`items.${index}.sessions`)} className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs" placeholder="Sessions" />
                        </div>
                        <button type="button" onClick={() => removeDealItem(index)} className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                    {dealForm.formState.errors.items && <p className="mt-1 text-xs text-red-500 font-medium">{dealForm.formState.errors.items.message as string}</p>}
                  </div>
                </div>
              </form>
            </div>
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-slate-50/80 flex justify-end space-x-3 shrink-0">
              <button type="button" onClick={() => setIsDealModalOpen(false)} className="px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 shadow-xs transition-colors">Cancel</button>
              <button type="submit" form="dealForm" disabled={dealForm.formState.isSubmitting} className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-xs disabled:opacity-70 transition-all active:scale-95">
                {dealForm.formState.isSubmitting ? 'Saving...' : 'Save Package'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
