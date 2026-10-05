import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { SYSTEM_MODULES } from "@/lib/permissions";

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const companyId = (session.user as any)?.company_id;
    const roles = await prisma.role.findMany({
      include: {
        permissions: true,
        _count: {
          select: {
            users: companyId ? { where: { company_id: companyId } } : true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(roles);
  } catch (error) {
    console.error("GET /api/roles error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userRole = (session.user as any)?.role;
  if (userRole !== "Admin") {
    return NextResponse.json({ error: "Only administrators can create roles" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, description, permissions } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Check if role name already exists
    const existing = await prisma.role.findFirst({
      where: {
        name: {
          equals: trimmedName,
          mode: "insensitive",
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "A role with this name already exists" }, { status: 409 });
    }

    // Build permissions list (defaulting all missing modules to false)
    const validPermissions = SYSTEM_MODULES.map((m) => {
      const p = Array.isArray(permissions) ? permissions.find((item: any) => item.module === m.id) : null;
      return {
        module: m.id,
        can_read: Boolean(p?.can_read),
        can_write: Boolean(p?.can_write),
        can_delete: Boolean(p?.can_delete),
      };
    });

    const newRole = await prisma.role.create({
      data: {
        name: trimmedName,
        description: description?.trim() || null,
        is_system: false,
        permissions: {
          create: validPermissions,
        },
      },
      include: {
        permissions: true,
        _count: {
          select: { users: true },
        },
      },
    });

    return NextResponse.json(newRole, { status: 201 });
  } catch (error) {
    console.error("POST /api/roles error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

