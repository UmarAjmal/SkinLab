import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export interface SystemModule {
  id: string;
  name: string;
  description: string;
  category: "Core" | "Clinical" | "Operations" | "Billing" | "Analytics" | "Administration";
}

export const SYSTEM_MODULES: SystemModule[] = [
  {
    id: "dashboard",
    name: "Dashboard & Analytics",
    description: "Overview of clinic stats, revenue charts, and quick actions",
    category: "Core",
  },
  {
    id: "patients",
    name: "Patients (PRM)",
    description: "Patient registration, profiles, treatment history, and balances",
    category: "Clinical",
  },
  {
    id: "services",
    name: "Services & Treatments",
    description: "Medical services, procedure pricing, categories, and deals",
    category: "Clinical",
  },
  {
    id: "staff",
    name: "Staff & Doctors",
    description: "Employee directory, doctor profiles, and clinic departments",
    category: "Operations",
  },
  {
    id: "purchases",
    name: "Purchases & Stock",
    description: "Supplier purchase orders, inventory reception, and cost tracking",
    category: "Operations",
  },
  {
    id: "pos",
    name: "Point of Sale (POS)",
    description: "New invoice generation, cart checkout, and discount handling",
    category: "Billing",
  },
  {
    id: "sales",
    name: "Sales History & Returns",
    description: "Invoice history, payment status, thermal printing, and refunds",
    category: "Billing",
  },
  {
    id: "reports",
    name: "Financial Reports",
    description: "Doctor sales performance, revenue summaries, and expense analysis",
    category: "Analytics",
  },
  {
    id: "settings",
    name: "Clinic Settings",
    description: "Clinic profile, tax details, logo, and receipt templates",
    category: "Administration",
  },
  {
    id: "roles",
    name: "Role Management (RBAC)",
    description: "Custom role creation, Read/Write/Delete permissions matrix",
    category: "Administration",
  },
  {
    id: "users",
    name: "User Management",
    description: "System user accounts, role assignment, and access control",
    category: "Administration",
  },
];

export type PermissionAction = "read" | "write" | "delete";

export interface RolePermissionData {
  module: string;
  can_read: boolean;
  can_write: boolean;
  can_delete: boolean;
}

/**
 * Check if a role permission set allows a given action on a module.
 * Admin role always gets full access.
 */
export function checkPermission(
  roleName: string,
  permissions: RolePermissionData[] | undefined,
  moduleId: string,
  action: PermissionAction
): boolean {
  if (roleName === "Admin") return true;
  if (!permissions || permissions.length === 0) return false;

  const modulePerm = permissions.find((p) => p.module === moduleId);
  if (!modulePerm) return false;

  if (action === "read") return modulePerm.can_read;
  if (action === "write") return modulePerm.can_write;
  if (action === "delete") return modulePerm.can_delete;
  return false;
}

/**
 * Server-side helper to check if the currently authenticated user has permission.
 * Throws or returns session.
 */
export async function requireModulePermission(moduleId: string, action: PermissionAction = "read") {
  const session = await getServerSession();
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const roleName = (session.user as any).role || "";
  if (roleName === "Admin") {
    return session;
  }

  const userId = (session.user as any).id;
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          permissions: true,
        },
      },
    },
  });

  if (!user || !user.is_active || !user.role) {
    throw new Error("Unauthorized");
  }

  const hasAccess = checkPermission(
    user.role.name,
    user.role.permissions,
    moduleId,
    action
  );

  if (!hasAccess) {
    throw new Error("Forbidden: Insufficient permissions for this action");
  }

  return session;
}
