import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireRole } from "@/lib/auth";
const prisma = new PrismaClient();

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

    const result = await prisma.transaction(async (tx) => {
      // 1. Get the original sale
      const sale = await tx.sale.findUnique({
        where: { id: params.id },
        include: { items: true }
      });

      if (!sale) throw new Error("Sale not found");

      // 2. Create the ReturnSale record
      const returnSale = await tx.returnSale.create({
        data: {
          sale_id: sale.id,
          reason: reason || "No reason provided",
          refund_amount: totalRefundAmount,
          processed_by: userId,
          items: {
            create: items.map((item: any) => ({
              sale_item_id: item.sale_item_id,
              quantity_returned: item.quantity_returned,
              refund_amount: item.refund_amount
            }))
          }
        }
      });

      // 3. Update SaleItems (reduce sessions/quantity)
      for (const item of items) {
        await tx.saleItem.update({
          where: { id: item.sale_item_id },
          data: {
            sessions_allowed: {
              decrement: item.quantity_returned
            },
            total_price: {
              decrement: item.refund_amount
            }
          }
        });
      }

      // 4. Update the Sale grand_total
      await tx.sale.update({
        where: { id: sale.id },
        data: {
          grand_total: {
            decrement: totalRefundAmount
          }
        }
      });

      // 5. Update the Customer balance (store credit for now, per user preference/default logic)
      if (sale.customer_id) {
        await tx.customer.update({
          where: { id: sale.customer_id },
          data: {
            advance_balance: {
              increment: totalRefundAmount
            }
          }
        });
      }

      return returnSale;
    }, {
      maxWait: 10000,
      timeout: 15000,
    });

    return NextResponse.json(result, { status: 201 });
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
