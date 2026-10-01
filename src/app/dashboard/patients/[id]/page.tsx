
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit2, Calendar, Package } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import dayjs from "dayjs";
import { useSession } from "next-auth/react";

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
  const { id } = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Payment Modal State
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
  });

  const fetchPatient = async () => {
    try {
      const res = await fetch(`/api/patients/${id}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setPatient(data);
      reset(data);
    } catch (e) {
      console.error(e);
      router.push("/dashboard/patients");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatient();
  }, [id]);

  const onSubmit = async (values: PatientFormValues) => {
    try {
      const res = await fetch(`/api/patients/${id}`, {
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

  const processPayment = async () => {
    if (!selectedSale) return;
    setPaymentError("");
    setPaymentProcessing(true);

    try {
      const res = await fetch(`/api/sales/${selectedSale.id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(paymentAmount), payment_method: paymentMethod })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process payment");

      setIsPaymentModalOpen(false);
      setSelectedSale(null);
      fetchPatient(); // Refresh patient data to get updated balances and sales
    } catch (e: any) {
      setPaymentError(e.message);
    } finally {
      setPaymentProcessing(false);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === "PAID") return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-semibold">PAID</span>;
    if (status === "DUE") return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-semibold">DUE</span>;
    if (status === "PARTIAL") return <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-semibold">PARTIAL</span>;
    return <span>{status}</span>;
  };

  if (isLoading) return <div className="p-8 text-gray-500 animate-pulse">Loading patient profile...</div>;
  if (!patient) return null;

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      <header className="bg-white border-b h-16 flex items-center justify-between px-8 shrink-0 shadow-sm z-10">
        <div className="flex items-center">
          <Link href="/dashboard/patients" className="mr-4 text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center tracking-tight">
              {patient.name}
              <span className="ml-3 font-mono text-sm bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md font-medium border border-indigo-100">
                {patient.medical_id}
              </span>
            </h1>
          </div>
        </div>
      </header>

      <div className="p-8 flex-1 overflow-auto w-full">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Patient Details Card */}
          <div className="col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h2 className="font-semibold text-gray-800">Patient Information</h2>
                {!isEditing && userRole !== "Doctor" && (
                  <button onClick={() => setIsEditing(true)} className="text-indigo-600 hover:text-indigo-800 flex items-center text-sm font-medium transition-colors">
                    <Edit2 className="w-4 h-4 mr-1.5" /> Edit
                  </button>
                )}
              </div>
              <div className="p-6">
                {isEditing ? (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Name</label>
                      <input {...register("name")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone</label>
                      <input {...register("phone")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
                      <input type="email" {...register("email")} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Address</label>
                      <textarea {...register("address")} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"></textarea>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100 mt-2">
                      <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                      <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-70">Save</button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Phone</p>
                      <p className="text-sm font-medium text-gray-900">{patient.phone || <span className="text-gray-400 italic">N/A</span>}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Email</p>
                      <p className="text-sm font-medium text-gray-900">{patient.email || <span className="text-gray-400 italic">N/A</span>}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Address</p>
                      <p className="text-sm font-medium text-gray-900 whitespace-pre-line leading-relaxed">{patient.address || <span className="text-gray-400 italic">N/A</span>}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Balances Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h2 className="font-semibold text-gray-800">Financial Summary</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center p-4 rounded-xl bg-red-50/50 border border-red-100">
                  <span className="text-sm font-medium text-red-800">Due Balance</span>
                  <span className="text-xl font-bold text-red-600"> {patient.current_balance?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <span className="text-sm font-medium text-emerald-800">Advance Wallet</span>
                  <span className="text-xl font-bold text-emerald-600"> {patient.advance_balance?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Placeholder for Sales) */}
          <div className="col-span-1 lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h2 className="font-semibold text-gray-800 flex items-center">
                  <Package className="w-4 h-4 mr-2 text-indigo-600" />
                  Active Packages / Sessions
                </h2>
              </div>
              <div className="p-16 text-center text-gray-500 flex flex-col items-center justify-center bg-gray-50/30">
                <Package className="w-12 h-12 text-gray-300 mb-4" />
                <p className="font-medium text-gray-600">No active packages found.</p>
                <p className="text-sm mt-1 text-gray-400 max-w-sm">Packages and multi-session treatments will appear here once the Sales module is integrated.</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h2 className="font-semibold text-gray-800 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-indigo-600" />
                  Visit History (Invoices)
                </h2>
              </div>

              {!patient.sales || patient.sales.length === 0 ? (
                <div className="p-16 text-center text-gray-500 flex flex-col items-center justify-center bg-gray-50/30">
                  <Calendar className="w-12 h-12 text-gray-300 mb-4" />
                  <p className="font-medium text-gray-600">No visit history yet.</p>
                  <p className="text-sm mt-1 text-gray-400 max-w-sm">Invoices, sales records, and session redemptions will be logged here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="p-4 font-semibold text-sm text-gray-600">Date</th>
                        <th className="p-4 font-semibold text-sm text-gray-600">Invoice</th>
                        <th className="p-4 font-semibold text-sm text-gray-600 text-right">Total</th>
                        <th className="p-4 font-semibold text-sm text-gray-600">Status</th>
                        <th className="p-4 font-semibold text-sm text-gray-600">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {patient.sales.map((sale: any) => (
                        <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 text-sm text-gray-900 whitespace-nowrap">
                            {dayjs(sale.date).format("MMM DD, YYYY")}
                          </td>
                          <td className="p-4">
                            <span className="font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded text-sm">{sale.invoice_number}</span>
                          </td>
                          <td className="p-4 text-right font-medium text-gray-900 text-sm">
                            {sale.grand_total.toFixed(2)}
                          </td>
                          <td className="p-4">
                            <StatusBadge status={sale.payment_status} />
                          </td>
                          <td className="p-4">
                            {sale.payment_status !== "PAID" && userRole !== "Doctor" && (
                              <button
                                onClick={() => {
                                  setSelectedSale(sale);
                                  setPaymentAmount(((sale.grand_total - (sale.paid_amount || 0)).toFixed(2)).toString());
                                  setPaymentMethod("Cash");
                                  setIsPaymentModalOpen(true);
                                }}
                                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                              >
                                Collect
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* PAYMENT MODAL */}
      {isPaymentModalOpen && selectedSale && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-gray-900 text-lg mb-4">Process Payment</h3>
            <p className="text-sm text-gray-500 mb-4">Invoice: {selectedSale.invoice_number}</p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount to collect</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"> </span>
                <input
                  type="number"
                  step="0.01"
                  max={(selectedSale.grand_total - (selectedSale.paid_amount || 0)).toFixed(2)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Remaining Due:  {(selectedSale.grand_total - (selectedSale.paid_amount || 0)).toFixed(2)}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>

            {paymentError && <div className="text-red-600 text-sm mb-4 bg-red-50 p-2 rounded">{paymentError}</div>}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  setPaymentError("");
                  setSelectedSale(null);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={processPayment}
                disabled={paymentProcessing || !paymentAmount}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm disabled:opacity-50"
              >
                {paymentProcessing ? "Processing..." : "Collect"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
