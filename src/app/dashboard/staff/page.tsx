"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import { Pencil, Trash2, Plus, X, Users } from "lucide-react";

// Schemas
const employeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  is_doctor: z.boolean(),
  department_id: z.string().optional(),
});

type EmployeeForm = z.infer<typeof employeeSchema>;

export default function StaffPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);

  // Modals
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);

  // Forms
  const employeeForm = useForm<EmployeeForm>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { name: "", is_doctor: false, department_id: "" }
  });

  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [isCreatingDepartment, setIsCreatingDepartment] = useState(false);

  useEffect(() => {
    fetchData();
    const handleManualRefresh = () => fetchData();
    window.addEventListener("refresh-active-page-data", handleManualRefresh);
    return () => window.removeEventListener("refresh-active-page-data", handleManualRefresh);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const empRes = await fetch("/api/employees");
      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(Array.isArray(empData) ? empData : []);
      }

      const deptRes = await fetch("/api/departments");
      if (deptRes.ok) {
        const deptData = await deptRes.json();
        setDepartments(Array.isArray(deptData) ? deptData : []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const createDepartment = async () => {
    if (!newDepartmentName.trim()) return;
    setIsCreatingDepartment(true);
    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newDepartmentName.trim() })
      });
      if (res.ok) {
        const dept = await res.json();
        setDepartments([...departments, dept]);
        employeeForm.setValue("department_id", dept.id);
        setNewDepartmentName("");
      }
    } catch (e) {
      console.error(e);
    }
    setIsCreatingDepartment(false);
  };

  const onSubmitEmployee = async (data: EmployeeForm) => {
    try {
      const url = editingEmployee ? `/api/employees/${editingEmployee.id}` : "/api/employees";
      const method = editingEmployee ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        setIsEmployeeModalOpen(false);
        setEditingEmployee(null);
        employeeForm.reset();
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;
    try {
      const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const openEditModal = (emp: any) => {
    setEditingEmployee(emp);
    employeeForm.reset({
      name: emp.name,
      is_doctor: emp.is_doctor,
      department_id: emp.department_id || "",
    });
    setIsEmployeeModalOpen(true);
  };

  const openNewModal = () => {
    setEditingEmployee(null);
    employeeForm.reset({ name: "", is_doctor: false, department_id: "" });
    setIsEmployeeModalOpen(true);
  };

  const columnHelper = createColumnHelper<any>();
  const columns = useMemo(() => [
    columnHelper.accessor("name", {
      header: "Name",
      cell: info => <div className="font-medium text-gray-900">{info.getValue()}</div>,
    }),
    columnHelper.accessor("is_doctor", {
      header: "Role",
      cell: info => info.getValue() ? (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Doctor
        </span>
      ) : (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Staff
        </span>
      ),
    }),
    columnHelper.accessor(row => row.department?.name, {
      id: "department",
      header: "Department",
      cell: info => info.getValue() || <span className="text-gray-400 italic">None</span>,
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: (info) => (
        <div className="flex gap-2">
          <button type="button" onClick={() => openEditModal(info.row.original)} className="text-indigo-600 hover:text-indigo-900 p-1">
            <Pencil className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => handleDelete(info.row.original.id)} className="text-red-600 hover:text-red-900 p-1">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    }),
  ], []);

  const table = useReactTable({
    data: employees,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto w-full min-w-0 space-y-5 sm:space-y-6">
      {/* Page Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Staff &amp; Doctors Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Manage clinic doctors, treatment therapists, and department assignments.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-indigo-700 transition-all flex items-center justify-center shadow-md shadow-indigo-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add Employee
        </button>
      </div>

      {/* MOBILE STAFF CARDS (< md screens) */}
      <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">
        {employees.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-2xl border border-gray-200 text-center text-gray-500 space-y-2">
            <Users className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="font-medium text-sm">No staff members found.</p>
          </div>
        ) : (
          employees.map((emp) => {
            const initial = emp.name ? emp.name.trim().charAt(0).toUpperCase() : "E";
            return (
              <div
                key={emp.id}
                className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-sm uppercase shrink-0 shadow-xs">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-sm truncate">{emp.name}</div>
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        {emp.is_doctor ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            Doctor
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            Staff
                          </span>
                        )}
                        {emp.department?.name && (
                          <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/80">
                            {emp.department.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => openEditModal(emp)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                  >
                    <Pencil className="w-3.5 h-3.5 text-slate-500" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(emp.id)}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP TABLE VIEW (>= md screens) */}
      <div className="hidden md:block bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden w-full min-w-0">
        <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-gray-200 min-w-[600px]">
            <thead className="bg-slate-50/80">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-indigo-50/40 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-16 text-center text-gray-500 font-medium">
                    No staff found. Click &quot;Add Employee&quot; to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Modal */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[92vh] mx-auto border border-gray-100 my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 sm:px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/80 shrink-0">
              <h2 className="text-base font-bold text-gray-900">{editingEmployee ? "Edit Employee" : "Add Employee"}</h2>
              <button onClick={() => setIsEmployeeModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 sm:p-6 overflow-y-auto flex-1">
              <form id="emp-form" onSubmit={employeeForm.handleSubmit(onSubmitEmployee)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Full Name <span className="text-red-500">*</span></label>
                  <input
                    {...employeeForm.register("name")}
                    type="text"
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
                    placeholder="e.g. Dr. Sarah Khan"
                  />
                  {employeeForm.formState.errors.name && <p className="mt-1 text-xs text-red-500 font-medium">{employeeForm.formState.errors.name.message as string}</p>}
                </div>

                <div>
                  <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-50 border border-gray-200 cursor-pointer">
                    <input
                      {...employeeForm.register("is_doctor")}
                      type="checkbox"
                      className="rounded-md border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span className="text-xs sm:text-sm font-semibold text-gray-800">Is a Doctor? (Can be assigned to appointments & sales)</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Department</label>
                  <div className="flex gap-2 mb-2">
                    <select
                      {...employeeForm.register("department_id")}
                      className="flex-1 border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white shadow-xs"
                    >
                      <option value="">No Department</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>

                  {/* Inline Create Department */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newDepartmentName}
                      onChange={(e) => setNewDepartmentName(e.target.value)}
                      placeholder="New Department"
                      className="flex-1 border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          createDepartment();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={createDepartment}
                      disabled={isCreatingDepartment || !newDepartmentName.trim()}
                      className="px-3.5 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs sm:text-sm font-semibold hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </form>
            </div>
            <div className="px-5 sm:px-6 py-4 border-t border-gray-100 flex justify-end gap-2 sm:gap-3 bg-slate-50/80 shrink-0">
              <button
                type="button"
                onClick={() => setIsEmployeeModalOpen(false)}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="emp-form"
                disabled={employeeForm.formState.isSubmitting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-xs active:scale-95"
              >
                {employeeForm.formState.isSubmitting ? "Saving..." : "Save Employee"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
