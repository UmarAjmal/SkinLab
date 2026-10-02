"use client";

import { useState, useEffect } from "react";
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Tag,
  Edit3,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Layers,
  ArrowUpRight,
  Sparkles,
  Wallet,
  Building2,
  TrendingDown,
  RefreshCw,
  Eye,
  FileSpreadsheet,
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useSession } from "next-auth/react";
import Link from "next/link";

dayjs.extend(relativeTime);

export default function ExpensesPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "";
  const canManageExpenses = ["Admin", "Manager", "Cashier"].includes(userRole);
  const isAdminOrManager = ["Admin", "Manager"].includes(userRole);

  // Filter States
  const [datePreset, setDatePreset] = useState<"this_month" | "today" | "this_week" | "last_month" | "custom">("this_month");
  const [startDate, setStartDate] = useState(dayjs().startOf("month").format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(dayjs().endOf("month").format("YYYY-MM-DD"));
  const [selectedCategoryId, setSelectedCategoryId] = useState("ALL");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeView, setActiveView] = useState<"list" | "categories">("list");

  // Data States
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalAmount: 0,
    totalCount: 0,
    todayAmount: 0,
    thisMonthAmount: 0,
    categoryBreakdown: [],
    paymentMethodBreakdown: {},
  });
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

  // Expense Form State
  const [formTitle, setFormTitle] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formDate, setFormDate] = useState(dayjs().format("YYYY-MM-DDTHH:mm"));
  const [formPaymentMethod, setFormPaymentMethod] = useState("Cash");
  const [formPayee, setFormPayee] = useState("");
  const [formReferenceNo, setFormReferenceNo] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Category Form State
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [catSubmitting, setCatSubmitting] = useState(false);
  const [catError, setCatError] = useState("");

  // Quick Preset Handlers
  const handleDatePresetChange = (preset: "this_month" | "today" | "this_week" | "last_month" | "custom") => {
    setDatePreset(preset);
    if (preset === "today") {
      setStartDate(dayjs().format("YYYY-MM-DD"));
      setEndDate(dayjs().format("YYYY-MM-DD"));
    } else if (preset === "this_week") {
      setStartDate(dayjs().startOf("week").format("YYYY-MM-DD"));
      setEndDate(dayjs().endOf("week").format("YYYY-MM-DD"));
    } else if (preset === "this_month") {
      setStartDate(dayjs().startOf("month").format("YYYY-MM-DD"));
      setEndDate(dayjs().endOf("month").format("YYYY-MM-DD"));
    } else if (preset === "last_month") {
      setStartDate(dayjs().subtract(1, "month").startOf("month").format("YYYY-MM-DD"));
      setEndDate(dayjs().subtract(1, "month").endOf("month").format("YYYY-MM-DD"));
    }
  };

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", `${startDate}T00:00:00.000Z`);
      if (endDate) params.append("endDate", `${endDate}T23:59:59.999Z`);
      if (selectedCategoryId !== "ALL") params.append("categoryId", selectedCategoryId);
      if (selectedPaymentMethod !== "ALL") params.append("paymentMethod", selectedPaymentMethod);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const res = await fetch(`/api/expenses?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses || []);
        setCategories(data.categories || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (e) {
      console.error("Error fetching expenses:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/expense-categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Error fetching categories:", e);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExpenses();
    }, 250);
    return () => clearTimeout(timer);
  }, [startDate, endDate, selectedCategoryId, selectedPaymentMethod, searchQuery]);

  // Open Modal for New Expense
  const handleOpenAddModal = () => {
    setEditingExpense(null);
    setFormTitle("");
    setFormAmount("");
    setFormCategoryId(categories[0]?.id || "");
    setFormDate(dayjs().format("YYYY-MM-DDTHH:mm"));
    setFormPaymentMethod("Cash");
    setFormPayee("");
    setFormReferenceNo("");
    setFormNotes("");
    setFormError("");
    setIsExpenseModalOpen(true);
  };

  // Open Modal for Editing Expense
  const handleOpenEditModal = (exp: any) => {
    setEditingExpense(exp);
    setFormTitle(exp.title || "");
    setFormAmount(String(exp.amount || ""));
    setFormCategoryId(exp.category_id || "");
    setFormDate(exp.date ? dayjs(exp.date).format("YYYY-MM-DDTHH:mm") : dayjs().format("YYYY-MM-DDTHH:mm"));
    setFormPaymentMethod(exp.payment_method || "Cash");
    setFormPayee(exp.payee || "");
    setFormReferenceNo(exp.reference_no || "");
    setFormNotes(exp.notes || "");
    setFormError("");
    setIsExpenseModalOpen(true);
  };

  // Submit Expense (Create or Edit)
  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const numAmount = parseFloat(formAmount);
    if (!formTitle.trim()) {
      setFormError("Please enter an expense title/description.");
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError("Please enter a valid expense amount greater than 0.");
      return;
    }
    if (!formCategoryId) {
      setFormError("Please select an expense category.");
      return;
    }

    setFormSubmitting(true);
    try {
      const payload = {
        title: formTitle.trim(),
        amount: numAmount,
        category_id: formCategoryId,
        date: formDate ? new Date(formDate).toISOString() : new Date().toISOString(),
        payment_method: formPaymentMethod,
        payee: formPayee.trim() || null,
        reference_no: formReferenceNo.trim() || null,
        notes: formNotes.trim() || null,
      };

      const url = editingExpense ? `/api/expenses/${editingExpense.id}` : "/api/expenses";
      const method = editingExpense ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save expense");
      }

      setIsExpenseModalOpen(false);
      fetchExpenses();
    } catch (err: any) {
      setFormError(err.message || "Failed to save expense");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Expense
  const handleDeleteExpense = async () => {
    if (!deletingExpenseId) return;
    try {
      const res = await fetch(`/api/expenses/${deletingExpenseId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete expense");
      }
      setDeletingExpenseId(null);
      fetchExpenses();
    } catch (e: any) {
      alert(e.message || "Failed to delete expense");
    }
  };

  // Submit New Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setCatSubmitting(true);
    setCatError("");
    try {
      const res = await fetch("/api/expense-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCatName.trim(),
          description: newCatDesc.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create category");
      }

      setNewCatName("");
      setNewCatDesc("");
      fetchCategories();
      fetchExpenses();
    } catch (err: any) {
      setCatError(err.message || "Failed to create category");
    } finally {
      setCatSubmitting(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (catId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await fetch(`/api/expense-categories/${catId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete category");
      }
      fetchCategories();
      fetchExpenses();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Export CSV
  const exportCSV = () => {
    if (expenses.length === 0) return;
    const headers = ["Date", "Description", "Category", "Payee", "Payment Method", "Voucher #", "Amount (PKR)", "Recorded By", "Notes"];
    const rows = expenses.map((e) => [
      dayjs(e.date).format("YYYY-MM-DD HH:mm"),
      `"${(e.title || "").replace(/"/g, '""')}"`,
      `"${(e.category?.name || "General").replace(/"/g, '""')}"`,
      `"${(e.payee || "").replace(/"/g, '""')}"`,
      e.payment_method || "Cash",
      e.reference_no || "",
      e.amount,
      e.created_by?.email || "",
      `"${(e.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SkinLab_Expenses_${dayjs().format("YYYY-MM-DD")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Preset quick title suggestions
  const QUICK_TITLES = [
    "Clinic Rent (Monthly)",
    "Generator Fuel / Diesel",
    "Staff Tea & Refreshments",
    "Medical Consumables & Needles",
    "Electricity Bill (WAPDA)",
    "Meta Ads / Social Media Marketing",
    "Internet & Wi-Fi Bill",
    "Doctor Commission / Share",
    "AC & Clinic Maintenance",
  ];

  const topCategory = stats.categoryBreakdown?.[0];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 w-full min-w-0">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-tr from-rose-500 to-amber-500 text-white rounded-2xl shadow-md shadow-rose-500/20">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Expense Management
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">
                Track, categorize, and control clinic operating costs, bills, and petty cash
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <Link
            href="/dashboard/reports?tab=expense_report"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all"
          >
            <BarChart3 className="w-4 h-4 text-slate-600" /> Expense Reports
          </Link>

          {isAdminOrManager && (
            <button
              onClick={() => {
                fetchCategories();
                setIsCategoryModalOpen(true);
              }}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all"
            >
              <Tag className="w-4 h-4 text-indigo-600" /> Categories
            </button>
          )}

          {canManageExpenses && (
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-all active:scale-95 ml-auto sm:ml-0"
            >
              <Plus className="w-4 h-4" /> Record Expense
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total In Range */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
              Filtered Total Spent
            </span>
            <div className="text-2xl font-black text-rose-600 tracking-tight">
              PKR {Number(stats.totalAmount || 0).toLocaleString("en-PK", { minimumFractionDigits: 0 })}
            </div>
            <p className="text-[11px] text-gray-500 font-medium">
              {stats.totalCount || 0} expense voucher{stats.totalCount === 1 ? "" : "s"} recorded
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* This Month */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
              Current Month Total
            </span>
            <div className="text-2xl font-black text-gray-900 tracking-tight">
              PKR {Number(stats.thisMonthAmount || 0).toLocaleString("en-PK", { minimumFractionDigits: 0 })}
            </div>
            <p className="text-[11px] text-gray-500 font-medium">
              {dayjs().format("MMMM YYYY")} expenses
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Today's Expenses */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
              Today's Expenses
            </span>
            <div className="text-2xl font-black text-amber-600 tracking-tight">
              PKR {Number(stats.todayAmount || 0).toLocaleString("en-PK", { minimumFractionDigits: 0 })}
            </div>
            <p className="text-[11px] text-gray-500 font-medium">
              Petty cash & day expenditures
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Top Spending Category */}
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1 min-w-0 pr-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
              Top Category
            </span>
            <div className="text-lg font-black text-gray-900 tracking-tight truncate">
              {topCategory?.name || "None"}
            </div>
            <p className="text-[11px] text-gray-500 font-medium">
              {topCategory ? `PKR ${topCategory.amount.toLocaleString()} (${topCategory.count} txns)` : "No expenses recorded"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & View Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-xs space-y-4">
        {/* Row 1: Presets & Date Pickers */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div className="flex flex-wrap items-center gap-1.5 bg-gray-50 p-1 rounded-2xl border border-gray-100 text-xs font-semibold text-gray-600">
            <button
              onClick={() => handleDatePresetChange("this_month")}
              className={`px-3 py-1.5 rounded-xl transition-all ${datePreset === "this_month" ? "bg-white text-indigo-700 shadow-xs font-bold" : "hover:text-gray-900"
                }`}
            >
              This Month
            </button>
            <button
              onClick={() => handleDatePresetChange("today")}
              className={`px-3 py-1.5 rounded-xl transition-all ${datePreset === "today" ? "bg-white text-indigo-700 shadow-xs font-bold" : "hover:text-gray-900"
                }`}
            >
              Today
            </button>
            <button
              onClick={() => handleDatePresetChange("this_week")}
              className={`px-3 py-1.5 rounded-xl transition-all ${datePreset === "this_week" ? "bg-white text-indigo-700 shadow-xs font-bold" : "hover:text-gray-900"
                }`}
            >
              This Week
            </button>
            <button
              onClick={() => handleDatePresetChange("last_month")}
              className={`px-3 py-1.5 rounded-xl transition-all ${datePreset === "last_month" ? "bg-white text-indigo-700 shadow-xs font-bold" : "hover:text-gray-900"
                }`}
            >
              Last Month
            </button>
            <button
              onClick={() => handleDatePresetChange("custom")}
              className={`px-3 py-1.5 rounded-xl transition-all ${datePreset === "custom" ? "bg-white text-indigo-700 shadow-xs font-bold" : "hover:text-gray-900"
                }`}
            >
              Custom Dates
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setDatePreset("custom");
                setStartDate(e.target.value);
              }}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
            <span className="text-gray-400 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setDatePreset("custom");
                setEndDate(e.target.value);
              }}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
          </div>
        </div>

        {/* Row 2: Category, Payment Method, Search & View Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search description, payee, voucher #..."
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden transition-all"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-hidden"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Payment Method Filter */}
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-hidden"
            >
              <option value="ALL">All Payment Methods</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Online / JazzCash">Online / JazzCash</option>
              <option value="Card">Card</option>
              <option value="Cheque">Cheque</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              disabled={expenses.length === 0}
              className="px-3 py-2 bg-slate-50 border border-gray-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
              title="Download CSV report"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV
            </button>

            {/* View Switcher */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-semibold text-gray-600">
              <button
                onClick={() => setActiveView("list")}
                className={`px-3 py-1.5 rounded-lg transition-all ${activeView === "list" ? "bg-white text-gray-900 shadow-2xs font-bold" : "hover:text-gray-900"
                  }`}
              >
                Vouchers Log
              </button>
              <button
                onClick={() => setActiveView("categories")}
                className={`px-3 py-1.5 rounded-lg transition-all ${activeView === "categories" ? "bg-white text-gray-900 shadow-2xs font-bold" : "hover:text-gray-900"
                  }`}
              >
                Category Summary
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-xs">
          <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500 font-medium">Loading clinic expenses...</p>
        </div>
      ) : activeView === "list" ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
          {expenses.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-900">No Expenses Found</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                No expense records match the selected date range and filters. Record a new expense to get started.
              </p>
              {canManageExpenses && (
                <button
                  onClick={handleOpenAddModal}
                  className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-rose-700 inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Record First Expense
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Date & Time</th>
                    <th className="p-4">Expense Description</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Paid To / Payee</th>
                    <th className="p-4 text-center">Payment Method</th>
                    <th className="p-4 text-right">Amount (PKR)</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Date */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="font-bold text-gray-900">
                          {dayjs(exp.date).format("DD-MMM-YYYY")}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {dayjs(exp.date).format("hh:mm A")}
                        </div>
                      </td>

                      {/* Description & Reference */}
                      <td className="p-4">
                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                          {exp.title}
                        </div>
                        {exp.reference_no && (
                          <span className="inline-block mt-0.5 text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                            Ref #: {exp.reference_no}
                          </span>
                        )}
                        {exp.notes && (
                          <div className="text-[11px] text-gray-500 mt-0.5 max-w-xs truncate" title={exp.notes}>
                            Note: {exp.notes}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="p-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-800 border border-indigo-100 px-2.5 py-1 rounded-full text-xs font-semibold">
                          <Tag className="w-3 h-3 text-indigo-500" />
                          {exp.category?.name || "General"}
                        </span>
                      </td>

                      {/* Payee */}
                      <td className="p-4 text-gray-700 font-medium">
                        {exp.payee ? (
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>{exp.payee}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Payment Method */}
                      <td className="p-4 text-center whitespace-nowrap">
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-slate-200">
                          {exp.payment_method || "Cash"}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="font-black text-rose-600 text-sm sm:text-base">
                          PKR {Number(exp.amount).toFixed(2)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {isAdminOrManager && (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(exp)}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Edit Expense"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeletingExpenseId(exp.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete Expense"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Category Breakdown Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(stats.categoryBreakdown || []).map((cat: any, idx: number) => {
            const percentage = stats.totalAmount > 0 ? ((cat.amount / stats.totalAmount) * 100).toFixed(1) : "0";
            return (
              <div key={idx} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900 text-base">{cat.name}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{cat.count} expense transaction{cat.count === 1 ? "" : "s"}</p>
                  </div>
                  <span className="bg-rose-50 text-rose-700 text-xs font-black px-2.5 py-1 rounded-full">
                    {percentage}%
                  </span>
                </div>

                <div className="text-2xl font-black text-gray-900">
                  PKR {Number(cat.amount).toLocaleString("en-PK", { minimumFractionDigits: 2 })}
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-rose-500 to-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, parseFloat(percentage))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: Add / Edit Expense                                */}
      {/* ========================================================= */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-100 my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-600 text-white rounded-xl shadow-xs">
                  <Receipt className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">
                  {editingExpense ? "Edit Expense Voucher" : "Record New Expense"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitExpense} className="p-6 overflow-y-auto flex-1 space-y-4">
              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs sm:text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title / Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Expense Description / Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Generator Diesel, Clinic Rent, Staff Tea, Serums"
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-rose-500 outline-hidden"
                />

                {/* Quick Title Suggestion Pills */}
                {!editingExpense && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {QUICK_TITLES.slice(0, 5).map((qTitle, qIdx) => (
                      <button
                        key={qIdx}
                        type="button"
                        onClick={() => setFormTitle(qTitle)}
                        className="text-[10px] font-semibold bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 px-2 py-0.5 rounded-lg transition-colors"
                      >
                        + {qTitle}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Amount & Category Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Amount (PKR) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">
                      PKR
                    </span>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-12 pr-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-base font-black text-rose-600 focus:ring-2 focus:ring-rose-500 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Category *</span>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="text-[11px] text-indigo-600 hover:underline normal-case font-semibold"
                    >
                      + New
                    </button>
                  </label>
                  <select
                    required
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-rose-500 outline-hidden"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Payment Method Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Expense Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-rose-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Payment Method
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-rose-500 outline-hidden"
                  >
                    <option value="Cash">Cash (Petty Cash)</option>
                    <option value="Bank Transfer">Bank Transfer (HBL/Meezan/Faysal)</option>
                    <option value="Online / JazzCash">Online (JazzCash / EasyPaisa)</option>
                    <option value="Card">Debit / Credit Card</option>
                    <option value="Cheque">Bank Cheque</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Payee & Reference # */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Paid To / Vendor / Person
                  </label>
                  <input
                    type="text"
                    value={formPayee}
                    onChange={(e) => setFormPayee(e.target.value)}
                    placeholder="e.g. Shell Petrol Pump, Landlord, Medical Store"
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-rose-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Bill / Voucher / Ref #
                  </label>
                  <input
                    type="text"
                    value={formReferenceNo}
                    onChange={(e) => setFormReferenceNo(e.target.value)}
                    placeholder="e.g. REC-1049, Bill-882"
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-rose-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Additional Notes / Details
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Optional details, item quantity, reason, or bill particulars..."
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-rose-500 outline-hidden resize-none"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 font-semibold text-xs sm:text-sm rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-rose-600/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {formSubmitting ? "Saving..." : editingExpense ? "Update Voucher" : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: Manage Categories                                 */}
      {/* ========================================================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                  <Tag className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Expense Categories</h3>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Add New Category Form */}
              <form onSubmit={handleCreateCategory} className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 space-y-3">
                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                  Create New Category
                </h4>
                {catError && (
                  <div className="text-xs text-rose-600 font-semibold">{catError}</div>
                )}
                <div>
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Category Name (e.g. Lab Tests, Laundry, Security)"
                    className="w-full px-3.5 py-2 bg-white border border-indigo-200 rounded-xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    placeholder="Optional short description..."
                    className="w-full px-3.5 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>
                <button
                  type="submit"
                  disabled={catSubmitting || !newCatName.trim()}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {catSubmitting ? "Adding..." : "+ Add Category"}
                </button>
              </form>

              {/* Categories List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Active Categories ({categories.length})
                </h4>
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden bg-white">
                  {categories.map((c) => (
                    <div key={c.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div>
                        <div className="font-bold text-gray-900 text-xs sm:text-sm">{c.name}</div>
                        {c.description && (
                          <div className="text-[11px] text-gray-400">{c.description}</div>
                        )}
                        <span className="text-[10px] text-indigo-600 font-semibold">
                          {c._count?.expenses || 0} expenses recorded
                        </span>
                      </div>
                      {userRole === "Admin" && (
                        <button
                          onClick={() => handleDeleteCategory(c.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: Delete Confirmation                               */}
      {/* ========================================================= */}
      {deletingExpenseId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-gray-100 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Delete Expense Voucher?</h3>
              <p className="text-xs text-gray-500 mt-1">
                This expense record will be permanently removed from clinic books.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeletingExpenseId(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-gray-700 font-semibold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteExpense}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
