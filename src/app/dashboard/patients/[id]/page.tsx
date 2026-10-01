"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit2,
  Calendar,
  Package,
  CreditCard,
  Wallet,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Clock,
  Printer,
  Plus,
  Receipt,
  User,
  AlertCircle,
  FileText,
  DollarSign,
  ChevronRight,
  ExternalLink,
  Sparkles,
  ShoppingBag
} from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import dayjs from "dayjs";
import { useSession } from "next-auth/react";
import InvoiceModal, { StatusBadge } from "@/components/InvoiceModal";
import { printThermalReceipt, ThermalReceiptData } from "@/lib/thermalPrinter";

const patientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
});
type PatientFormValues = z.infer<typeof patientSchema>;

export default function PatientDetailPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "";
  const params = useParams();
  const router = useRouter();

  const rawId = Array.isArray(params?.id) ? params.id[0] : (params?.id || "");
  const patientId = decodeURIComponent(rawId).trim();

  const [patient, setPatient] = useState<any>(null);
  const [clinicSettings, setClinicSettings] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Invoice Details Modal
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Payment Modal State
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  // Wallet Top-up Modal State
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletAmount, setWalletAmount] = useState("");
  const [walletProcessing, setWalletProcessing] = useState(false);
  const [walletError, setWalletError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
  });

  const fetchPatient = async () => {
    if (!patientId) return;
    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch(`/api/patients/${patientId}`);
      if (!res.ok) {
        throw new Error("Patient not found");
      }
      const data = await res.json();
      setPatient(data);
      reset({
        name: data.name || "",
        phone: data.phone || "",
        email: data.email || "",
        address: data.address || "",
      });
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.message || "Failed to load patient record");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setClinicSettings(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPatient();
    fetchSettings();
  }, [patientId]);

  const onUpdateProfile = async (values: PatientFormValues) => {
    try {
      const res = await fetch(`/api/patients/${patientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        setIsEditing(false);
        fetchPatient();
      }
    } catch (e) {
      console.error("Failed to update patient", e);
    }
  };

  // Payment Collection
  const processPayment = async () => {
    if (!selectedSale) return;
    setPaymentError("");
    setPaymentProcessing(true);

    try {
      const res = await fetch(`/api/sales/${selectedSale.id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          payment_method: paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process payment");

      setIsPaymentModalOpen(false);
      setSelectedSale(null);
      fetchPatient();
    } catch (e: any) {
      setPaymentError(e.message);
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Wallet Advance Deposit
  const processWalletDeposit = async () => {
    const amountNum = parseFloat(walletAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setWalletError("Please enter a valid deposit amount.");
      return;
    }

    setWalletError("");
    setWalletProcessing(true);

    try {
      const res = await fetch(`/api/patients/${patientId}/wallet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountNum }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add advance balance");

      setIsWalletModalOpen(false);
      setWalletAmount("");
      fetchPatient();
    } catch (e: any) {
      setWalletError(e.message);
    } finally {
      setWalletProcessing(false);
    }
  };

  // Print Thermal Receipt
  const handlePrintReceipt = (sale: any) => {
    const remainingDue = Math.max(0, sale.grand_total - (sale.paid_amount || 0));

    const receiptData: ThermalReceiptData = {
      clinic: {
        name: clinicSettings?.name || "BEYOND BEAUTY CLINIC",
        phone: clinicSettings?.phone || "+92 326-3392082",
        address: clinicSettings?.address || "Clinic Address",
        logo: clinicSettings?.logo || "",
        footer_note: clinicSettings?.footer_note || "Divine Glow You Need",
        tax_number: clinicSettings?.tax_number || "",
      },
      invoiceNumber: sale.invoice_number,
      date: sale.date,
      customer: {
        name: patient.name,
        phone: patient.phone,
        medical_id: patient.medical_id,
        current_balance: patient.current_balance,
        advance_balance: patient.advance_balance,
      },
      doctor: sale.doctor ? { name: sale.doctor.name } : null,
      tokenNumber: "001",
      items: (sale.items || []).map((it: any) => ({
        name: it.product?.name || "Procedure / Service",
        item_group_name: it.item_group_name,
        quantity: it.quantity,
        unit_price: it.unit_price,
        total_price: it.total_price,
        sessions_allowed: it.sessions_allowed,
        sessions_consumed: it.sessions_consumed,
      })),
      subtotal: sale.subtotal,
      discount: sale.discount_amount || 0,
      grandTotal: sale.grand_total,
      paidAmount: sale.paid_amount || 0,
      remainingDue: remainingDue,
      paymentMethod: sale.payment_method || "Cash",
    };

    printThermalReceipt(receiptData);
  };

  // Gather packages & multi-session treatments from all sales
  const treatmentSessions: any[] = [];
  if (patient?.sales) {
    patient.sales.forEach((sale: any) => {
      (sale.items || []).forEach((item: any) => {
        const totalSessions = (item.sessions_allowed || 1) * (item.quantity || 1);
        // Include if item allows more than 1 session or item group name indicates package
        if (totalSessions > 1 || item.item_group_name || (item.product?.category?.name || "").toLowerCase().includes("treatment")) {
          treatmentSessions.push({
            ...item,
            totalSessions,
            saleDate: sale.date,
            invoiceNumber: sale.invoice_number,
            doctorName: sale.doctor?.name || "Clinic Staff",
            saleId: sale.id,
          });
        }
      });
    });
  }

  // Calculate stats
  const totalSalesCount = patient?.sales?.length || 0;
  const lifetimeSpent = (patient?.sales || []).reduce((acc: number, s: any) => acc + (s.grand_total || 0), 0);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-slate-50/60 p-8 items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-gray-600">Loading patient profile & clinical history...</p>
      </div>
    );
  }

  if (errorMessage || !patient) {
    return (
      <div className="flex flex-col h-full bg-slate-50/60 p-8 items-center justify-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Patient Record Not Found</h2>
        <p className="text-sm text-gray-500 max-w-md text-center">
          The requested patient could not be located in the system.
        </p>
        <Link
          href="/dashboard/patients"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Patients Directory
        </Link>
      </div>
    );
  }

  const patientInitial = patient.name ? patient.name.trim().charAt(0).toUpperCase() : "P";
  const dueBalance = Number(patient.current_balance) || 0;
  const walletBalance = Number(patient.advance_balance) || 0;

  return (
    <div className="flex flex-col h-full bg-slate-50/60">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 min-h-16 py-3 px-6 sm:px-8 shrink-0 shadow-xs z-10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/patients"
            className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
            title="Back to Patients List"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-base uppercase shadow-sm">
              {patientInitial}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                  {patient.name}
                </h1>
                <span className="font-mono text-xs font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-0.5 rounded-full">
                  MRID: {patient.medical_id}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Patient since {dayjs(patient.created_at || (patient.sales?.[0]?.date) || new Date()).format("MMM YYYY")} • {totalSalesCount} Visits
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsWalletModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-xs active:scale-95"
          >
            <Wallet className="w-4 h-4" />
            <span>Deposit Advance</span>
          </button>

          <Link
            href={`/dashboard/pos?patientId=${patient.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>New Visit</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="p-4 sm:p-8 flex-1 overflow-auto w-full min-w-0 space-y-6">

        {/* Financial & Clinical Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Due Balance Card */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Balance</p>
              <h3 className={`text-2xl font-bold mt-1 ${dueBalance > 0 ? "text-rose-600" : "text-gray-900"}`}>
                Rs. {dueBalance.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              {dueBalance > 0 ? (
                <span className="text-[11px] font-medium text-rose-600 flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3" /> Payment Outstanding
                </span>
              ) : (
                <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Fully Settled
                </span>
              )}
            </div>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
              dueBalance > 0 ? "bg-rose-50 border border-rose-100 text-rose-600" : "bg-gray-50 border border-gray-100 text-gray-400"
            }`}>
              <CreditCard className="w-5 h-5" />
            </div>
          </div>

          {/* Advance Wallet Card */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Advance Wallet</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                Rs. {walletBalance.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <button
                onClick={() => setIsWalletModalOpen(true)}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 mt-0.5"
              >
                + Top Up Wallet
              </button>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          {/* Lifetime Spend */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lifetime Invoiced</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                Rs. {lifetimeSpent.toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Across {totalSalesCount} total invoices</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>

          {/* Active Sessions */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Packages</p>
              <h3 className="text-2xl font-bold text-indigo-600 mt-1">
                {treatmentSessions.filter(s => (s.sessions_consumed || 0) < s.totalSessions).length}
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Packages with pending sessions</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT COLUMN: Patient Info & Contact Details */}
          <div className="col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-slate-50/60">
                <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600" />
                  Patient Profile
                </h2>
                {!isEditing && userRole !== "Doctor" && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                )}
              </div>

              <div className="p-5">
                {isEditing ? (
                  <form onSubmit={handleSubmit(onUpdateProfile)} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...register("name")}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
                      />
                      {errors.name && <p className="mt-1 text-xs text-red-500 font-medium">{errors.name.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                        Phone Number
                      </label>
                      <input
                        {...register("phone")}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        {...register("email")}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
                      />
                      {errors.email && <p className="mt-1 text-xs text-red-500 font-medium">{errors.email.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                        Address
                      </label>
                      <textarea
                        {...register("address")}
                        rows={2}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
                      ></textarea>
                    </div>

                    <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs disabled:opacity-70"
                      >
                        {isSubmitting ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Phone</p>
                        {patient.phone ? (
                          <a
                            href={`tel:${patient.phone}`}
                            className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors"
                          >
                            {patient.phone}
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400 italic">Not Provided</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Email</p>
                        {patient.email ? (
                          <a
                            href={`mailto:${patient.email}`}
                            className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors truncate block"
                          >
                            {patient.email}
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400 italic">Not Provided</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Address</p>
                        <p className="text-sm font-medium text-gray-900 whitespace-pre-line leading-relaxed">
                          {patient.address || <span className="text-gray-400 italic">Not Provided</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Financial Summary Card */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-slate-50/60">
                <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  Financial Summary
                </h2>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex justify-between items-center p-3.5 rounded-xl bg-rose-50/50 border border-rose-100">
                  <div>
                    <span className="text-xs font-semibold text-rose-800 block">Due Balance</span>
                    <span className="text-xs text-rose-600 font-mono">Unpaid invoices</span>
                  </div>
                  <span className="text-lg font-bold text-rose-600">
                    Rs. {dueBalance.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <div>
                    <span className="text-xs font-semibold text-emerald-800 block">Advance Balance</span>
                    <span className="text-xs text-emerald-600 font-mono">Patient wallet credit</span>
                  </div>
                  <span className="text-lg font-bold text-emerald-700">
                    Rs. {walletBalance.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Active Packages & Treatment Sessions + Visit History */}
          <div className="col-span-1 lg:col-span-2 space-y-6">

            {/* Active Treatment Packages / Sessions Card */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/60">
                <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Active Treatment Packages & Multi-Sessions
                </h2>
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                  {treatmentSessions.length} Registered
                </span>
              </div>

              {treatmentSessions.length === 0 ? (
                <div className="p-10 text-center text-gray-500 flex flex-col items-center justify-center">
                  <Package className="w-10 h-10 text-gray-300 mb-2" />
                  <p className="font-semibold text-gray-700 text-sm">No multi-session treatments or packages</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm">
                    When this patient purchases multi-session packages (e.g. PRP, HydraFacial, Laser) in POS, session tracking will show here automatically.
                  </p>
                </div>
              ) : (
                <div className="p-5 space-y-4">
                  {treatmentSessions.map((sessionItem, idx) => {
                    const consumed = sessionItem.sessions_consumed || 0;
                    const total = sessionItem.totalSessions;
                    const remaining = Math.max(0, total - consumed);
                    const percentage = Math.min(100, Math.round((consumed / total) * 100));
                    const isCompleted = consumed >= total;

                    return (
                      <div
                        key={sessionItem.id || idx}
                        className="p-4 rounded-2xl border border-gray-200 bg-white hover:border-indigo-200 transition-all shadow-xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-gray-900 text-sm">
                                {sessionItem.product?.name || sessionItem.item_group_name || "Treatment Procedure"}
                              </h3>
                              {sessionItem.item_group_name && (
                                <span className="text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
                                  Package
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Inv: <span className="font-mono text-indigo-600 font-semibold">{sessionItem.invoiceNumber}</span> • {dayjs(sessionItem.saleDate).format("DD MMM YYYY")} • Dr: {sessionItem.doctorName}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {isCompleted ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                All Sessions Completed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                <Clock className="w-3.5 h-3.5" />
                                In Progress ({remaining} Left)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar & Indicators */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-gray-600">
                              <span className="font-bold text-indigo-600">{consumed}</span> of {total} Sessions Used
                            </span>
                            <span className={remaining > 0 ? "font-bold text-indigo-700" : "text-gray-400"}>
                              {remaining} Remaining
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 rounded-full ${
                                isCompleted ? "bg-emerald-500" : "bg-gradient-to-r from-indigo-500 to-indigo-600"
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Visit & Invoices History Table */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/60">
                <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  Visit & Invoices History
                </h2>
                <span className="text-xs font-semibold text-gray-500">
                  {totalSalesCount} Invoices
                </span>
              </div>

              {!patient.sales || patient.sales.length === 0 ? (
                <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center">
                  <Calendar className="w-10 h-10 text-gray-300 mb-2" />
                  <p className="font-semibold text-gray-700 text-sm">No visit history recorded yet</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm">
                    When this patient checks out in the POS, invoices and thermal receipt records will appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse min-w-[650px]">
                    <thead className="bg-slate-50/80 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-5 font-semibold">Date</th>
                        <th className="py-3 px-5 font-semibold">Invoice #</th>
                        <th className="py-3 px-5 font-semibold">Doctor</th>
                        <th className="py-3 px-5 font-semibold text-right">Grand Total</th>
                        <th className="py-3 px-5 font-semibold text-right">Paid</th>
                        <th className="py-3 px-5 font-semibold">Status</th>
                        <th className="py-3 px-5 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                      {patient.sales.map((sale: any) => {
                        const remainingDue = Math.max(0, sale.grand_total - (sale.paid_amount || 0));
                        return (
                          <tr key={sale.id} className="hover:bg-indigo-50/40 transition-colors">
                            <td className="py-3.5 px-5 whitespace-nowrap text-xs text-gray-600">
                              {dayjs(sale.date).format("DD MMM YYYY, hh:mm A")}
                            </td>
                            <td className="py-3.5 px-5">
                              <button
                                onClick={() => setSelectedInvoice(sale)}
                                className="font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-lg hover:bg-indigo-100 transition-colors"
                              >
                                {sale.invoice_number}
                              </button>
                            </td>
                            <td className="py-3.5 px-5 text-xs text-gray-600 font-medium">
                              {sale.doctor?.name ? `Dr. ${sale.doctor.name}` : <span className="text-gray-400 italic">General</span>}
                            </td>
                            <td className="py-3.5 px-5 text-right font-bold text-gray-900 text-xs">
                              Rs. {sale.grand_total.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-3.5 px-5 text-right font-semibold text-emerald-700 text-xs">
                              Rs. {(sale.paid_amount || 0).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-3.5 px-5">
                              <StatusBadge status={sale.payment_status} />
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Print Thermal Receipt */}
                                <button
                                  onClick={() => handlePrintReceipt(sale)}
                                  title="Print 80mm Thermal Invoice"
                                  className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors border border-gray-200"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>

                                {/* View Invoice Details */}
                                <button
                                  onClick={() => setSelectedInvoice(sale)}
                                  className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-xs"
                                >
                                  Details
                                </button>

                                {/* Collect Dues Button */}
                                {sale.payment_status !== "PAID" && remainingDue > 0 && userRole !== "Doctor" && (
                                  <button
                                    onClick={() => {
                                      setSelectedSale(sale);
                                      setPaymentAmount(remainingDue.toFixed(2));
                                      setPaymentMethod("Cash");
                                      setIsPaymentModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 text-xs font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-all shadow-xs"
                                  >
                                    Collect
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* INVOICE DETAILS MODAL */}
      {selectedInvoice && (
        <InvoiceModal
          selectedSale={selectedInvoice}
          userRole={userRole}
          onClose={() => setSelectedInvoice(null)}
          onOpenPayment={(amount) => {
            setSelectedSale(selectedInvoice);
            setPaymentAmount(amount);
            setPaymentMethod("Cash");
            setSelectedInvoice(null);
            setIsPaymentModalOpen(true);
          }}
          onRefundComplete={() => {
            setSelectedInvoice(null);
            fetchPatient();
          }}
        />
      )}

      {/* COLLECT PAYMENT MODAL */}
      {isPaymentModalOpen && selectedSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[60] flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 max-h-[92vh] flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 bg-slate-50/60 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Collect Due Payment</h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">Invoice: {selectedSale.invoice_number}</p>
              </div>
              <button
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  setPaymentError("");
                  setSelectedSale(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Amount to Collect (Rs.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  max={(selectedSale.grand_total - (selectedSale.paid_amount || 0)).toFixed(2)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
                <div className="flex justify-between items-center text-xs mt-1 text-gray-500 font-medium">
                  <span>Total Remaining:</span>
                  <span className="font-bold text-rose-600">
                    Rs. {(selectedSale.grand_total - (selectedSale.paid_amount || 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Payment Method
                </label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs bg-white text-slate-900 font-medium"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer / Online</option>
                </select>
              </div>

              {paymentError && (
                <div className="text-rose-600 text-xs bg-rose-50 p-3 rounded-xl border border-rose-200 font-medium">
                  {paymentError}
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsPaymentModalOpen(false);
                    setPaymentError("");
                    setSelectedSale(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={processPayment}
                  disabled={paymentProcessing || !paymentAmount}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-xs font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all"
                >
                  {paymentProcessing ? "Processing..." : "Confirm Collection"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WALLET ADVANCE TOP-UP MODAL */}
      {isWalletModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[60] flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 max-h-[92vh] flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 bg-emerald-50/60 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-1.5">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                  Deposit Patient Advance
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Funds added to patient&apos;s digital clinic wallet</p>
              </div>
              <button
                onClick={() => {
                  setIsWalletModalOpen(false);
                  setWalletError("");
                }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Deposit Amount (Rs.) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="100"
                  placeholder="e.g. 5000"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-base font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
                  value={walletAmount}
                  onChange={(e) => setWalletAmount(e.target.value)}
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex gap-2">
                {[1000, 2500, 5000, 10000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setWalletAmount(amt.toString())}
                    className="flex-1 py-1.5 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
                  >
                    +{amt.toLocaleString()}
                  </button>
                ))}
              </div>

              {walletError && (
                <div className="text-rose-600 text-xs bg-rose-50 p-3 rounded-xl border border-rose-200 font-medium">
                  {walletError}
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsWalletModalOpen(false);
                    setWalletError("");
                  }}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={processWalletDeposit}
                  disabled={walletProcessing || !walletAmount}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-xs font-semibold shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
                >
                  {walletProcessing ? "Depositing..." : "Deposit Funds"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
