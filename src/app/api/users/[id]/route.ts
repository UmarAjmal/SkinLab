import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if ((session.user as any).role !== "Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await request.json();
    const updateData: any = {};

    if (typeof data.is_active === "boolean") {
      updateData.is_active = data.is_active;
    }

    if (data.role_id) {
      updateData.role_id = data.role_id;
    }

    if (data.employee_id !== undefined) {
      updateData.employee_id = data.employee_id ? data.employee_id : null;
    }

    if (data.password && typeof data.password === "string" && data.password.trim().length >= 6) {
      updateData.password = await bcrypt.hash(data.password.trim(), 10);
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      include: { role: true, employee: true }
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      is_active: user.is_active,
      role: user.role.name,
      role_id: user.role_id,
      employee: user.employee ? { id: user.employee.id, name: user.employee.name } : null
    });
  } catch (error) {
    console.error("PATCH /api/users/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if ((session.user as any).role !== "Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const currentUserId = (session.user as any).id;
    if (params.id === currentUserId) {
      return NextResponse.json({ error: "You cannot delete your own user account" }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/users/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

