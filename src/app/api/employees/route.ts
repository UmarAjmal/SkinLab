import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const isDoctorParam = searchParams.get("is_doctor");

  try {
    const employees = await prisma.employee.findMany({
      where: isDoctorParam === "true" ? { is_doctor: true } : undefined,
      include: { department: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(employees);
  } catch (error) {
    console.error("GET /api/employees error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await request.json();
    if (!data.name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const newEmployee = await prisma.employee.create({
      data: {
        name: data.name,
        is_doctor: data.is_doctor || false,
        department_id: data.department_id || null,
      }
    });

    return NextResponse.json(newEmployee, { status: 201 });
  } catch (error) {
    console.error("POST /api/employees error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
