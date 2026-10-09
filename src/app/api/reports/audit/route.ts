import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import dayjs from "dayjs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const startDate = startDateParam
      ? new Date(startDateParam)
      : dayjs().startOf("month").toDate();

    const endDate = endDateParam
      ? new Date(endDateParam.includes("T") ? endDateParam : `${endDateParam}T23:59:59.999Z`)
      : dayjs().endOf("month").toDate();

    const companyId = (session.user as any)?.company_id;

    // Fetch Sales, Payments and Expenses for this company in date range
    const [sales, payments, expenses, company] = await Promise.all([
      prisma.sale.findMany({
        where: {
          date: { gte: startDate, lte: endDate },
          ...(companyId ? { company_id: companyId } : {}),
        },
        include: {
          customer: { select: { id: true, name: true, phone: true, medical_id: true } },
          user: { select: { id: true, email: true, full_name: true } },
          doctor: { select: { id: true, name: true } },
        },
        orderBy: { date: "desc" },
      }),
      prisma.payment.findMany({
        where: {
          payment_date: { gte: startDate, lte: endDate },
          ...(companyId ? { company_id: companyId } : {}),
        },
        include: {
          customer: { select: { id: true, name: true, phone: true, medical_id: true } },
          sale: { select: { id: true, invoice_number: true, grand_total: true } },
        },
        orderBy: { payment_date: "desc" },
      }),
      prisma.expense.findMany({
        where: {
          date: { gte: startDate, lte: endDate },
          ...(companyId ? { company_id: companyId } : {}),
        },
        include: {
          category: { select: { id: true, name: true } },
          created_by: { select: { id: true, email: true, full_name: true } },
        },
        orderBy: { date: "desc" },
      }),
      companyId
        ? prisma.companySetting.findUnique({
            where: { id: companyId },
            select: { name: true, phone: true, address: true, logo: true },
          })
        : null,
    ]);

    // Financial Metrics Calculation
    const totalInvoices = sales.length;
    const grossSales = sales.reduce((sum, s) => sum + (s.subtotal || 0), 0);
    const totalDiscounts = sales.reduce((sum, s) => sum + (s.discount_amount || 0), 0);
    const netInvoicedSales = sales.reduce((sum, s) => sum + (s.grand_total || 0), 0);
    const invoicedCashCollected = sales.reduce((sum, s) => sum + (s.paid_amount || 0), 0);
    const invoicedDueBalance = sales.reduce((sum, s) => sum + Math.max(0, (s.grand_total || 0) - (s.paid_amount || 0)), 0);

    // Payments / Collections categorization
    const advancePayments = payments.filter((p) => !p.sale_id);
    const invoicePayments = payments.filter((p) => !!p.sale_id);
    const totalAdvanceDeposits = advancePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalPaymentsReceived = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // Total Cash Inflow:
    // If payments table has records, use actual payments received. If payments table is empty (e.g. legacy sales), fallback to invoicedCashCollected + totalAdvanceDeposits
    const totalCashInflow = totalPaymentsReceived > 0 ? totalPaymentsReceived : (invoicedCashCollected + totalAdvanceDeposits);

    // Total Expenses
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalExpenseTxns = expenses.length;

    // Net Operating Cash Balance (Net Cash in Hand)
    const netOperatingCash = totalCashInflow - totalExpenses;

    // Payment Methods Breakdown
    const methodMap: Record<string, { method: string; amount: number; count: number }> = {};
    payments.forEach((p) => {
      const m = p.payment_method || "Cash";
      if (!methodMap[m]) {
        methodMap[m] = { method: m, amount: 0, count: 0 };
      }
      methodMap[m].amount += p.amount;
      methodMap[m].count += 1;
    });
    const paymentMethodBreakdown = Object.values(methodMap).sort((a, b) => b.amount - a.amount);

    // Expense Categories Breakdown
    const catMap: Record<string, { name: string; amount: number; count: number }> = {};
    expenses.forEach((e) => {
      const cName = e.category?.name || "General Expenses";
      if (!catMap[cName]) {
        catMap[cName] = { name: cName, amount: 0, count: 0 };
      }
      catMap[cName].amount += e.amount;
      catMap[cName].count += 1;
    });
    const expenseCategoryBreakdown = Object.values(catMap).sort((a, b) => b.amount - a.amount);

    // Combined Chronological Audit Ledger
    const ledgerEntries: any[] = [];

    // 1. Add Sales to Ledger
    sales.forEach((s) => {
      ledgerEntries.push({
        id: `sale-${s.id}`,
        rawDate: s.date,
        date: s.date,
        type: "SALE",
        ref: s.invoice_number,
        party: s.customer?.name || "Walk-In Patient",
        mrNo: s.customer?.medical_id || "",
        method: s.payment_method || "Cash",
        categoryOrStatus: s.payment_status,
        invoicedAmount: s.grand_total,
        cashIn: s.paid_amount,
        cashOut: 0,
        due: Math.max(0, s.grand_total - s.paid_amount),
        net: s.paid_amount,
        user: s.user?.full_name || s.user?.email || "Staff",
        notes: s.session_remarks || (s.doctor ? `Doctor: ${s.doctor.name}` : ""),
      });
    });

    // 2. Add Standalone Advance Payments (Wallet deposits)
    advancePayments.forEach((p) => {
      ledgerEntries.push({
        id: `adv-${p.id}`,
        rawDate: p.payment_date,
        date: p.payment_date,
        type: "ADVANCE",
        ref: `ADV-${p.id.slice(0, 8).toUpperCase()}`,
        party: p.customer?.name || "Patient",
        mrNo: p.customer?.medical_id || "",
        method: p.payment_method || "Cash",
        categoryOrStatus: "Wallet Deposit",
        invoicedAmount: 0,
        cashIn: p.amount,
        cashOut: 0,
        due: 0,
        net: p.amount,
        user: p.received_by || "Staff",
        notes: p.notes || "Advance payment deposited into patient wallet",
      });
    });

    // 3. Add Expenses
    expenses.forEach((e) => {
      ledgerEntries.push({
        id: `exp-${e.id}`,
        rawDate: e.date,
        date: e.date,
        type: "EXPENSE",
        ref: e.reference_no || `EXP-${e.id.slice(0, 8).toUpperCase()}`,
        party: e.payee || e.title,
        mrNo: "",
        method: e.payment_method || "Cash",
        categoryOrStatus: e.category?.name || "Expense",
        invoicedAmount: 0,
        cashIn: 0,
        cashOut: e.amount,
        due: 0,
        net: -e.amount,
        user: e.created_by?.full_name || e.created_by?.email || "Staff",
        notes: `${e.title}${e.notes ? ` • ${e.notes}` : ""}`,
      });
    });

    // Sort ledger by date descending
    ledgerEntries.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

    return NextResponse.json({
      startDate: dayjs(startDate).format("YYYY-MM-DD"),
      endDate: dayjs(endDate).format("YYYY-MM-DD"),
      clinic: company,
      summary: {
        totalInvoices,
        grossSales,
        totalDiscounts,
        netInvoicedSales,
        invoicedCashCollected,
        invoicedDueBalance,
        totalAdvanceDeposits,
        totalAdvanceTxns: advancePayments.length,
        totalCashInflow,
        totalExpenses,
        totalExpenseTxns,
        netOperatingCash,
      },
      paymentMethodBreakdown,
      expenseCategoryBreakdown,
      ledgerEntries,
    });
  } catch (error: any) {
    console.error("GET /api/reports/audit error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate audit report" }, { status: 500 });
  }
}
