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
import { Pencil, Trash2, Plus, X } from "lucide-react";

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
      const url = editingEmployee ? `/api/employees/ {editingEmployee.id}` : "/api/employees";
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
      const res = await fetch(`/api/employees/ {id}`, { method: "DELETE" });
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
    <div className="max-w-6xl mx-auto w-full min-w-0 p-4 sm:p-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Directory</h1>
          <p className="text-sm text-gray-500 mt-1">Manage doctors and employees</p>
        </div>
        <button
          onClick={openNewModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Employee
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full min-w-0">
        <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-gray-200 min-w-[600px]">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                    No staff found. Click "Add Employee" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Modal */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] mx-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">{editingEmployee ? "Edit Employee" : "Add Employee"}</h2>
              <button onClick={() => setIsEmployeeModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="emp-form" onSubmit={employeeForm.handleSubmit(onSubmitEmployee)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input
                    {...employeeForm.register("name")}
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g. Dr. Sarah Khan"
                  />
                  {employeeForm.formState.errors.name && <p className="mt-1 text-xs text-red-500">{employeeForm.formState.errors.name.message as string}</p>}
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      {...employeeForm.register("is_doctor")}
                      type="checkbox"
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Is a Doctor? (Can be assigned to appointments/sales)</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <div className="flex gap-2 mb-2">
                    <select
                      {...employeeForm.register("department_id")}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
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
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
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
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 mt-auto">
              <button
                type="button"
                onClick={() => setIsEmployeeModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="emp-form"
                disabled={employeeForm.formState.isSubmitting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
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
