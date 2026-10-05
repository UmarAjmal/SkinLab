import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const companyId = (session.user as any)?.company_id;
    const companyWhere = companyId ? { company_id: companyId } : {};

    // Generate Invoice Number based on company sales count
    const totalSales = await prisma.sale.count({ where: companyWhere });
    const nextInvoiceNumber = `INV-${(totalSales + 1).toString().padStart(4, "0")}`;

    // Generate Token based on today's sales
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const salesToday = await prisma.sale.count({
      where: {
        ...companyWhere,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const nextToken = `P-${(salesToday + 1).toString().padStart(2, "0")}`;

    return NextResponse.json({ invoiceNumber: nextInvoiceNumber, token: nextToken });
  } catch (error) {
    console.error("GET /api/sales/next-invoice error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
