import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const companyId = (session.user as any)?.company_id;
    const employee = await prisma.employee.findUnique({
      where: { id: params.id },
      include: { department: true },
    });
    if (!employee || (companyId && employee.company_id && employee.company_id !== companyId)) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }
    return NextResponse.json(employee);
  } catch (error) {
    console.error("GET /api/employees/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const companyId = (session.user as any)?.company_id;
    const existing = await prisma.employee.findUnique({ where: { id: params.id } });
    if (!existing || (companyId && existing.company_id && existing.company_id !== companyId)) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const data = await request.json();
    
    if (!data.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id: params.id },
      data: {
        name: data.name,
        is_doctor: data.is_doctor,
        department_id: data.department_id || null,
      }
    });
    return NextResponse.json(updatedEmployee);
  } catch (error) {
    console.error("PUT /api/employees/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const companyId = (session.user as any)?.company_id;
    const existing = await prisma.employee.findUnique({ where: { id: params.id } });
    if (!existing || (companyId && existing.company_id && existing.company_id !== companyId)) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    await prisma.employee.delete({
      where: { id: params.id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/employees/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
