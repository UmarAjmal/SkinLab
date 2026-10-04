"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Building2,
  Users,
  Save,
  Plus,
  Shield,
  ShieldOff,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Edit3,
  Trash2,
  Check,
  X,
  Search,
  AlertCircle,
  Eye,
  PenLine,
  Trash,
  Sparkles,
  UserCheck,
  UploadCloud,
  Image as ImageIcon,
  RefreshCw,
  Palette,
  RotateCcw,
  Sliders,
  Paintbrush,
  Clock,
} from "lucide-react";
import { SYSTEM_MODULES } from "@/lib/permissions";
import { useTheme } from "@/context/ThemeContext";

interface RolePermissionState {
  module: string;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
}

interface RoleItem {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  permissions: RolePermissionState[];
  _count?: {
    users: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface UserItem {
  id: string;
  email: string;
  is_active: boolean;
  role: string;
  role_id: string;
  employee: {
    id: string;
    name: string;
  } | null;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Core: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  Clinical: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
  Operations: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  Billing: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  Analytics: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  Administration: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "";
  const [activeTab, setActiveTab] = useState<"clinic" | "theme" | "users" | "roles">("clinic");

  // ─── Theme & Appearance State ─────────────────────────
  const {
    activeTheme,
    theme: savedTheme,
    presets,
    applyPreset,
    updateThemeColors,
    saveTheme,
    isSaving: themeSaving,
    resetPreview,
  } = useTheme();
  const [themeSaved, setThemeSaved] = useState(false);
  const [activePresetFilter, setActivePresetFilter] = useState<string>("All");

  // ─── Clinic Profile State ─────────────────────────────
  const [clinicSettings, setClinicSettings] = useState({
    name: "", phone: "", logo: "", address: "", tax_number: "", footer_note: ""
  });
  const [clinicLoading, setClinicLoading] = useState(true);
  const [clinicSaving, setClinicSaving] = useState(false);
  const [clinicSaved, setClinicSaved] = useState(false);
  const [isLogoDragging, setIsLogoDragging] = useState(false);

  const handleLogoFileUpload = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (PNG, JPG, JPEG, SVG, WebP)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64) {
        setClinicSettings((prev) => ({ ...prev, logo: base64 }));
      }
    };
    reader.readAsDataURL(file);
  };

  // ─── User Management State ────────────────────────────
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", role_id: "", employee_id: "" });
  const [addUserError, setAddUserError] = useState("");
  const [addUserSaving, setAddUserSaving] = useState(false);

  // Edit User State
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editUserData, setEditUserData] = useState({ role_id: "", employee_id: "", password: "" });
  const [editUserError, setEditUserError] = useState("");
  const [editUserSaving, setEditUserSaving] = useState(false);

  // Delete User State
  const [deleteUserModal, setDeleteUserModal] = useState<{ isOpen: boolean; user: UserItem | null; isDeleting: boolean; error: string }>({
    isOpen: false,
    user: null,
    isDeleting: false,
    error: ""
  });

  // ─── Role Management State ────────────────────────────
  const [rolesList, setRolesList] = useState<RoleItem[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [roleSearch, setRoleSearch] = useState("");

  // Create / Edit Role Modal State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleModalMode, setRoleModalMode] = useState<"create" | "edit">("create");
  const [currentRoleId, setCurrentRoleId] = useState<string | null>(null);
  const [isCurrentRoleSystem, setIsCurrentRoleSystem] = useState(false);
  const [roleForm, setRoleForm] = useState<{
    name: string;
    description: string;
    permissions: Record<string, { read: boolean; write: boolean; delete: boolean }>;
  }>({
    name: "",
    description: "",
    permissions: {},
  });
  const [roleFormError, setRoleFormError] = useState("");
  const [roleFormSaving, setRoleFormSaving] = useState(false);

  // Delete Role State
  const [deleteRoleModal, setDeleteRoleModal] = useState<{
    isOpen: boolean;
    role: RoleItem | null;
    isDeleting: boolean;
    error: string;
  }>({
    isOpen: false,
    role: null,
    isDeleting: false,
    error: "",
  });

  // ─── Fetch Clinic Settings ────────────────────────────
  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          setClinicSettings({
            name: data.name || "",
            phone: data.phone || "",
            logo: data.logo || "",
            address: data.address || "",
            tax_number: data.tax_number || "",
            footer_note: data.footer_note || ""
          });
        }
      })
      .catch(console.error)
      .finally(() => setClinicLoading(false));
  }, []);

  // ─── Fetch Users, Roles, Employees ────────────────────
  const fetchUsersAndRoles = () => {
    if (userRole === "Admin") {
      setUsersLoading(true);
      setRolesLoading(true);
      Promise.all([
        fetch("/api/users").then(r => r.json()),
        fetch("/api/roles").then(r => r.json()),
        fetch("/api/employees").then(r => r.json()),
      ]).then(([usersData, rolesData, employeesData]) => {
        setUsers(Array.isArray(usersData) ? usersData : []);
        setRoles(Array.isArray(rolesData) ? rolesData : []);
        setRolesList(Array.isArray(rolesData) ? rolesData : []);
        setEmployees(Array.isArray(employeesData) ? employeesData : []);
      }).catch(console.error)
        .finally(() => {
          setUsersLoading(false);
          setRolesLoading(false);
        });
    }
  };

  useEffect(() => {
    if (activeTab === "users" || activeTab === "roles") {
      fetchUsersAndRoles();
    }
  }, [activeTab, userRole]);

  // ─── Save Clinic Settings ─────────────────────────────
  const saveClinicSettings = async () => {
    setClinicSaving(true);
    setClinicSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clinicSettings)
      });
      if (res.ok) {
        setClinicSaved(true);
        setTimeout(() => setClinicSaved(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setClinicSaving(false);
    }
  };

  // ─── Add User ─────────────────────────────────────────
  const handleAddUser = async () => {
    setAddUserError("");
    if (!newUser.email || !newUser.password || !newUser.role_id) {
      setAddUserError("Email, password, and role are required.");
      return;
    }

    setAddUserSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser)
      });
      const data = await res.json();
      if (!res.ok) {
        setAddUserError(data.error || "Failed to create user");
        return;
      }
      setUsers([...users, data]);
      setIsAddUserOpen(false);
      setNewUser({ email: "", password: "", role_id: "", employee_id: "" });
      fetchUsersAndRoles();
    } catch (e) {
      setAddUserError("Network error occurred");
    } finally {
      setAddUserSaving(false);
    }
  };

  // ─── Edit User ────────────────────────────────────────
  const openEditUser = (u: UserItem) => {
    setEditingUser(u);
    setEditUserData({
      role_id: u.role_id,
      employee_id: u.employee?.id || "",
      password: "",
    });
    setEditUserError("");
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    setEditUserError("");
    setEditUserSaving(true);

    try {
      const payload: any = {
        role_id: editUserData.role_id,
        employee_id: editUserData.employee_id || null,
      };
      if (editUserData.password.trim().length > 0) {
        if (editUserData.password.trim().length < 6) {
          setEditUserError("Password must be at least 6 characters");
          setEditUserSaving(false);
          return;
        }
        payload.password = editUserData.password.trim();
      }

      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const updated = await res.json();
      if (!res.ok) {
        setEditUserError(updated.error || "Failed to update user");
        return;
      }

      setUsers(users.map(u => u.id === editingUser.id ? updated : u));
      setEditingUser(null);
      fetchUsersAndRoles();
    } catch (e) {
      setEditUserError("Network error occurred");
    } finally {
      setEditUserSaving(false);
    }
  };

  // ─── Toggle User Active ───────────────────────────────
  const toggleUserActive = async (userId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentActive })
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers(users.map(u => u.id === userId ? updated : u));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ─── Delete User ──────────────────────────────────────
  const handleDeleteUser = async () => {
    if (!deleteUserModal.user) return;
    setDeleteUserModal(prev => ({ ...prev, isDeleting: true, error: "" }));

    try {
      const res = await fetch(`/api/users/${deleteUserModal.user.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteUserModal(prev => ({ ...prev, isDeleting: false, error: data.error || "Failed to delete user" }));
        return;
      }
      setUsers(users.filter(u => u.id !== deleteUserModal.user?.id));
      setDeleteUserModal({ isOpen: false, user: null, isDeleting: false, error: "" });
      fetchUsersAndRoles();
    } catch (e) {
      setDeleteUserModal(prev => ({ ...prev, isDeleting: false, error: "Network error occurred" }));
    }
  };

  // ─── Role Management Helper Functions ─────────────────
  const openCreateRole = () => {
    const initialPerms: Record<string, { read: boolean; write: boolean; delete: boolean }> = {};
    SYSTEM_MODULES.forEach(m => {
      initialPerms[m.id] = { read: true, write: false, delete: false };
    });

    setRoleForm({
      name: "",
      description: "",
      permissions: initialPerms,
    });
    setRoleModalMode("create");
    setCurrentRoleId(null);
    setIsCurrentRoleSystem(false);
    setRoleFormError("");
    setIsRoleModalOpen(true);
  };

  const openEditRole = (role: RoleItem) => {
    const permsMap: Record<string, { read: boolean; write: boolean; delete: boolean }> = {};

    SYSTEM_MODULES.forEach(m => {
      const existing = role.permissions?.find(p => p.module === m.id);
      permsMap[m.id] = {
        read: Boolean(existing?.can_read),
        write: Boolean(existing?.can_write),
        delete: Boolean(existing?.can_delete),
      };
    });

    setRoleForm({
      name: role.name,
      description: role.description || "",
      permissions: permsMap,
    });
    setRoleModalMode("edit");
    setCurrentRoleId(role.id);
    setIsCurrentRoleSystem(role.is_system);
    setRoleFormError("");
    setIsRoleModalOpen(true);
  };

  const setAllPermissions = (value: boolean) => {
    const updated: Record<string, { read: boolean; write: boolean; delete: boolean }> = {};
    SYSTEM_MODULES.forEach(m => {
      updated[m.id] = { read: value, write: value, delete: value };
    });
    setRoleForm(prev => ({ ...prev, permissions: updated }));
  };

  const setPresetPermissions = (preset: "full" | "readonly" | "operations") => {
    const updated: Record<string, { read: boolean; write: boolean; delete: boolean }> = {};
    SYSTEM_MODULES.forEach(m => {
      if (preset === "full") {
        updated[m.id] = { read: true, write: true, delete: true };
      } else if (preset === "readonly") {
        updated[m.id] = { read: true, write: false, delete: false };
      } else if (preset === "operations") {
        const isCoreOrOp = ["dashboard", "patients", "services", "pos", "sales"].includes(m.id);
        updated[m.id] = {
          read: isCoreOrOp,
          write: isCoreOrOp,
          delete: false,
        };
      }
    });
    setRoleForm(prev => ({ ...prev, permissions: updated }));
  };

  const toggleModuleAction = (moduleId: string, action: "read" | "write" | "delete") => {
    setRoleForm(prev => {
      const current = prev.permissions[moduleId] || { read: false, write: false, delete: false };
      const nextVal = !current[action];

      const newPerm = { ...current, [action]: nextVal };
      if ((action === "write" || action === "delete") && nextVal) {
        newPerm.read = true;
      }
      if (action === "read" && !nextVal) {
        newPerm.write = false;
        newPerm.delete = false;
      }

      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [moduleId]: newPerm,
        }
      };
    });
  };

  const toggleEntireModule = (moduleId: string) => {
    setRoleForm(prev => {
      const current = prev.permissions[moduleId] || { read: false, write: false, delete: false };
      const allActive = current.read && current.write && current.delete;
      const nextVal = !allActive;

      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [moduleId]: { read: nextVal, write: nextVal, delete: nextVal }
        }
      };
    });
  };

  const handleSaveRole = async () => {
    setRoleFormError("");
    if (!roleForm.name.trim()) {
      setRoleFormError("Role name is required");
      return;
    }

    setRoleFormSaving(true);
    try {
      const permissionsArray = Object.entries(roleForm.permissions).map(([module, perms]) => ({
        module,
        can_read: perms.read,
        can_write: perms.write,
        can_delete: perms.delete,
      }));

      const payload = {
        name: roleForm.name.trim(),
        description: roleForm.description.trim(),
        permissions: permissionsArray,
      };

      let res;
      if (roleModalMode === "create") {
        res = await fetch("/api/roles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/roles/${currentRoleId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        setRoleFormError(data.error || "Failed to save role");
        return;
      }

      setIsRoleModalOpen(false);
      fetchUsersAndRoles();
    } catch (e) {
      setRoleFormError("Network error occurred");
    } finally {
      setRoleFormSaving(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!deleteRoleModal.role) return;
    setDeleteRoleModal(prev => ({ ...prev, isDeleting: true, error: "" }));

    try {
      const res = await fetch(`/api/roles/${deleteRoleModal.role.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteRoleModal(prev => ({ ...prev, isDeleting: false, error: data.error || "Failed to delete role" }));
        return;
      }

      setDeleteRoleModal({ isOpen: false, role: null, isDeleting: false, error: "" });
      fetchUsersAndRoles();
    } catch (e) {
      setDeleteRoleModal(prev => ({ ...prev, isDeleting: false, error: "Network error occurred" }));
    }
  };

  // Filtered lists
  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.employee?.name && u.employee.name.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const filteredRoles = rolesList.filter(r =>
    r.name.toLowerCase().includes(roleSearch.toLowerCase()) ||
    (r.description && r.description.toLowerCase().includes(roleSearch.toLowerCase()))
  );

  // Statistics for form
  const formPermissionsList = Object.values(roleForm.permissions);
  const totalRead = formPermissionsList.filter(p => p.read).length;
  const totalWrite = formPermissionsList.filter(p => p.write).length;
  const totalDelete = formPermissionsList.filter(p => p.delete).length;

  return (
    <div className="flex flex-col h-full bg-gray-50/50 -m-4 p-4 sm:-m-8 sm:p-8 overflow-y-auto w-full min-w-0">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            Settings & Access Control
          </h1>
          <p className="text-gray-500 mt-1">Configure clinic profile, custom system roles, and user permissions (RBAC).</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[550px] w-full min-w-0">
        {/* Tabs Navigation Header */}
        <div className="flex border-b border-gray-100 bg-gray-50/70 px-4 pt-4 overflow-x-auto whitespace-nowrap shrink-0 gap-2">
          <button
            style={activeTab === 'clinic' ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : {}}
            className={`px-5 py-3 font-semibold text-sm border-b-2 rounded-t-xl flex items-center transition-all cursor-pointer ${
              activeTab === 'clinic' 
                ? 'bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] font-bold' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/60'
            }`}
            onClick={() => setActiveTab('clinic')}
          >
            <Building2 className="w-4 h-4 mr-2" /> Clinic Profile
          </button>

          <button
            style={activeTab === 'theme' ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : {}}
            className={`px-5 py-3 font-semibold text-sm border-b-2 rounded-t-xl flex items-center transition-all cursor-pointer ${
              activeTab === 'theme' 
                ? 'bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] font-bold' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/60'
            }`}
            onClick={() => setActiveTab('theme')}
          >
            <Palette className="w-4 h-4 mr-2" /> Theme &amp; Styling
          </button>

          <button
            style={activeTab === 'users' ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : {}}
            className={`px-5 py-3 font-semibold text-sm border-b-2 rounded-t-xl flex items-center transition-all cursor-pointer ${
              activeTab === 'users' 
                ? 'bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] font-bold' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/60'
            }`}
            onClick={() => setActiveTab('users')}
          >
            <Users className="w-4 h-4 mr-2" /> User Management
          </button>

          <button
            style={activeTab === 'roles' ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : {}}
            className={`px-5 py-3 font-semibold text-sm border-b-2 rounded-t-xl flex items-center transition-all cursor-pointer ${
              activeTab === 'roles' 
                ? 'bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] font-bold' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/60'
            }`}
            onClick={() => setActiveTab('roles')}
          >
            <ShieldCheck className="w-4 h-4 mr-2" /> Role Management (RBAC)
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="p-6 flex-1 overflow-auto">

          {/* ═══════════════════════════════════════════════════ */}
          {/* TAB 1: Clinic Profile                              */}
          {/* ═══════════════════════════════════════════════════ */}
          {activeTab === 'clinic' && (
            <div className="max-w-2xl mx-auto py-2">
              {clinicLoading ? (
                <div className="text-center py-20 text-gray-400 font-medium">Loading clinic settings...</div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Clinic Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        value={clinicSettings.name}
                        onChange={e => setClinicSettings({ ...clinicSettings, name: e.target.value })}
                        placeholder="e.g. Skin-Lab Aesthetics Clinic"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                        placeholder="+92 300 1234567"
                        value={clinicSettings.phone}
                        onChange={e => setClinicSettings({ ...clinicSettings, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Clinic Address</label>
                    <textarea
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      rows={2}
                      placeholder="Street address, Plaza, City"
                      value={clinicSettings.address}
                      onChange={e => setClinicSettings({ ...clinicSettings, address: e.target.value })}
                    />
                  </div>

                  {/* Clinic Logo & Branding */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-gray-200/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-bold text-gray-800">
                          Clinic Brand Logo
                        </label>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Upload high-resolution 4K logo (PNG, JPG, SVG, WebP). Used across POS receipts, invoices, tabs, and reports.
                        </p>
                      </div>
                      {clinicSettings.logo && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 4K Ultra HD Ready
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-5">
                      {/* Logo Preview Box */}
                      <div className="relative w-32 h-32 rounded-2xl bg-white border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden shrink-0 shadow-inner group">
                        {clinicSettings.logo ? (
                          <>
                            <img
                              src={clinicSettings.logo}
                              alt="Clinic Logo Preview"
                              className="max-w-full max-h-full object-contain p-2"
                            />
                            <button
                              type="button"
                              onClick={() => setClinicSettings({ ...clinicSettings, logo: "" })}
                              className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold gap-1"
                              title="Remove Logo"
                            >
                              <Trash2 className="w-4 h-4 text-rose-400" />
                              <span>Remove</span>
                            </button>
                          </>
                        ) : (
                          <div className="text-center p-3 text-gray-400">
                            <ImageIcon className="w-8 h-8 mx-auto text-gray-300 mb-1" />
                            <span className="text-[10px] font-semibold block leading-tight">No Logo Selected</span>
                          </div>
                        )}
                      </div>

                      {/* Dropzone & Picker */}
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsLogoDragging(true);
                        }}
                        onDragLeave={() => setIsLogoDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsLogoDragging(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            handleLogoFileUpload(e.dataTransfer.files[0]);
                          }
                        }}
                        className={`flex-1 w-full border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                          isLogoDragging
                            ? "border-indigo-600 bg-indigo-50/80 scale-[1.01]"
                            : "border-gray-200 bg-white hover:border-indigo-400 hover:bg-slate-50/60"
                        }`}
                        onClick={() => document.getElementById("logo-file-input")?.click()}
                      >
                        <input
                          id="logo-file-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleLogoFileUpload(e.target.files[0]);
                            }
                          }}
                        />
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 shadow-xs">
                          <UploadCloud className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-gray-800">
                          Click to browse or Drag & Drop logo here
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          PNG, JPG, SVG, WebP up to 4K resolution (stored directly in database)
                        </p>
                      </div>
                    </div>

                    {/* Direct URL Fallback Option */}
                    <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                      <span className="text-xs text-gray-400 shrink-0 font-medium">Or paste image URL:</span>
                      <input
                        type="text"
                        className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
                        placeholder="https://..."
                        value={clinicSettings.logo}
                        onChange={(e) => setClinicSettings({ ...clinicSettings, logo: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tax / NTN Registration Number</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      placeholder="NTN-1234567-8"
                      value={clinicSettings.tax_number}
                      onChange={e => setClinicSettings({ ...clinicSettings, tax_number: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Thermal Receipt Footer Note</label>
                    <textarea
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      rows={3}
                      placeholder="Follow us on Instagram @skinlab | No refund after 7 days"
                      value={clinicSettings.footer_note}
                      onChange={e => setClinicSettings({ ...clinicSettings, footer_note: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={saveClinicSettings}
                      disabled={clinicSaving}
                      className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {clinicSaving ? "Saving..." : "Save Changes"}
                    </button>
                    {clinicSaved && (
                      <span className="flex items-center text-emerald-600 font-semibold text-sm animate-fade-in">
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Settings saved successfully!
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════ */}
          {/* TAB 2: Theme & Styling (Dynamic Visual Colors)      */}
          {/* ═══════════════════════════════════════════════════ */}
          {activeTab === 'theme' && (
            <div className="max-w-6xl mx-auto py-2 space-y-8">
              
              {/* Header Banner */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-indigo-200 border border-white/10 mb-2.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Dynamic System Theme Engine</span>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-white">
                    Theme &amp; Color Customization
                  </h2>
                  <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Personalize your clinic&apos;s UI styling across all buttons, sidebar, top header, and public home page. Page base backgrounds remain clean light / white.
                  </p>
                </div>

                {/* Save Theme Quick Trigger */}
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={async () => {
                      const success = await saveTheme();
                      if (success) {
                        setThemeSaved(true);
                        setTimeout(() => setThemeSaved(false), 3500);
                      }
                    }}
                    disabled={themeSaving}
                    style={{ 
                      backgroundColor: "var(--color-primary, #4f46e5)",
                      color: "var(--color-primary-text, #ffffff)"
                    }}
                    className="flex items-center px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {themeSaving ? "Saving Theme..." : "Save & Apply Theme"}
                  </button>
                </div>
              </div>

              {themeSaved && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-2.5 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Theme applied and saved successfully! All buttons, sidebar, top header, and home page are updated globally.</span>
                </div>
              )}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* SECTION 1: Pre-Built Curated Presets                         */}
              {/* ───────────────────────────────────────────────────────────── */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Palette className="w-5 h-5 text-indigo-600" /> Curated Theme Presets
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Select a professionally designed palette tailored for different clinic aesthetics.
                    </p>
                  </div>

                  {/* Category Filter Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {["All", "Modern", "Male", "Female", "Clinical", "Luxury"].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActivePresetFilter(cat)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          activePresetFilter === cat
                            ? "bg-slate-900 text-white shadow-xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preset Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {presets
                    .filter((p) => activePresetFilter === "All" || p.category === activePresetFilter)
                    .map((preset) => {
                      const isSelected = activeTheme.presetId === preset.id;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => applyPreset(preset.id)}
                          className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-50/20 shadow-md ring-2 ring-indigo-500/20 scale-[1.01]"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                          }`}
                        >
                          <div>
                            {/* Card Top: Category Badge & Status */}
                            <div className="flex items-center justify-between mb-3">
                              <span
                                className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                  preset.category === "Male"
                                    ? "bg-sky-100 text-sky-800"
                                    : preset.category === "Female"
                                    ? "bg-rose-100 text-rose-800"
                                    : preset.category === "Clinical"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : preset.category === "Luxury"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-indigo-100 text-indigo-800"
                                }`}
                              >
                                {preset.category}
                              </span>

                              {isSelected ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-100/80 px-2.5 py-0.5 rounded-full">
                                  <Check className="w-3.5 h-3.5" /> Active
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400 font-medium hover:text-indigo-600">
                                  Click to preview
                                </span>
                              )}
                            </div>

                            <h4 className="text-base font-bold text-slate-900 leading-tight">
                              {preset.name}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                              {preset.description}
                            </p>
                          </div>

                          {/* Color Palette Indicators */}
                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {/* Primary Swatch */}
                              <div className="flex items-center gap-1">
                                <span
                                  style={{ backgroundColor: preset.previewColors.primary }}
                                  className="w-5 h-5 rounded-full border border-black/10 shadow-2xs"
                                  title={`Primary: ${preset.previewColors.primary}`}
                                />
                                <span className="text-[10px] text-slate-400 font-mono">Brand</span>
                              </div>

                              {/* Sidebar Swatch */}
                              <div className="flex items-center gap-1">
                                <span
                                  style={{ backgroundColor: preset.previewColors.sidebar }}
                                  className="w-5 h-5 rounded-full border border-black/10 shadow-2xs"
                                  title={`Sidebar: ${preset.previewColors.sidebar}`}
                                />
                                <span className="text-[10px] text-slate-400 font-mono">Sidebar</span>
                              </div>

                              {/* Accent Swatch */}
                              <div className="flex items-center gap-1">
                                <span
                                  style={{ backgroundColor: preset.previewColors.accent }}
                                  className="w-5 h-5 rounded-full border border-black/10 shadow-2xs"
                                  title={`Accent: ${preset.previewColors.accent}`}
                                />
                                <span className="text-[10px] text-slate-400 font-mono">Accent</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                applyPreset(preset.id);
                              }}
                              className={`text-xs font-bold px-3 py-1 rounded-lg transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-indigo-600 text-white"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              }`}
                            >
                              {isSelected ? "Selected" : "Use Preset"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* ───────────────────────────────────────────────────────────── */}
              {/* SECTION 2: Custom Color Controls & Fine-Tuning               */}
              {/* ───────────────────────────────────────────────────────────── */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-indigo-600" /> Custom Color Palette Customizer
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click any color swatch or type a Hex code to customize specific elements of your software.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  
                  {/* Primary Color */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-800">Primary Brand Color</label>
                        <span className="text-[10px] text-slate-400 font-mono uppercase">Buttons &amp; Badges</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-3">Controls main action buttons, active tab indicators, and brand highlights.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={activeTheme.primaryColor || "#4f46e5"}
                        onChange={(e) => updateThemeColors({ primaryColor: e.target.value })}
                        className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white shrink-0"
                      />
                      <input
                        type="text"
                        value={activeTheme.primaryColor || "#4f46e5"}
                        onChange={(e) => updateThemeColors({ primaryColor: e.target.value })}
                        className="flex-1 font-mono text-xs px-3 py-2 border border-slate-200 rounded-xl uppercase outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Primary Hover */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-800">Button Hover State</label>
                        <span className="text-[10px] text-slate-400 font-mono uppercase">Interactions</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-3">Darker shade triggered when users hover over interactive buttons.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={activeTheme.primaryHover || "#4338ca"}
                        onChange={(e) => updateThemeColors({ primaryHover: e.target.value })}
                        className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white shrink-0"
                      />
                      <input
                        type="text"
                        value={activeTheme.primaryHover || "#4338ca"}
                        onChange={(e) => updateThemeColors({ primaryHover: e.target.value })}
                        className="flex-1 font-mono text-xs px-3 py-2 border border-slate-200 rounded-xl uppercase outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Primary Light Tint */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-800">Soft Tint / Badge Background</label>
                        <span className="text-[10px] text-slate-400 font-mono uppercase">Subtle Light</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-3">Very light pastel background used for chips, badges, and icon containers.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={activeTheme.primaryLight || "#eef2ff"}
                        onChange={(e) => updateThemeColors({ primaryLight: e.target.value })}
                        className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white shrink-0"
                      />
                      <input
                        type="text"
                        value={activeTheme.primaryLight || "#eef2ff"}
                        onChange={(e) => updateThemeColors({ primaryLight: e.target.value })}
                        className="flex-1 font-mono text-xs px-3 py-2 border border-slate-200 rounded-xl uppercase outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Sidebar Background */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-800">Sidebar Background</label>
                        <span className="text-[10px] text-slate-400 font-mono uppercase">Sidebar Panel</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-3">Background color of the main navigation drawer &amp; desktop sidebar.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={activeTheme.sidebarBg || "#0f172a"}
                        onChange={(e) => updateThemeColors({ sidebarBg: e.target.value })}
                        className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white shrink-0"
                      />
                      <input
                        type="text"
                        value={activeTheme.sidebarBg || "#0f172a"}
                        onChange={(e) => updateThemeColors({ sidebarBg: e.target.value })}
                        className="flex-1 font-mono text-xs px-3 py-2 border border-slate-200 rounded-xl uppercase outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Sidebar Inactive Text */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-800">Sidebar Inactive Text</label>
                        <span className="text-[10px] text-slate-400 font-mono uppercase">Menu Items</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-3">Label and icon color for unselected sidebar navigation links.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={activeTheme.sidebarText || "#cbd5e1"}
                        onChange={(e) => updateThemeColors({ sidebarText: e.target.value })}
                        className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white shrink-0"
                      />
                      <input
                        type="text"
                        value={activeTheme.sidebarText || "#cbd5e1"}
                        onChange={(e) => updateThemeColors({ sidebarText: e.target.value })}
                        className="flex-1 font-mono text-xs px-3 py-2 border border-slate-200 rounded-xl uppercase outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-800">Accent &amp; Indicator Color</label>
                        <span className="text-[10px] text-slate-400 font-mono uppercase">Highlights</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-3">Secondary highlight used for active sidebar indicators &amp; gradients.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={activeTheme.accentColor || "#06b6d4"}
                        onChange={(e) => updateThemeColors({ accentColor: e.target.value })}
                        className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white shrink-0"
                      />
                      <input
                        type="text"
                        value={activeTheme.accentColor || "#06b6d4"}
                        onChange={(e) => updateThemeColors({ accentColor: e.target.value })}
                        className="flex-1 font-mono text-xs px-3 py-2 border border-slate-200 rounded-xl uppercase outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                </div>
              </div>

              {/* ───────────────────────────────────────────────────────────── */}
              {/* SECTION 3: Real-Time Interactive Live Software Preview       */}
              {/* ───────────────────────────────────────────────────────────── */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Eye className="w-5 h-5 text-indigo-600" /> Real-Time Software Preview
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Live preview of how your customized colors look on the Clinic Sidebar, Top Header, and Action Buttons.
                    </p>
                  </div>
                </div>

                {/* Simulated Dashboard UI Mockup */}
                <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-lg bg-white">
                  {/* Top Bar Preview */}
                  <div
                    style={{ backgroundColor: activeTheme.headerBg || "#ffffff" }}
                    className="p-4 border-b border-slate-200 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                        <Clock style={{ color: activeTheme.primaryColor }} className="w-3.5 h-3.5" />
                        <span>Live Clinic System</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100">
                        System Online
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        style={{
                          background: `linear-gradient(135deg, ${activeTheme.primaryColor}, ${activeTheme.accentColor})`,
                        }}
                        className="w-8 h-8 rounded-xl text-white font-bold text-xs flex items-center justify-center shadow-xs"
                      >
                        A
                      </div>
                      <span className="text-xs font-bold text-slate-800">Admin User</span>
                    </div>
                  </div>

                  {/* Body: Mini Sidebar + Mini Content Canvas */}
                  <div className="flex flex-col md:flex-row min-h-[260px]">
                    {/* Mini Sidebar Preview */}
                    <div
                      style={{ backgroundColor: activeTheme.sidebarBg || "#0f172a" }}
                      className="w-full md:w-56 p-4 text-white flex flex-col justify-between shrink-0 border-r border-white/10"
                    >
                      <div className="space-y-4">
                        {/* Mini Brand Header */}
                        <div className="flex items-center space-x-2">
                          <div
                            style={{
                              background: `linear-gradient(135deg, ${activeTheme.primaryColor}, ${activeTheme.accentColor})`,
                            }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center shadow-xs"
                          >
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-bold tracking-tight text-white truncate">
                            Skin-Lab Clinic
                          </span>
                        </div>

                        {/* Mini Nav Links */}
                        <div className="space-y-1 text-xs font-semibold">
                          {/* Active Nav Item */}
                          <div
                            style={{
                              backgroundColor: activeTheme.sidebarActive || activeTheme.primaryColor,
                              color: activeTheme.primaryText || "#ffffff",
                            }}
                            className="px-3 py-2 rounded-xl flex items-center justify-between shadow-xs"
                          >
                            <span>Dashboard (Active)</span>
                            <span
                              style={{ backgroundColor: activeTheme.accentColor }}
                              className="w-1.5 h-3 rounded-full"
                            />
                          </div>

                          {/* Inactive Nav Items */}
                          <div
                            style={{ color: activeTheme.sidebarText || "#cbd5e1" }}
                            className="px-3 py-2 rounded-xl flex items-center hover:bg-white/10 transition-colors"
                          >
                            <span>Patients (PRM)</span>
                          </div>
                          <div
                            style={{ color: activeTheme.sidebarText || "#cbd5e1" }}
                            className="px-3 py-2 rounded-xl flex items-center hover:bg-white/10 transition-colors"
                          >
                            <span>POS &amp; Billing</span>
                          </div>
                          <div
                            style={{ color: activeTheme.sidebarText || "#cbd5e1" }}
                            className="px-3 py-2 rounded-xl flex items-center hover:bg-white/10 transition-colors"
                          >
                            <span>Sales Reports</span>
                          </div>
                        </div>
                      </div>

                      {/* Mini Sidebar Footer */}
                      <div className="pt-3 border-t border-white/10 text-[10px] opacity-70">
                        Theme Live Sync Active
                      </div>
                    </div>

                    {/* Mini Content Area Preview */}
                    <div className="flex-1 p-6 bg-slate-50/70 space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800">Dynamic Action Button States</h4>
                          <p className="text-xs text-slate-500">Live test of buttons across POS, Sales, and Reports.</p>
                        </div>
                        <span
                          style={{
                            backgroundColor: activeTheme.primaryLight,
                            color: activeTheme.primaryColor,
                          }}
                          className="px-2.5 py-1 rounded-full text-xs font-extrabold"
                        >
                          Theme Active
                        </span>
                      </div>

                      {/* Sample Button Showcase */}
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Primary Button */}
                        <button
                          type="button"
                          style={{
                            backgroundColor: activeTheme.primaryColor,
                            color: activeTheme.primaryText || "#ffffff",
                          }}
                          className="px-5 py-2.5 rounded-xl font-bold text-xs shadow-md hover:brightness-110 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Primary Action (+ New Sale)</span>
                        </button>

                        {/* Hover State Button */}
                        <button
                          type="button"
                          style={{
                            backgroundColor: activeTheme.primaryHover,
                            color: activeTheme.primaryText || "#ffffff",
                          }}
                          className="px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
                        >
                          <span>Hover Shade Simulation</span>
                        </button>

                        {/* Soft Tint Button */}
                        <button
                          type="button"
                          style={{
                            backgroundColor: activeTheme.primaryLight,
                            color: activeTheme.primaryColor,
                          }}
                          className="px-5 py-2.5 rounded-xl font-bold text-xs border border-black/5 hover:brightness-95 transition-all cursor-pointer"
                        >
                          <span>Soft Tint Action</span>
                        </button>

                        {/* Outline Button */}
                        <button
                          type="button"
                          style={{
                            borderColor: activeTheme.primaryColor,
                            color: activeTheme.primaryColor,
                          }}
                          className="px-5 py-2.5 rounded-xl font-bold text-xs border bg-white hover:bg-slate-50 transition-all cursor-pointer"
                        >
                          <span>Outline Action</span>
                        </button>
                      </div>

                      {/* Mini Stat Cards Sample */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
                          <div>
                            <span className="text-[11px] font-semibold text-slate-500">Today&apos;s Revenue</span>
                            <div className="text-base font-black text-slate-900 mt-0.5">PKR 145,000</div>
                          </div>
                          <div
                            style={{
                              backgroundColor: activeTheme.primaryLight,
                              color: activeTheme.primaryColor,
                            }}
                            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold"
                          >
                            <Sparkles className="w-4 h-4" />
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
                          <div>
                            <span className="text-[11px] font-semibold text-slate-500">Completed Sessions</span>
                            <div className="text-base font-black text-slate-900 mt-0.5">28 Patients</div>
                          </div>
                          <div
                            style={{
                              backgroundColor: "var(--color-primary-light)",
                              color: "var(--color-primary)",
                            }}
                            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold"
                          >
                            <Users className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ───────────────────────────────────────────────────────────── */}
              {/* SECTION 4: Bottom Save & Reset Actions Bar                   */}
              {/* ───────────────────────────────────────────────────────────── */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={resetPreview}
                    className="px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Revert to Saved Theme
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset("modern-indigo")}
                    className="px-4 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Reset to Default Modern
                  </button>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {themeSaved && (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4" /> Saved Successfully!
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={async () => {
                      const success = await saveTheme();
                      if (success) {
                        setThemeSaved(true);
                        setTimeout(() => setThemeSaved(false), 3500);
                      }
                    }}
                    disabled={themeSaving}
                    style={{
                      backgroundColor: "var(--color-primary, #4f46e5)",
                      color: "var(--color-primary-text, #ffffff)",
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center px-8 py-3 rounded-xl font-bold text-sm shadow-md hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {themeSaving ? "Saving Theme..." : "Save & Apply Theme"}
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ═══════════════════════════════════════════════════ */}
          {/* TAB 3: User Management                             */}
          {/* ═══════════════════════════════════════════════════ */}
          {activeTab === 'users' && (
            <div>
              {userRole !== "Admin" ? (
                <div className="text-center py-20">
                  <Lock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-bold text-gray-700 mb-2">Access Denied</h3>
                  <p className="text-gray-500">Only administrators can manage users and role assignments.</p>
                </div>
              ) : usersLoading ? (
                <div className="text-center py-20 text-gray-400 font-medium">Loading users list...</div>
              ) : (
                <div className="space-y-6">
                  {/* Top Bar: Search & Add Button */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="relative w-full sm:w-72">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search users or roles..."
                        value={userSearch}
                        onChange={e => setUserSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>

                    <button
                      onClick={() => setIsAddUserOpen(true)}
                      className="flex items-center px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add User
                    </button>
                  </div>

                  {/* Users Table */}
                  <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden w-full min-w-0">
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider font-semibold">
                          <tr>
                            <th className="py-3.5 px-6">User Email</th>
                            <th className="py-3.5 px-6">Assigned Role</th>
                            <th className="py-3.5 px-6">Linked Employee</th>
                            <th className="py-3.5 px-6 text-center">Status</th>
                            <th className="py-3.5 px-6 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
                          {filteredUsers.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-12 text-center text-gray-400">
                                No users found matching your search.
                              </td>
                            </tr>
                          ) : (
                            filteredUsers.map(u => (
                              <tr key={u.id} className="hover:bg-indigo-50/30 transition-colors">
                                <td className="py-4 px-6 font-medium text-gray-900">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                                      {u.email.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="truncate">{u.email}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-6">
                                  <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-3 py-1 rounded-lg text-xs font-bold">
                                    <Shield className="w-3 h-3 text-indigo-600" />
                                    {u.role}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-gray-600">
                                  {u.employee ? (
                                    <span className="font-medium text-gray-800">{u.employee.name}</span>
                                  ) : (
                                    <span className="text-gray-400 italic">None</span>
                                  )}
                                </td>
                                <td className="py-4 px-6 text-center">
                                  {u.is_active ? (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800">
                                      Active
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-800">
                                      Inactive
                                    </span>
                                  )}
                                </td>
                                <td className="py-4 px-6 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => openEditUser(u)}
                                      title="Edit User Role & Credentials"
                                      className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-gray-200 transition-colors cursor-pointer"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>

                                    <button
                                      onClick={() => toggleUserActive(u.id, u.is_active)}
                                      title={u.is_active ? "Suspend User" : "Enable User"}
                                      className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer  {
                                        u.is_active 
                                          ? 'border-amber-200 text-amber-700 hover:bg-amber-50' 
                                          : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                      }`}
                                    >
                                      {u.is_active ? (
                                        <span className="flex items-center gap-1"><ShieldOff className="w-3.5 h-3.5" /> Suspend</span>
                                      ) : (
                                        <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Enable</span>
                                      )}
                                    </button>

                                    <button
                                      onClick={() => setDeleteUserModal({ isOpen: true, user: u, isDeleting: false, error: "" })}
                                      title="Delete User"
                                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════ */}
          {/* TAB 3: Role Management (RBAC)                      */}
          {/* ═══════════════════════════════════════════════════ */}
          {activeTab === 'roles' && (
            <div>
              {userRole !== "Admin" ? (
                <div className="text-center py-20">
                  <Lock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-bold text-gray-700 mb-2">Access Denied</h3>
                  <p className="text-gray-500">Only administrators can manage roles and access control policies.</p>
                </div>
              ) : rolesLoading ? (
                <div className="text-center py-20 text-gray-400 font-medium">Loading roles and permissions...</div>
              ) : (
                <div className="space-y-6">
                  {/* Role Header Info Card */}
                  <div className="p-5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 rounded-2xl text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-indigo-300" />
                        <h2 className="text-lg font-bold">Enterprise Role-Based Access Control (RBAC)</h2>
                      </div>
                      <p className="text-xs text-indigo-200 max-w-2xl leading-relaxed">
                        Define custom roles with fine-grained Read (👁️), Write (✏️), and Delete (🗑️) permissions per module. All new roles created here are immediately available for user assignment.
                      </p>
                    </div>

                    <button
                      onClick={openCreateRole}
                      className="flex items-center px-4 py-2.5 bg-white text-indigo-950 hover:bg-indigo-50 font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4 mr-1.5 text-indigo-600" /> Create New Role
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="flex justify-between items-center gap-4">
                    <div className="relative w-full sm:w-72">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search roles..."
                        value={roleSearch}
                        onChange={e => setRoleSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>

                    <div className="text-xs text-gray-500 font-medium">
                      Showing <span className="font-bold text-gray-800">{filteredRoles.length}</span> roles
                    </div>
                  </div>

                  {/* Roles Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredRoles.map(role => {
                      const permissions = role.permissions || [];
                      const readCount = permissions.filter(p => p.can_read).length;
                      const writeCount = permissions.filter(p => p.can_write).length;
                      const deleteCount = permissions.filter(p => p.can_delete).length;
                      const userCount = role._count?.users ?? 0;

                      return (
                        <div
                          key={role.id}
                          className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative group"
                        >
                          <div>
                            {/* Card Header */}
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="flex items-center gap-2">
                                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
                                  <Shield className="w-5 h-5" />
                                </span>
                                <div>
                                  <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-2">
                                    {role.name}
                                  </h3>
                                  <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                                    <UserCheck className="w-3.5 h-3.5" /> {userCount} assigned user{userCount === 1 ? '' : 's'}
                                  </span>
                                </div>
                              </div>

                              <div>
                                {role.is_system ? (
                                  <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 uppercase tracking-wider">
                                    System Role
                                  </span>
                                ) : (
                                  <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200 uppercase tracking-wider">
                                    Custom Role
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Description */}
                            <p className="text-xs text-gray-600 line-clamp-2 min-h-[32px] mb-4">
                              {role.description || "Custom enterprise role for Skin-Lab management."}
                            </p>

                            {/* Permissions Summary Badges */}
                            <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100 space-y-2 mb-4">
                              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                                <span>Access Privileges</span>
                                <span className="text-indigo-600 font-semibold">{SYSTEM_MODULES.length} Modules</span>
                              </div>

                              <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="bg-white border border-emerald-100 rounded-lg py-1.5 px-1 shadow-2xs">
                                  <div className="text-emerald-700 font-black text-sm">{readCount}</div>
                                  <div className="text-[10px] font-semibold text-gray-500 flex items-center justify-center gap-1">
                                    <Eye className="w-3 h-3 text-emerald-600" /> Read
                                  </div>
                                </div>

                                <div className="bg-white border border-amber-100 rounded-lg py-1.5 px-1 shadow-2xs">
                                  <div className="text-amber-700 font-black text-sm">{writeCount}</div>
                                  <div className="text-[10px] font-semibold text-gray-500 flex items-center justify-center gap-1">
                                    <PenLine className="w-3 h-3 text-amber-600" /> Write
                                  </div>
                                </div>

                                <div className="bg-white border border-rose-100 rounded-lg py-1.5 px-1 shadow-2xs">
                                  <div className="text-rose-700 font-black text-sm">{deleteCount}</div>
                                  <div className="text-[10px] font-semibold text-gray-500 flex items-center justify-center gap-1">
                                    <Trash className="w-3 h-3 text-rose-600" /> Delete
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons Footer */}
                          <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                            <button
                              onClick={() => openEditRole(role)}
                              className="flex-1 flex items-center justify-center px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5 mr-1.5" /> Edit Permissions
                            </button>

                            {!role.is_system && (
                              <button
                                onClick={() => setDeleteRoleModal({ isOpen: true, role, isDeleting: false, error: "" })}
                                title="Delete Custom Role"
                                className="p-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* MODAL: ADD USER                                       */}
      {/* ══════════════════════════════════════════════════════ */}
      {isAddUserOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden mx-auto border border-gray-100 max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/80 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">Add New System User</h3>
              </div>
              <button
                onClick={() => { setIsAddUserOpen(false); setAddUserError(""); }}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1 rounded-xl hover:bg-gray-200/50"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                  placeholder="user@skinlab.com"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                  placeholder="Minimum 6 characters"
                  value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Assigned Role</label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm bg-white"
                  value={newUser.role_id}
                  onChange={e => setNewUser({ ...newUser, role_id: e.target.value })}
                >
                  <option value="">Select a system / custom role...</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.is_system ? "(System)" : "(Custom)"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Link to Employee (Optional)</label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm bg-white"
                  value={newUser.employee_id}
                  onChange={e => setNewUser({ ...newUser, employee_id: e.target.value })}
                >
                  <option value="">None (Standalone Account)</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              {addUserError && (
                <div className="text-red-600 text-xs bg-red-50 p-3 rounded-xl border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{addUserError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setIsAddUserOpen(false); setAddUserError(""); }}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUser}
                  disabled={addUserSaving}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold text-sm shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {addUserSaving ? "Creating..." : "Create User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* MODAL: EDIT USER                                      */}
      {/* ══════════════════════════════════════════════════════ */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden mx-auto border border-gray-100 max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/80 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">Edit User & Role</h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1 rounded-xl hover:bg-gray-200/50"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">User Account</label>
                <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800">
                  {editingUser.email}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Assign Role</label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm bg-white"
                  value={editUserData.role_id}
                  onChange={e => setEditUserData({ ...editUserData, role_id: e.target.value })}
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.is_system ? "(System)" : "(Custom)"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Linked Employee</label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm bg-white"
                  value={editUserData.employee_id}
                  onChange={e => setEditUserData({ ...editUserData, employee_id: e.target.value })}
                >
                  <option value="">None (Standalone)</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Reset Password <span className="text-gray-400 font-normal text-xs">(Leave blank to keep current)</span>
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                  placeholder="New password (min. 6 characters)"
                  value={editUserData.password}
                  onChange={e => setEditUserData({ ...editUserData, password: e.target.value })}
                />
              </div>

              {editUserError && (
                <div className="text-red-600 text-xs bg-red-50 p-3 rounded-xl border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editUserError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateUser}
                  disabled={editUserSaving}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold text-sm shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {editUserSaving ? "Saving..." : "Update User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* MODAL: DELETE USER CONFIRMATION                        */}
      {/* ══════════════════════════════════════════════════════ */}
      {deleteUserModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden mx-auto p-6 text-center border border-gray-100 max-h-[92vh] flex flex-col justify-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete User Account?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete <span className="font-semibold text-gray-800">{deleteUserModal.user?.email}</span>? This action cannot be undone.
            </p>

            {deleteUserModal.error && (
              <div className="text-red-600 text-xs bg-red-50 p-3 rounded-xl border border-red-200 mb-4">
                {deleteUserModal.error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteUserModal({ isOpen: false, user: null, isDeleting: false, error: "" })}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleteUserModal.isDeleting}
                className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-semibold text-sm shadow-md shadow-rose-600/20 transition-all cursor-pointer"
              >
                {deleteUserModal.isDeleting ? "Deleting..." : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* MODAL: CREATE / EDIT ROLE & PERMISSIONS MATRIX         */}
      {/* ══════════════════════════════════════════════════════ */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden mx-auto border border-gray-100 my-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/80 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    {roleModalMode === "create" ? "Create New System Role" : `Edit Role: ${roleForm.name}`}
                  </h3>
                  <p className="text-xs text-gray-500">Configure role metadata and granular Read/Write/Delete module matrix.</p>
                </div>
              </div>
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold p-1 rounded-xl hover:bg-gray-200/50"
              >
                &times;
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Role Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Role Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isCurrentRoleSystem && roleForm.name === "Admin"}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm font-semibold text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                    placeholder="e.g. Receptionist, Nurse, Branch Manager"
                    value={roleForm.name}
                    onChange={e => setRoleForm({ ...roleForm, name: e.target.value })}
                  />
                  {isCurrentRoleSystem && roleForm.name === "Admin" && (
                    <span className="text-[11px] text-amber-600 font-medium mt-1 block">Master Admin role name is protected.</span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                    placeholder="e.g. Front desk billing, patient check-in and scheduling"
                    value={roleForm.description}
                    onChange={e => setRoleForm({ ...roleForm, description: e.target.value })}
                  />
                </div>
              </div>

              {/* Quick Presets & Metrics Banner */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-gray-600 mr-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Quick Presets:
                  </span>
                  <button
                    type="button"
                    onClick={() => setAllPermissions(true)}
                    className="px-2.5 py-1 bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 rounded-lg text-xs font-semibold text-gray-700 shadow-2xs transition-colors cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetPermissions("readonly")}
                    className="px-2.5 py-1 bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 rounded-lg text-xs font-semibold text-gray-700 shadow-2xs transition-colors cursor-pointer"
                  >
                    Read-Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetPermissions("operations")}
                    className="px-2.5 py-1 bg-white border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 rounded-lg text-xs font-semibold text-gray-700 shadow-2xs transition-colors cursor-pointer"
                  >
                    Clinical & POS
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllPermissions(false)}
                    className="px-2.5 py-1 bg-white border border-gray-200 hover:border-red-300 hover:text-red-600 rounded-lg text-xs font-semibold text-gray-500 shadow-2xs transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                {/* Counter Badges */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2.5 py-1 rounded-lg">
                    <Eye className="w-3.5 h-3.5" /> {totalRead} Read
                  </span>
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-2.5 py-1 rounded-lg">
                    <PenLine className="w-3.5 h-3.5" /> {totalWrite} Write
                  </span>
                  <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold px-2.5 py-1 rounded-lg">
                    <Trash className="w-3.5 h-3.5" /> {totalDelete} Delete
                  </span>
                </div>
              </div>

              {/* Granular Permissions Matrix Table */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3.5 px-4 sm:px-6">Module / Feature</th>
                      <th className="py-3.5 px-3 text-center w-24">
                        <span className="text-emerald-700 flex items-center justify-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> Read
                        </span>
                      </th>
                      <th className="py-3.5 px-3 text-center w-24">
                        <span className="text-amber-700 flex items-center justify-center gap-1">
                          <PenLine className="w-3.5 h-3.5" /> Write
                        </span>
                      </th>
                      <th className="py-3.5 px-3 text-center w-24">
                        <span className="text-rose-700 flex items-center justify-center gap-1">
                          <Trash className="w-3.5 h-3.5" /> Delete
                        </span>
                      </th>
                      <th className="py-3.5 px-4 text-center w-24">Toggle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {SYSTEM_MODULES.map((m) => {
                      const perm = roleForm.permissions[m.id] || { read: false, write: false, delete: false };
                      const catStyle = CATEGORY_COLORS[m.category] || { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" };
                      const allChecked = perm.read && perm.write && perm.delete;

                      return (
                        <tr key={m.id} className="hover:bg-indigo-50/20 transition-colors">
                          <td className="py-3.5 px-4 sm:px-6">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                              <span className="font-bold text-gray-900 text-sm">{m.name}</span>
                              <span className={`inline-block w-fit px-2 py-0.5 rounded text-[10px] font-bold border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}>
                                {m.category}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">{m.description}</p>
                          </td>

                          {/* Read Checkbox */}
                          <td className="py-3.5 px-3 text-center">
                            <label className="inline-flex items-center justify-center cursor-pointer p-1">
                              <input
                                type="checkbox"
                                checked={perm.read}
                                onChange={() => toggleModuleAction(m.id, "read")}
                                className="w-5 h-5 rounded-md text-indigo-600 focus:ring-indigo-500 border-gray-300 cursor-pointer accent-indigo-600"
                              />
                            </label>
                          </td>

                          {/* Write Checkbox */}
                          <td className="py-3.5 px-3 text-center">
                            <label className="inline-flex items-center justify-center cursor-pointer p-1">
                              <input
                                type="checkbox"
                                checked={perm.write}
                                onChange={() => toggleModuleAction(m.id, "write")}
                                className="w-5 h-5 rounded-md text-amber-600 focus:ring-amber-500 border-gray-300 cursor-pointer accent-amber-600"
                              />
                            </label>
                          </td>

                          {/* Delete Checkbox */}
                          <td className="py-3.5 px-3 text-center">
                            <label className="inline-flex items-center justify-center cursor-pointer p-1">
                              <input
                                type="checkbox"
                                checked={perm.delete}
                                onChange={() => toggleModuleAction(m.id, "delete")}
                                className="w-5 h-5 rounded-md text-rose-600 focus:ring-rose-500 border-gray-300 cursor-pointer accent-rose-600"
                              />
                            </label>
                          </td>

                          {/* Row All Toggle */}
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => toggleEntireModule(m.id)}
                              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer  {
                                allChecked 
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                                  : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              {allChecked ? "All On" : "All"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {roleFormError && (
                <div className="text-red-600 text-xs bg-red-50 p-3.5 rounded-xl border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{roleFormError}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsRoleModalOpen(false)}
                className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 font-semibold text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRole}
                disabled={roleFormSaving}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold text-sm shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {roleFormSaving ? "Saving Role..." : roleModalMode === "create" ? "Create Role" : "Save Role Permissions"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* MODAL: DELETE ROLE CONFIRMATION                        */}
      {/* ══════════════════════════════════════════════════════ */}
      {deleteRoleModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden mx-auto p-6 text-center border border-gray-100 max-h-[92vh] flex flex-col justify-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Custom Role?</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete role <span className="font-semibold text-gray-800">"{deleteRoleModal.role?.name}"</span>?
            </p>

            {deleteRoleModal.error && (
              <div className="text-red-600 text-xs bg-red-50 p-3 rounded-xl border border-red-200 mb-4 text-left">
                {deleteRoleModal.error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteRoleModal({ isOpen: false, role: null, isDeleting: false, error: "" })}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRole}
                disabled={deleteRoleModal.isDeleting}
                className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-semibold text-sm shadow-md shadow-rose-600/20 transition-all cursor-pointer"
              >
                {deleteRoleModal.isDeleting ? "Deleting..." : "Delete Role"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
