"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
} from "@tanstack/react-table";
import {
  Search,
  Plus,
  X,
  Users,
  AlertCircle,
  Wallet,
  ArrowRight,
  Eye,
  RefreshCw,
  Phone,
  Mail,
  UserCheck
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const patientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
});
type PatientFormValues = z.infer<typeof patientSchema>;

type Patient = {
  id: string;
  medical_id: string;
  name: string;
  phone: string | null;
  email?: string | null;
  address?: string | null;
  current_balance: number;
  advance_balance: number;
};

const columnHelper = createColumnHelper<Patient>();

export default function PatientsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "";
  const [data, setData] = useState<Patient[]>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/patients");
      const json = await res.json();
      if (Array.isArray(json)) setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const columns = [
    columnHelper.accessor("medical_id", {
      header: "MRID",
      cell: info => (
        <Link
          href={`/dashboard/patients/${info.row.original.id}`}
          onClick={(e) => e.stopPropagation()}
          className="font-mono text-xs font-semibold bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-1 rounded-md hover:bg-indigo-100 hover:text-indigo-800 transition-colors inline-block"
        >
          {info.getValue()}
        </Link>
      )
    }),
    columnHelper.accessor("name", {
      header: "Patient Name",
      cell: info => {
        const patient = info.row.original;
        const initial = patient.name ? patient.name.trim().charAt(0).toUpperCase() : "P";
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-xs">
              {initial}
            </div>
            <div>
              <Link
                href={`/dashboard/patients/${patient.id}`}
                onClick={(e) => e.stopPropagation()}
                className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors block text-sm"
              >
                {patient.name}
              </Link>
              {patient.email && (
                <span className="text-xs text-gray-400 block">{patient.email}</span>
              )}
            </div>
          </div>
        );
      }
    }),
    columnHelper.accessor("phone", {
      header: "Phone",
      cell: info => info.getValue() ? (
        <span className="font-mono text-xs text-gray-700 font-medium">{info.getValue()}</span>
      ) : (
        <span className="text-gray-400 text-xs italic">N/A</span>
      )
    }),
    columnHelper.accessor("current_balance", {
      header: "Due Balance",
      cell: info => {
        const val = Number(info.getValue()) || 0;
        return (
          <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-md ${
            val > 0
              ? "bg-rose-50 text-rose-700 border border-rose-200"
              : "text-gray-500 bg-gray-50 border border-gray-100"
          }`}>
            Rs. {val.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        );
      }
    }),
    columnHelper.accessor("advance_balance", {
      header: "Wallet Balance",
      cell: info => {
        const val = Number(info.getValue()) || 0;
        return (
          <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-md ${
            val > 0
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "text-gray-500 bg-gray-50 border border-gray-100"
          }`}>
            Rs. {val.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        );
      }
    }),
    columnHelper.display({
      id: "actions",
      header: "Action",
      cell: info => (
        <div className="flex items-center justify-end">
          <Link
            href={`/dashboard/patients/${info.row.original.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-xs active:scale-95 group"
          >
            <span>View Profile</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      )
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
  });

  const onSubmit = async (values: PatientFormValues) => {
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        setIsModalOpen(false);
        reset();
        fetchPatients();
        router.refresh();
      }
    } catch (e) {
      console.error("Failed to add patient", e);
    }
  };

  // Quick stats
  const totalPatients = data.length;
  const totalDueCount = data.filter(p => Number(p.current_balance) > 0).length;
  const totalDueAmount = data.reduce((acc, p) => acc + (Number(p.current_balance) || 0), 0);
  const totalWalletAmount = data.reduce((acc, p) => acc + (Number(p.advance_balance) || 0), 0);

  return (
    <div className="flex flex-col h-full bg-slate-50/60">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sm:px-8 shrink-0 shadow-xs z-10">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Patients Database
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">Manage patient records, clinical wallets, and visit profiles</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchPatients}
            title="Refresh patient list"
            className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
          </button>
          {userRole !== "Doctor" && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 flex items-center text-sm font-semibold transition-all shadow-md shadow-indigo-600/20 active:scale-95"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Register Patient
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="p-4 sm:p-8 flex-1 overflow-auto w-full min-w-0 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Patients</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalPatients}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Patients With Dues</p>
              <h3 className="text-2xl font-bold text-rose-600 mt-1">{totalDueCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Outstanding Dues</p>
              <h3 className="text-xl font-bold text-rose-700 mt-1">
                Rs. {totalDueAmount.toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Advance Wallets</p>
              <h3 className="text-xl font-bold text-emerald-700 mt-1">
                Rs. {totalWalletAmount.toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              value={globalFilter ?? ""}
              onChange={e => setGlobalFilter(e.target.value)}
              placeholder="Search by name, phone, or MRID..."
              className="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all shadow-xs bg-white text-slate-900 font-medium"
            />
          </div>
          <div className="text-xs text-gray-500 font-medium">
            Showing <span className="font-semibold text-gray-900">{table.getRowModel().rows.length}</span> patient records
          </div>
        </div>

        {/* Patients Table */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xs w-full min-w-0 overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="bg-slate-50/80 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th
                        key={header.id}
                        className={`py-3.5 px-6 font-semibold ${
                          header.id === "actions" ? "text-right" : ""
                        }`}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                {table.getRowModel().rows.map(row => (
                  <tr
                    key={row.id}
                    onClick={() => router.push(`/dashboard/patients/${row.original.id}`)}
                    className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="py-3.5 px-6">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
                {table.getRowModel().rows.length === 0 && (
                  <tr>
                    <td colSpan={columns.length} className="py-16 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Users className="w-10 h-10 text-gray-300" />
                        <p className="font-medium text-gray-600">No patients found.</p>
                        <p className="text-xs text-gray-400">Try adjusting your search criteria or register a new patient.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto transition-opacity animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 mx-auto border border-gray-100 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 bg-slate-50/60 shrink-0">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Register New Patient
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors rounded-xl p-1.5 hover:bg-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("name")}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs text-slate-900 bg-white font-medium"
                  placeholder="e.g. Ayesha Khan"
                />
                {errors.name && <p className="mt-1 text-xs text-red-500 font-medium">{errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    {...register("phone")}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs text-slate-900 bg-white font-medium"
                    placeholder="0300-1234567"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    {...register("email")}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs text-slate-900 bg-white font-medium"
                    placeholder="patient@example.com"
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-500 font-medium">{errors.email.message}</p>}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Home / Residential Address
                </label>
                <textarea
                  {...register("address")}
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs text-slate-900 bg-white font-medium"
                  placeholder="House #, Street, Area, City"
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100 mt-6 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 shadow-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-600/20 disabled:opacity-70 flex items-center transition-all"
                >
                  {isSubmitting ? "Registering..." : "Save Patient"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
