import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole(["Admin", "Manager"]);
    const companyId = (session.user as any)?.company_id;
    const supplier = await prisma.supplier.findUnique({
      where: { id: params.id },
    });
    if (!supplier || (companyId && (supplier as any).company_id && (supplier as any).company_id !== companyId)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(supplier);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch supplier" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole(["Admin", "Manager"]);
    const companyId = (session.user as any)?.company_id;
    const existing = await prisma.supplier.findUnique({ where: { id: params.id } });
    if (!existing || (companyId && (existing as any).company_id && (existing as any).company_id !== companyId)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const supplier = await prisma.supplier.update({
      where: { id: params.id },
      data: {
        name: body.name,
        contact_person: body.contact_person,
        phone: body.phone,
        address: body.address,
        tax_number: body.tax_number,
        balance: body.balance,
      },
    });
    return NextResponse.json(supplier);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update supplier" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole(["Admin", "Manager"]);
    const companyId = (session.user as any)?.company_id;
    const existing = await prisma.supplier.findUnique({ where: { id: params.id } });
    if (!existing || (companyId && (existing as any).company_id && (existing as any).company_id !== companyId)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.supplier.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete supplier" }, { status: 500 });
  }
}
