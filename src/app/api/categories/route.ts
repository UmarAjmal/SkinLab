import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { hasModulePermission } from "@/lib/permissions";

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const companyId = (session.user as any)?.company_id;

  try {
    const categories = await prisma.category.findMany({
      where: companyId ? { company_id: companyId } : {},
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const canWrite = await hasModulePermission(session, "services", "write", ["Admin", "Manager", "Cashier", "Doctor"]);
  if (!canWrite) {
    return NextResponse.json({ error: "Forbidden: You do not have permission to manage categories" }, { status: 403 });
  }

  try {
    const data = await request.json();
    if (!data.name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const companyId = (session.user as any)?.company_id;

    const newCategory = await prisma.category.create({
      data: {
        name: data.name,
        company_id: companyId,
      }
    });
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("POST /api/categories error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
