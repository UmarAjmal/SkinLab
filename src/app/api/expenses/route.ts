import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import dayjs from "dayjs";


export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const categoryId = searchParams.get("categoryId") || searchParams.get("category_id");
    const paymentMethod = searchParams.get("paymentMethod") || searchParams.get("payment_method");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const month = searchParams.get("month"); // Format: YYYY-MM
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 200;

    const companyId = (session.user as any)?.company_id;
    let whereClause: any = {};
    if (companyId) {
      whereClause.company_id = companyId;
    }

    // Date range filter
    if (month) {
      const startOfMonth = dayjs(month).startOf("month").toDate();
      const endOfMonth = dayjs(month).endOf("month").toDate();
      whereClause.date = {
        gte: startOfMonth,
        lte: endOfMonth,
      };
    } else if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      whereClause.date = {
        gte: new Date(startDate),
      };
    }

    // Category filter
    if (categoryId && categoryId !== "ALL") {
      whereClause.category_id = categoryId;
    }

    // Payment method filter
    if (paymentMethod && paymentMethod !== "ALL") {
      whereClause.payment_method = paymentMethod;
    }

    // Search query
    if (search && search.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { payee: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
        { reference_no: { contains: q, mode: "insensitive" } },
      ];
    }

    // Today's range for quick stats
    const todayStart = dayjs().startOf("day").toDate();
    const todayEnd = dayjs().endOf("day").toDate();
    const currentMonthStart = dayjs().startOf("month").toDate();
    const currentMonthEnd = dayjs().endOf("month").toDate();

    const [expenses, totalAgg, todayAgg, monthAgg, allCategories] = await Promise.all([
      prisma.expense.findMany({
        where: whereClause,
        orderBy: { date: "desc" },
        take: limit,
        include: {
          category: {
            select: { id: true, name: true },
          },
          created_by: {
            select: { id: true, email: true },
          },
        },
      }),
      prisma.expense.aggregate({
        where: whereClause,
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.expense.aggregate({
        where: {
          ...(companyId ? { company_id: companyId } : {}),
          date: { gte: todayStart, lte: todayEnd },
        },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: {
          ...(companyId ? { company_id: companyId } : {}),
          date: { gte: currentMonthStart, lte: currentMonthEnd },
        },
        _sum: { amount: true },
      }),
      prisma.expenseCategory.findMany({
        where: companyId ? { company_id: companyId } : {},
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    // Calculate Category Breakdown for the filtered items
    const categoryBreakdown: Record<string, { name: string; amount: number; count: number }> = {};
    const paymentMethodBreakdown: Record<string, number> = {};

    expenses.forEach((exp: any) => {
      const catName = exp.category?.name || "Uncategorized";
      if (!categoryBreakdown[catName]) {
        categoryBreakdown[catName] = { name: catName, amount: 0, count: 0 };
      }
      categoryBreakdown[catName].amount += exp.amount;
      categoryBreakdown[catName].count += 1;

      const method = exp.payment_method || "Cash";
      paymentMethodBreakdown[method] = (paymentMethodBreakdown[method] || 0) + exp.amount;
    });

    return NextResponse.json({
      expenses,
      categories: allCategories,
      stats: {
        totalAmount: totalAgg._sum.amount || 0,
        totalCount: totalAgg._count.id || 0,
        todayAmount: todayAgg._sum.amount || 0,
        thisMonthAmount: monthAgg._sum.amount || 0,
        categoryBreakdown: Object.values(categoryBreakdown).sort((a, b) => b.amount - a.amount),
        paymentMethodBreakdown,
      },
    });
  } catch (error: any) {
    console.error("GET /api/expenses error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session || !(session.user as any)?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any)?.role;
  if (!["Admin", "Manager", "Cashier"].includes(role)) {
    return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
  }

  try {
    const data = await request.json();
    const sessionUserId = (session.user as any).id;

    const title = data.title ? String(data.title).trim() : "";
    const amount = Number(data.amount);
    const categoryId = data.category_id || data.categoryId;
    const date = data.date ? new Date(data.date) : new Date();
    const paymentMethod = data.payment_method || data.paymentMethod || "Cash";
    const payee = data.payee ? String(data.payee).trim() : null;
    const notes = data.notes ? String(data.notes).trim() : null;
    const referenceNo = data.reference_no || data.referenceNo ? String(data.reference_no || data.referenceNo).trim() : null;
    const receiptUrl = data.receipt_url || data.receiptUrl || null;

    if (!title) {
      return NextResponse.json({ error: "Expense description/title is required" }, { status: 400 });
    }

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Please provide a valid expense amount greater than 0" }, { status: 400 });
    }

    if (!categoryId) {
      return NextResponse.json({ error: "Please select an expense category" }, { status: 400 });
    }

    const categoryExists = await prisma.expenseCategory.findUnique({
      where: { id: categoryId },
    });

    if (!categoryExists) {
      return NextResponse.json({ error: "Selected category does not exist" }, { status: 400 });
    }

    // Verify user exists in database
    let validUserId = sessionUserId;
    const userExists = await prisma.user.findUnique({ where: { id: sessionUserId } });
    if (!userExists) {
      const fallbackUser = await prisma.user.findFirst({ where: { is_active: true } });
      if (fallbackUser) validUserId = fallbackUser.id;
    }

    const companyId = (session.user as any)?.company_id;

    const created = await prisma.expense.create({
      data: {
        title,
        amount,
        category_id: categoryId,
        date,
        payment_method: paymentMethod,
        payee,
        notes,
        reference_no: referenceNo,
        receipt_url: receiptUrl,
        created_by_id: validUserId,
        ...(companyId ? { company_id: companyId } : {}),
      },
      include: {
        category: true,
        created_by: {
          select: { id: true, email: true },
        },
      },
    });

    // Trigger Notification for New Expense
    createNotification({
      title: `New Expense: PKR ${amount.toFixed(2)}`,
      message: `'${title}' recorded under category ${created.category?.name || "General"}${payee ? ` (Paid to: ${payee})` : ""}.`,
      type: "EXPENSE_CREATED",
      severity: "INFO",
      targetRole: "Admin",
      linkUrl: `/dashboard/expenses`,
      companyId: companyId || undefined,
    }).catch(console.error);

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/expenses error:", error);
    return NextResponse.json({ error: error.message || "Failed to record expense" }, { status: 500 });
  }
}
