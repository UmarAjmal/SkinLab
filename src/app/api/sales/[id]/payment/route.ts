import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any)?.role;
  if (!["Admin", "Manager", "Cashier"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await request.json();
    const saleId = params.id;
    const amountToCollect = parseFloat(data.amount);

    if (isNaN(amountToCollect) || amountToCollect <= 0) {
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
    }

    const result = await prisma.transaction(async (tx) => {
      // 1. Fetch sale
      const sale = await tx.sale.findUnique({ where: { id: saleId }, include: { customer: true } });
      if (!sale) throw new Error("Sale not found");

      // 2. Validate amount doesn't exceed due
      // Allow slight floating point variances but strictly prevent massive overpayments natively
      const remainingDue = sale.grand_total - sale.paid_amount;
      if (amountToCollect > remainingDue + 0.01) {
        throw new Error("Payment amount exceeds remaining due for this invoice.");
      }

      // 3. Update sale
      const newPaidAmount = sale.paid_amount + amountToCollect;
      let newStatus = sale.payment_status;
      if (newPaidAmount >= sale.grand_total - 0.01) {
        newStatus = "PAID";
      } else if (newPaidAmount > 0) {
        newStatus = "PARTIAL";
      }

      const updateData: any = {
        paid_amount: newPaidAmount,
        payment_status: newStatus,
      };

      if (data.payment_method) {
        updateData.payment_method = data.payment_method;
      }

      const updatedSale = await tx.sale.update({
        where: { id: saleId },
        data: updateData
      });

      // 4. Update customer balance
      let newCurrentBalance = sale.customer.current_balance;
      let newAdvanceBalance = sale.customer.advance_balance;

      if (newCurrentBalance >= amountToCollect) {
        newCurrentBalance -= amountToCollect;
      } else {
        const excess = amountToCollect - newCurrentBalance;
        newCurrentBalance = 0;
        newAdvanceBalance += excess;
      }

      await tx.customer.update({
        where: { id: sale.customer_id },
        data: {
          current_balance: newCurrentBalance,
          advance_balance: newAdvanceBalance
        }
      });

      return updatedSale;
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("POST /api/sales/[id]/payment error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
