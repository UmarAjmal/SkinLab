import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient() as any;


export const MODULES = [
    { id: "dashboard", name: "Dashboard & Analytics", category: "Core" },
    { id: "patients", name: "Patients (PRM)", category: "Clinical" },
    { id: "services", name: "Services & Treatments", category: "Clinical" },
    { id: "staff", name: "Staff & Doctors", category: "Operations" },
    // { id: "purchases", name: "Purchases & Inventory", category: "Operations" },
    { id: "pos", name: "Point of Sale (POS)", category: "Billing" },
    { id: "sales", name: "Sales History & Returns", category: "Billing" },
    { id: "reports", name: "Financial & Business Reports", category: "Analytics" },
    { id: "settings", name: "Clinic Settings", category: "Administration" },
    { id: "users", name: "User Management", category: "Administration" },
    { id: "roles", name: "Role & Permission Management", category: "Administration" },
];

export const DEFAULT_ROLES = [
    {
        name: "Admin",
        description: "Full unrestricted access to all modules, permissions, and system settings.",
        is_system: true,
        permissions: MODULES.map((m) => ({ module: m.id, can_read: true, can_write: true, can_delete: true })),
    },
    {
        name: "Manager",
        description: "Operational management access across patients, staff, inventory, POS, and reports.",
        is_system: true,
        permissions: MODULES.map((m) => {
            if (m.id === "roles") return { module: m.id, can_read: true, can_write: false, can_delete: false };
            return { module: m.id, can_read: true, can_write: true, can_delete: m.id !== "settings" && m.id !== "users" };
        }),
    },
    {
        name: "Doctor",
        description: "Clinical access for managing patients, performing treatments, and POS billing.",
        is_system: true,
        permissions: MODULES.map((m) => {
            if (["dashboard", "patients", "services", "pos", "sales"].includes(m.id)) {
                return { module: m.id, can_read: true, can_write: true, can_delete: false };
            }
            return { module: m.id, can_read: false, can_write: false, can_delete: false };
        }),
    },
    {
        name: "Cashier",
        description: "Front-desk access for POS checkout, patient check-in, and viewing sales history.",
        is_system: true,
        permissions: MODULES.map((m) => {
            if (["dashboard", "patients", "pos", "sales"].includes(m.id)) {
                return { module: m.id, can_read: true, can_write: true, can_delete: false };
            }
            return { module: m.id, can_read: false, can_write: false, can_delete: false };
        }),
    },
];

async function main() {
    console.log("Seeding default roles and permissions...");

    for (const roleDef of DEFAULT_ROLES) {
        const existingRole = await prisma.role.findUnique({ where: { name: roleDef.name } });

        const role = existingRole
            ? await prisma.role.update({
                where: { id: existingRole.id },
                data: {
                    description: roleDef.description,
                    is_system: roleDef.is_system,
                },
            })
            : await prisma.role.create({
                data: {
                    name: roleDef.name,
                    description: roleDef.description,
                    is_system: roleDef.is_system,
                },
            });

        console.log(`Configured role: ${role.name}`);

        // Replace permissions in batch
        await prisma.rolePermission.deleteMany({ where: { role_id: role.id } });
        await prisma.rolePermission.createMany({
            data: roleDef.permissions.map((p) => ({
                role_id: role.id,
                module: p.module,
                can_read: p.can_read,
                can_write: p.can_write,
                can_delete: p.can_delete,
            })),
            skipDuplicates: true,
        });
    }

    console.log("Roles and permissions seeded successfully!");
}

main()
    .catch((e) => {
        console.error("Seed error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });


