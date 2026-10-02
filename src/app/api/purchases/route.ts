import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    await requireRole(["Admin", "Manager"]);
    const purchases = await prisma.purchase.findMany({
      orderBy: { date: "desc" },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
    return NextResponse.json(purchases);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch purchases" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requireRole(["Admin", "Manager"]);
    const body = await req.json();
    const { supplier_id, invoice_number, date, subtotal, delivery_charges, tax, grand_total, status, items } = body;

    // 1. Create Purchase and PurchaseItems
    const purchase = await prisma.purchase.create({
      data: {
        supplier_id,
        invoice_number,
        date: new Date(date || Date.now()),
        subtotal,
        delivery_charges: delivery_charges || 0,
        tax: tax || 0,
        grand_total,
        status: status || "RECEIVED",
        items: {
          create: items.map((item: any) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_cost: item.unit_cost,
            total_cost: item.total_cost,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // 2. Increase stock_quantity for each product
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.product_id },
        data: {
          stock_quantity: {
            increment: item.quantity,
          },
        },
      });
    }

    return NextResponse.json(purchase, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create purchase:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Invoice number already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create purchase" }, { status: 500 });
  }
}
