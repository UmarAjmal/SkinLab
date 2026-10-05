import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only Admin can list users
  if ((session.user as any).role !== "Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const companyId = (session.user as any)?.company_id;
    const users = await prisma.user.findMany({
      where: companyId ? { company_id: companyId } : {},
      include: { role: true, employee: true },
      orderBy: { email: "asc" }
    });

    // Exclude password from response
    const safeUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      is_active: u.is_active,
      role: u.role.name,
      role_id: u.role_id,
      employee: u.employee ? { id: u.employee.id, name: u.employee.name } : null
    }));

    return NextResponse.json(safeUsers);
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if ((session.user as any).role !== "Admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await request.json();
    const companyId = (session.user as any)?.company_id;

    if (!data.email || !data.password || !data.role_id) {
      return NextResponse.json({ error: "Email, password, and role are required" }, { status: 400 });
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role_id: data.role_id,
        employee_id: data.employee_id || null,
        ...(companyId ? { company_id: companyId } : {}),
      },
      include: { role: true, employee: true }
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      is_active: user.is_active,
      role: user.role.name,
      role_id: user.role_id,
      employee: user.employee ? { id: user.employee.id, name: user.employee.name } : null
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/users error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
