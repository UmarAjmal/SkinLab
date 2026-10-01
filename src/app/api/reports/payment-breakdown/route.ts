import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const sales = await prisma.sale.findMany({
      where: {
        date: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
        paid_amount: { gt: 0 } // Only include sales where some payment was made
      }
    });

    const breakdown = {
      Cash: 0,
      Card: 0,
      Credit: 0,
      Other: 0,
    };

    for (const sale of sales) {
      const method = sale.payment_method || "Other";
      if (breakdown.hasOwnProperty(method)) {
        breakdown[method as keyof typeof breakdown] += sale.paid_amount;
      } else {
        breakdown.Other += sale.paid_amount;
      }
    }

    const result = Object.entries(breakdown).map(([method, amount]) => ({
      method,
      amount
    })).filter(m => m.amount > 0);

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/reports/payment-breakdown error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
