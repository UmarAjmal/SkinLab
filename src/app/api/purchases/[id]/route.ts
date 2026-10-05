import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole(["Admin", "Manager"]);
    const companyId = (session.user as any)?.company_id;
    const purchase = await prisma.purchase.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
    if (!purchase || (companyId && (purchase as any).company_id && (purchase as any).company_id !== companyId)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(purchase);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch purchase" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole(["Admin", "Manager"]);
    const companyId = (session.user as any)?.company_id;
    const existing = await prisma.purchase.findUnique({ where: { id: params.id } });
    if (!existing || (companyId && (existing as any).company_id && (existing as any).company_id !== companyId)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    
    // For now, we mainly support updating status
    const purchase = await prisma.purchase.update({
      where: { id: params.id },
      data: {
        status: body.status,
      },
    });
    return NextResponse.json(purchase);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update purchase" }, { status: 500 });
  }
}
