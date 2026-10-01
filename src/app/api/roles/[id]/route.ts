import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { SYSTEM_MODULES } from "@/lib/permissions";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const role = await prisma.role.findUnique({
      where: { id: params.id },
      include: {
        permissions: true,
        _count: {
          select: { users: true },
        },
      },
    });

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    return NextResponse.json(role);
  } catch (error) {
    console.error("GET /api/roles/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userRole = (session.user as any)?.role;
  if (userRole !== "Admin") {
    return NextResponse.json({ error: "Only administrators can update roles" }, { status: 403 });
  }

  try {
    const role = await prisma.role.findUnique({
      where: { id: params.id },
      include: { permissions: true },
    });

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, permissions } = body;

    const updateData: any = {};

    if (name && typeof name === "string") {
      const trimmedName = name.trim();
      if (role.is_system && role.name === "Admin" && trimmedName !== "Admin") {
        return NextResponse.json({ error: "Cannot rename the master Admin role" }, { status: 400 });
      }

      // Check name uniqueness if changed
      if (trimmedName.toLowerCase() !== role.name.toLowerCase()) {
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
      }
      updateData.name = trimmedName;
    }

    if (description !== undefined) {
      updateData.description = typeof description === "string" ? description.trim() : null;
    }

    // Update role
    await prisma.role.update({
      where: { id: params.id },
      data: updateData,
    });

    // Update permissions if provided
    if (Array.isArray(permissions)) {
      // If Admin role, ensure full access is kept or customized
      const validPermissions = SYSTEM_MODULES.map((m) => {
        const p = permissions.find((item: any) => item.module === m.id);
        // If it's Admin system role, always keep read/write/delete true
        if (role.name === "Admin") {
          return {
            role_id: role.id,
            module: m.id,
            can_read: true,
            can_write: true,
            can_delete: true,
          };
        }
        return {
          role_id: role.id,
          module: m.id,
          can_read: Boolean(p?.can_read),
          can_write: Boolean(p?.can_write),
          can_delete: Boolean(p?.can_delete),
        };
      });

      // Replace permissions in batch
      await prisma.rolePermission.deleteMany({
        where: { role_id: role.id },
      });

      await prisma.rolePermission.createMany({
        data: validPermissions,
        skipDuplicates: true,
      });
    }

    const updatedRole = await prisma.role.findUnique({
      where: { id: params.id },
      include: {
        permissions: true,
        _count: {
          select: { users: true },
        },
      },
    });

    return NextResponse.json(updatedRole);
  } catch (error) {
    console.error("PUT /api/roles/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userRole = (session.user as any)?.role;
  if (userRole !== "Admin") {
    return NextResponse.json({ error: "Only administrators can delete roles" }, { status: 403 });
  }

  try {
    const role = await prisma.role.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    if (role.is_system) {
      return NextResponse.json(
        { error: `The system default role " {role.name}" cannot be deleted.` },
        { status: 400 }
      );
    }

    if (role._count.users > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete role " {role.name}" because it is currently assigned to  {role._count.users} user(s). Please reassign them to another role first.`,
        },
        { status: 400 }
      );
    }

    await prisma.role.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: `Role " {role.name}" was deleted successfully.` });
  } catch (error) {
    console.error("DELETE /api/roles/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
