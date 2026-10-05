import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import dayjs from "dayjs";

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const categoryId = searchParams.get("categoryId") || searchParams.get("category_id");

    const startDate = startDateParam
      ? new Date(startDateParam)
      : dayjs().startOf("month").toDate();
    const endDate = endDateParam
      ? new Date(endDateParam)
      : dayjs().endOf("month").toDate();

    const companyId = (session.user as any)?.company_id;

    let whereClause: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
      ...(companyId ? { company_id: companyId } : {}),
    };

    if (categoryId && categoryId !== "ALL") {
      whereClause.category_id = categoryId;
    }

    // Parallel fetch
    const [expenses, salesPayments, totalSalesAgg, allCategories] = await Promise.all([
      prisma.expense.findMany({
        where: whereClause,
        orderBy: { date: "desc" },
        include: {
          category: true,
          created_by: {
            select: { id: true, email: true },
          },
        },
      }),
      // Total actual cash/payments collected in same date window
      prisma.payment.aggregate({
        where: {
          payment_date: {
            gte: startDate,
            lte: endDate,
          },
          ...(companyId ? { company_id: companyId } : {}),
        },
        _sum: { amount: true },
      }),
      // Invoiced Sales in same date window
      prisma.sale.aggregate({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
          ...(companyId ? { company_id: companyId } : {}),
        },
        _sum: { grand_total: true, paid_amount: true },
      }),
      prisma.expenseCategory.findMany({
        where: companyId ? { company_id: companyId } : {},
        orderBy: { name: "asc" },
      }),
    ]);

    const totalExpenseAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalTransactions = expenses.length;
    const totalCollections = salesPayments._sum.amount || totalSalesAgg._sum.paid_amount || 0;
    const totalInvoicedSales = totalSalesAgg._sum.grand_total || 0;
    const netOperatingCash = totalCollections - totalExpenseAmount;

    // 1. Category Breakdown
    const categoryMap: Record<
      string,
      { id: string; name: string; amount: number; count: number }
    > = {};

    expenses.forEach((exp) => {
      const cId = exp.category?.id || "other";
      const cName = exp.category?.name || "Uncategorized";
      if (!categoryMap[cId]) {
        categoryMap[cId] = { id: cId, name: cName, amount: 0, count: 0 };
      }
      categoryMap[cId].amount += exp.amount;
      categoryMap[cId].count += 1;
    });

    const categoryBreakdown = Object.values(categoryMap)
      .map((c) => ({
        ...c,
        percentage:
          totalExpenseAmount > 0
            ? Number(((c.amount / totalExpenseAmount) * 100).toFixed(1))
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // 2. Payment Method Breakdown
    const methodMap: Record<string, { method: string; amount: number; count: number }> = {};
    expenses.forEach((exp) => {
      const m = exp.payment_method || "Cash";
      if (!methodMap[m]) {
        methodMap[m] = { method: m, amount: 0, count: 0 };
      }
      methodMap[m].amount += exp.amount;
      methodMap[m].count += 1;
    });

    const paymentMethodBreakdown = Object.values(methodMap)
      .map((m) => ({
        ...m,
        percentage:
          totalExpenseAmount > 0
            ? Number(((m.amount / totalExpenseAmount) * 100).toFixed(1))
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // 3. Monthly Trend (group by YYYY-MM)
    const monthlyMap: Record<string, { monthKey: string; monthLabel: string; amount: number; count: number }> = {};
    expenses.forEach((exp) => {
      const mKey = dayjs(exp.date).format("YYYY-MM");
      const mLabel = dayjs(exp.date).format("MMM YYYY");
      if (!monthlyMap[mKey]) {
        monthlyMap[mKey] = { monthKey: mKey, monthLabel: mLabel, amount: 0, count: 0 };
      }
      monthlyMap[mKey].amount += exp.amount;
      monthlyMap[mKey].count += 1;
    });

    const monthlyTrend = Object.values(monthlyMap).sort((a, b) => a.monthKey.localeCompare(b.monthKey));

    // 4. Daily Trend
    const dailyMap: Record<string, { date: string; amount: number; count: number }> = {};
    expenses.forEach((exp) => {
      const d = dayjs(exp.date).format("YYYY-MM-DD");
      if (!dailyMap[d]) {
        dailyMap[d] = { date: d, amount: 0, count: 0 };
      }
      dailyMap[d].amount += exp.amount;
      dailyMap[d].count += 1;
    });

    const dailyTrend = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    // 5. Top 5 Largest Expenses
    const topExpenses = [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 5);

    return NextResponse.json({
      summary: {
        totalExpenseAmount,
        totalTransactions,
        totalCollections,
        totalInvoicedSales,
        netOperatingCash,
        averageExpensePerTx:
          totalTransactions > 0
            ? Number((totalExpenseAmount / totalTransactions).toFixed(2))
            : 0,
        startDate: dayjs(startDate).format("YYYY-MM-DD"),
        endDate: dayjs(endDate).format("YYYY-MM-DD"),
      },
      categoryBreakdown,
      paymentMethodBreakdown,
      monthlyTrend,
      dailyTrend,
      topExpenses,
      categories: allCategories,
      expenses,
    });
  } catch (error: any) {
    console.error("GET /api/reports/expenses error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate expense report" }, { status: 500 });
  }
}
