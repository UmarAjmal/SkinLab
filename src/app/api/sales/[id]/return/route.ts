import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole(["Admin", "Manager"]);
    const userId = (session?.user as any)?.id || "SYSTEM";

    const body = await req.json();
    const { reason, items } = body; // items: [{ sale_item_id, quantity_returned, refund_amount }]

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items selected for return" }, { status: 400 });
    }

    const totalRefundAmount = items.reduce((acc: number, item: any) => acc + Number(item.refund_amount), 0);

    // 1. Get the original sale
    const sale = await prisma.sale.findUnique({
      where: { id: params.id },
      include: { items: true, customer: true },
    });

    if (!sale) return NextResponse.json({ error: "Sale not found" }, { status: 404 });

    // 2. Create the ReturnSale record
    const returnSale = await prisma.returnSale.create({
      data: {
        sale_id: sale.id,
        reason: reason || "No reason provided",
        refund_amount: totalRefundAmount,
        processed_by: userId,
        items: {
          create: items.map((item: any) => ({
            sale_item_id: item.sale_item_id,
            quantity_returned: item.quantity_returned,
            refund_amount: item.refund_amount,
          })),
        },
      },
    });

    // 3. Update SaleItems (reduce sessions/quantity)
    for (const item of items) {
      await prisma.saleItem.update({
        where: { id: item.sale_item_id },
        data: {
          sessions_allowed: {
            decrement: item.quantity_returned,
          },
          total_price: {
            decrement: item.refund_amount,
          },
        },
      });
    }

    // 4. Update the Sale grand_total
    await prisma.sale.update({
      where: { id: sale.id },
      data: {
        grand_total: {
          decrement: totalRefundAmount,
        },
      },
    });

    // 5. Update the Customer balance
    if (sale.customer_id) {
      await prisma.customer.update({
        where: { id: sale.customer_id },
        data: {
          advance_balance: {
            increment: totalRefundAmount,
          },
        },
      });
    }

    // Trigger Notification for Return/Refund
    createNotification({
      title: `Return Processed: ${sale.invoice_number}`,
      message: `Refund of PKR ${totalRefundAmount.toFixed(2)} processed for ${sale.customer?.name || "Patient"} (Reason: ${reason || "Not specified"}).`,
      type: "REFUND_PROCESSED",
      severity: "WARNING",
      targetRole: "Admin",
      linkUrl: `/dashboard/sales?search=${sale.invoice_number}`,
    }).catch(console.error);

    return NextResponse.json(returnSale, { status: 201 });
  } catch (error: any) {
    console.error("Failed to process return:", error);

    let errorMessage = error.message || "Failed to process return";

    // Check for Prisma transaction specific errors (e.g., P2028: Transaction API error)
    if (error.code === 'P2028') {
      errorMessage = "Database transaction timed out. Please try again.";
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
