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
    await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    setIsCategoryModalOpen(false);
    categoryForm.reset();
    fetchData();
  };

  const onProductSubmit = async (values: any) => {
    const url = editingProductId ? `/api/products/${editingProductId}` : "/api/products";
    const method = editingProductId ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    setIsProductModalOpen(false);
    setEditingProductId(null);
    productForm.reset();
    fetchData();
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
      <header className="bg-white border-b h-16 flex items-center justify-between px-8 shrink-0 shadow-sm z-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Services & Products</h1>
        </div>
        <div className="flex space-x-3">
          <button type="button" onClick={() => setIsCategoryModalOpen(true)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center shadow-sm">
            <Tag className="w-4 h-4 mr-2" /> Add Category
          </button>
          <button type="button" onClick={() => { setEditingProductId(null); productForm.reset(); setIsProductModalOpen(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex items-center shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Add Service
          </button>
        </div>
      </header>

      <div className="px-8 pt-6">
        <div className="flex space-x-1 border-b border-gray-200">
          <button type="button" onClick={() => setActiveTab("services")} className={`px-4 py-2 border-b-2 text-sm font-medium flex items-center  {activeTab === "services" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
            <LayoutList className="w-4 h-4 mr-2" /> Services & Products
          </button>
          <button type="button" onClick={() => setActiveTab("deals")} className={`px-4 py-2 border-b-2 text-sm font-medium flex items-center  {activeTab === "deals" ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
            <Package className="w-4 h-4 mr-2" /> Packages & Deals
          </button>
        </div>
      </div>

      <div className="p-8 flex-1 overflow-auto">
        {activeTab === "services" && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4 mb-6">
              <label className="text-sm font-medium text-gray-700">Filter by Category:</label>
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="border-gray-300 rounded-md text-sm pl-3 pr-8 py-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm w-full min-w-0 overflow-hidden">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="py-4 px-6 font-semibold">SKU / Name</th>
                      <th className="py-4 px-6 font-semibold">Category</th>
                      <th className="py-4 px-6 font-semibold">Price</th>
                      <th className="py-4 px-6 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                    {filteredProducts.map(p => (
                      <tr key={p.id} className="hover:bg-indigo-50/30">
                        <td className="py-4 px-6">
                          <div className="font-medium text-gray-900">{p.name}</div>
                          <div className="text-xs text-gray-500 font-mono mt-0.5">{p.sku}</div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {p.category?.name || "Uncategorized"}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-semibold text-gray-900"> {p.selling_price.toFixed(2)}</td>
                        <td className="py-4 px-6 text-right">
                          <button type="button" onClick={() => { setEditingProductId(p.id); productForm.reset({ ...p, category_id: p.category_id || "" }); setIsProductModalOpen(true); }} className="text-indigo-600 hover:text-indigo-900 mr-4">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => deleteProduct(p.id)} className="text-red-600 hover:text-red-900">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 && (
                      <tr><td colSpan={4} className="py-12 text-center text-gray-500">No services found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "deals" && (
          <div className="space-y-4">
            <div className="flex justify-end mb-6 w-full min-w-0">
              <button type="button" onClick={() => { setEditingDealId(null); dealForm.reset({ name: "", price: 0, items: [{ product_id: "", sessions: 1 }] }); setIsDealModalOpen(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex items-center shadow-sm">
                <Plus className="w-4 h-4 mr-2" /> Create Bundle / Deal
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full min-w-0">
              {deals.map(d => (
                <div key={d.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-indigo-50/30">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{d.name}</h3>
                      <p className="text-indigo-600 font-bold mt-1"> {(d.total_price || d.price || 0).toFixed(2)}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button type="button" onClick={() => {
                        setEditingDealId(d.id);
                        dealForm.reset({
                          name: d.name,
                          price: d.total_price || d.price || 0,
                          items: d.items.map((i: any) => ({ product_id: i.product_id, sessions: i.sessions }))
                        });
                        setIsDealModalOpen(true);
                      }} className="text-indigo-600 hover:text-indigo-900 p-1">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => deleteDeal(d.id)} className="text-red-600 hover:text-red-900 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-sm font-medium text-gray-700 mb-3">Included Services:</p>
                    <ul className="space-y-2">
                      {d.items.map((item: any) => (
                        <li key={item.id} className="flex justify-between items-center text-sm border-b border-dashed border-gray-200 pb-2 last:border-0">
                          <span className="text-gray-600">{item.product?.name || "Unknown"}</span>
                          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-bold">{item.sessions} session(s)</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
              {deals.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-500 bg-white border border-dashed border-gray-300 rounded-xl">
                  No packages or deals created yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden mx-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">New Category</h2>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                <input {...categoryForm.register("name")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div className="pt-2 flex justify-end space-x-2">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden mx-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b bg-gray-50/50 shrink-0">
              <h2 className="text-lg font-semibold">{editingProductId ? 'Edit Service' : 'New Service'}</h2>
              <button onClick={() => setIsProductModalOpen(false)} className="text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-y-auto p-6">
              <form id="productForm" onSubmit={productForm.handleSubmit(onProductSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
                  <input {...productForm.register("name")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                  {productForm.formState.errors.name && <p className="mt-1 text-xs text-red-500">{productForm.formState.errors.name.message as string}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
                    <select {...productForm.register("category_id")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500">
                      <option value="">Select Category...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {productForm.formState.errors.category_id && <p className="mt-1 text-xs text-red-500">{productForm.formState.errors.category_id.message as string}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Selling Price ( ) <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                    </label>
                    <input type="number" step="0.01" placeholder="0.00" {...productForm.register("selling_price")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                    {productForm.formState.errors.selling_price && <p className="mt-1 text-xs text-red-500">{productForm.formState.errors.selling_price.message as string}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price ( )</label>
                    <input type="number" step="0.01" placeholder="0.00" {...productForm.register("cost_price")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock (Retail only)</label>
                    <input type="number" placeholder="0" {...productForm.register("stock_quantity")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                </div>
              </form>
            </div>
            <div className="p-5 border-t bg-gray-50 flex justify-end space-x-3 shrink-0">
              <button type="button" onClick={() => setIsProductModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="submit" form="productForm" disabled={productForm.formState.isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-70">{productForm.formState.isSubmitting ? 'Saving...' : 'Save Service'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Deal Modal */}
      {isDealModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col mx-auto">
            <div className="flex items-center justify-between p-5 border-b bg-gray-50/50 shrink-0">
              <h2 className="text-lg font-semibold">{editingDealId ? 'Edit Package' : 'New Package / Deal'}</h2>
              <button onClick={() => setIsDealModalOpen(false)} className="text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-auto p-6">
              <form id="dealForm" onSubmit={dealForm.handleSubmit(onDealSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bundle Name <span className="text-red-500">*</span></label>
                    <input {...dealForm.register("name")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. Laser Hair Removal - 6 Sessions" />
                    {dealForm.formState.errors.name && <p className="mt-1 text-xs text-red-500">{dealForm.formState.errors.name.message as string}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bundle Price ( ) <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                    </label>
                    <input type="number" step="0.01" placeholder="0.00" {...dealForm.register("price")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500" />
                    {dealForm.formState.errors.price && <p className="mt-1 text-xs text-red-500">{dealForm.formState.errors.price.message as string}</p>}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-gray-900">Included Services</label>
                    <button type="button" onClick={() => appendDealItem({ product_id: "", sessions: 1 })} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center">
                      <Plus className="w-3 h-3 mr-1" /> Add Item
                    </button>
                  </div>

                  <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    {dealItems.map((field, index) => (
                      <div key={field.id} className="flex items-center space-x-3">
                        <div className="flex-1">
                          <select {...dealForm.register(`items.${index}.product_id`)} className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                            <option value="">Select Service...</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                        <div className="w-24">
                          <input type="number" min="1" {...dealForm.register(`items.${index}.sessions`)} className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="Sessions" />
                        </div>
                        <button type="button" onClick={() => removeDealItem(index)} className="text-red-500 hover:text-red-700 p-1"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                    {dealForm.formState.errors.items && <p className="mt-1 text-xs text-red-500">{dealForm.formState.errors.items.message as string}</p>}
                  </div>
                </div>
              </form>
            </div>
            <div className="p-5 border-t bg-gray-50 flex justify-end space-x-3 shrink-0">
              <button type="button" onClick={() => setIsDealModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="submit" form="dealForm" disabled={dealForm.formState.isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm disabled:opacity-70">
                {dealForm.formState.isSubmitting ? 'Saving...' : 'Save Package'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
