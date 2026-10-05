import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const companyId = (session.user as any)?.company_id;
    let departments = await prisma.department.findMany({
      where: companyId ? { company_id: companyId } : {},
      orderBy: { name: 'asc' },
    });

    if (departments.length === 0 && companyId) {
      await prisma.department.createMany({
        data: [
          { name: "General Clinical Operations", company_id: companyId },
          { name: "Aesthetic Treatments", company_id: companyId },
        ],
        skipDuplicates: true,
      });
      departments = await prisma.department.findMany({
        where: { company_id: companyId },
        orderBy: { name: 'asc' },
      });
    }

    return NextResponse.json(departments);
  } catch (error) {
    console.error("GET /api/departments error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await request.json();
    const companyId = (session.user as any)?.company_id;
    if (!data.name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const newDept = await prisma.department.create({
      data: {
        name: data.name,
        ...(companyId ? { company_id: companyId } : {}),
      }
    });
    return NextResponse.json(newDept, { status: 201 });
  } catch (error) {
    console.error("POST /api/departments error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
