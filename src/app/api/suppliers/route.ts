import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requireRole(["Admin", "Manager"]);
    const companyId = (session.user as any)?.company_id;

    const suppliers = await prisma.supplier.findMany({
      where: companyId ? { company_id: companyId } : {},
      orderBy: { name: "asc" },
    });
    return NextResponse.json(suppliers);
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized or failed to fetch suppliers" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireRole(["Admin", "Manager"]);
    const companyId = (session.user as any)?.company_id;
    const body = await req.json();

    const supplier = await prisma.supplier.create({
      data: {
        name: body.name,
        contact_person: body.contact_person,
        phone: body.phone,
        address: body.address,
        tax_number: body.tax_number,
        balance: body.balance || 0,
        ...(companyId ? { company_id: companyId } : {}),
      },
    });
    return NextResponse.json(supplier, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create supplier:", error);
    return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 });
  }
}
