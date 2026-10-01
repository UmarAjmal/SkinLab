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
import { Search, Plus, X } from "lucide-react";
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
  current_balance: number;
  advance_balance: number;
};

const columnHelper = createColumnHelper<Patient>();

const columns = [
  columnHelper.accessor("medical_id", {
    header: "Medical ID",
    cell: info => <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-gray-600">{info.getValue()}</span>
  }),
  columnHelper.accessor("name", {
    header: "Name",
    cell: info => (
      <Link href={`/dashboard/patients/ {info.row.original.id}`} className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline">
        {info.getValue()}
      </Link>
    )
  }),
  columnHelper.accessor("phone", {
    header: "Phone",
    cell: info => info.getValue() || <span className="text-gray-400 text-xs italic">N/A</span>
  }),
  columnHelper.accessor("current_balance", {
    header: "Due Balance",
    cell: info => <span className={info.getValue() > 0 ? "text-red-600 font-semibold" : ""}> {info.getValue().toFixed(2)}</span>
  }),
  columnHelper.accessor("advance_balance", {
    header: "Wallet",
    cell: info => <span className="text-emerald-600 font-semibold"> {info.getValue().toFixed(2)}</span>
  }),
];

export default function PatientsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "";
  const [data, setData] = useState<Patient[]>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const fetchPatients = async () => {
    try {
      const res = await fetch("/api/patients");
      const json = await res.json();
      if (Array.isArray(json)) setData(json);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

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

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      <header className="bg-white border-b h-16 flex items-center justify-between px-8 shrink-0 shadow-sm z-10">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Patients Database</h1>
          <p className="text-sm text-gray-500">Manage patient records, wallets, and visit history</p>
        </div>
        {userRole !== "Doctor" && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 flex items-center text-sm font-medium transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Patient
          </button>
        )}
      </header>

      <div className="p-4 sm:p-8 flex-1 overflow-auto w-full min-w-0">
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              value={globalFilter ?? ""}
              onChange={e => setGlobalFilter(e.target.value)}
              placeholder="Search by name, phone, or ID..."
              className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm w-full min-w-0 overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id} className="py-4 px-6 font-semibold">
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
                  <tr key={row.id} className="hover:bg-indigo-50/30 transition-colors group">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="py-4 px-6">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
                {table.getRowModel().rows.length === 0 && (
                  <tr>
                    <td colSpan={columns.length} className="py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Search className="w-8 h-8 text-gray-300" />
                        <p>No patients found.</p>
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
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 mx-auto">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-800">Register New Patient</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                <input {...register("name")} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm" placeholder="e.g. Jane Doe" />
                {errors.name && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                  <input {...register("phone")} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm" placeholder="+1 (555) 000-0000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <input type="email" {...register("email")} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm" placeholder="jane@example.com" />
                  {errors.email && <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.email.message}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Home Address</label>
                <textarea {...register("address")} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm" placeholder="Street address, City, etc."></textarea>
              </div>

              <div className="pt-5 flex justify-end space-x-3 border-t border-gray-100 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm disabled:opacity-70 flex items-center transition-all">
                  {isSubmitting ? "Saving..." : "Save Patient Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
