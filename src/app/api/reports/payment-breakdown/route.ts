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

    const payments = await prisma.payment.findMany({
      where: {
        payment_date: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
        amount: { gt: 0 },
      },
    });

    const breakdown: Record<string, number> = {
      Cash: 0,
      Card: 0,
      Credit: 0,
      Bank_Transfer: 0,
      Other: 0,
    };

    for (const p of payments) {
      const method = (p.payment_method || "Other").replace(/\s+/g, "_");
      if (breakdown.hasOwnProperty(method)) {
        breakdown[method] += p.amount;
      } else {
        breakdown[p.payment_method || "Other"] = (breakdown[p.payment_method || "Other"] || 0) + p.amount;
      }
    }

    const result = Object.entries(breakdown)
      .map(([method, amount]) => ({
        method: method.replace(/_/g, " "),
        amount,
      }))
      .filter((m) => m.amount > 0);

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/reports/payment-breakdown error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
