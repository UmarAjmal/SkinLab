import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import dayjs from "dayjs";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireRole(["Admin", "Manager", "Doctor"]);

    const todayStart = dayjs().startOf("day").toDate();
    const todayEnd = dayjs().endOf("day").toDate();
    const thirtyDaysAgo = dayjs().subtract(30, "days").startOf("day").toDate();

    // Execute queries concurrently in parallel with Promise.all
    const [
      todaySales,
      todayPayments,
      patientsTodayQuery,
      activeDuesSales,
      recentSales,
      recentItems,
      recentTransactions
    ] = await Promise.all([
      // 1. Today's Invoiced Sales
      prisma.sale.aggregate({
        _sum: { grand_total: true },
        where: {
          date: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),

      // 1b. Today's Total Cash / Payment Collections
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          payment_date: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),

      // 2. Patients Treated Today
      prisma.sale.findMany({
        where: {
          date: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        select: { customer_id: true },
        distinct: ['customer_id'],
      }),

      // 3. Active/Pending Dues
      prisma.sale.findMany({
        where: {
          payment_status: { in: ["DUE", "PARTIAL"] },
        },
        select: { grand_total: true, paid_amount: true },
      }),

      // 4. Revenue Trend (last 30 days)
      prisma.sale.findMany({
        where: {
          date: { gte: thirtyDaysAgo },
        },
        select: { date: true, grand_total: true },
      }),

      // 5. Top Treatments (last 30 days)
      prisma.saleItem.findMany({
        where: {
          sale: {
            date: { gte: thirtyDaysAgo },
          },
        },
        select: {
          product_id: true,
          quantity: true,
          total_price: true,
          product: {
            select: { name: true },
          },
        },
      }),

      // 6. Recent Transactions (last 10)
      prisma.sale.findMany({
        take: 10,
        orderBy: { date: "desc" },
        include: {
          customer: { select: { name: true, phone: true } },
          doctor: { select: { name: true } },
          user: { select: { email: true } },
          items: {
            take: 5,
            include: {
              product: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    const todayRevenue = todayPayments._sum.amount || todaySales._sum.grand_total || 0;
    const todayInvoicedSales = todaySales._sum.grand_total || 0;
    const todayCollected = todayPayments._sum.amount || 0;
    const patientsTreatedToday = patientsTodayQuery.length;
    const activeDues = activeDuesSales.reduce(
      (acc: number, sale: { grand_total: number; paid_amount: number | null }) => acc + (sale.grand_total - (sale.paid_amount || 0)),
      0
    );

    // Calculate revenue trend
    const revenueMap: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = dayjs().subtract(i, "days").format("MMM DD");
      revenueMap[d] = 0;
    }

    recentSales.forEach((sale: { date: Date; grand_total: number }) => {
      const d = dayjs(sale.date).format("MMM DD");
      if (revenueMap[d] !== undefined) {
        revenueMap[d] += sale.grand_total;
      }
    });

    const revenueTrend = Object.keys(revenueMap).map((date) => ({
      date,
      revenue: revenueMap[date],
    }));

    // Calculate top treatments
    const treatmentsMap: Record<string, { name: string; count: number; revenue: number }> = {};
    recentItems.forEach((item: any) => {
      if (!item.product) return;
      const pid = item.product_id;
      if (!treatmentsMap[pid]) {
        treatmentsMap[pid] = { name: item.product.name, count: 0, revenue: 0 };
      }
      treatmentsMap[pid].count += item.quantity;
      treatmentsMap[pid].revenue += item.total_price;
    });

    const topTreatments = Object.values(treatmentsMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return NextResponse.json({
      todayRevenue,
      patientsTreatedToday,
      activeDues,
      revenueTrend,
      topTreatments,
      recentTransactions,
    });
  } catch (error: any) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
