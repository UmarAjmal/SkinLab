import { prisma } from "@/lib/prisma";
import dayjs from "dayjs";

export type NotificationType =
  | "SALE_CREATED"
  | "SALE_UPDATED"
  | "EXPENSE_CREATED"
  | "EXPENSE_UPDATED"
  | "REFUND_PROCESSED"
  | "OVERDUE_DUES"
  | "PAYMENT_RECEIVED"
  | "DAILY_CLOSING_SUMMARY"
  | "MONTHLY_CLOSING_SUMMARY"
  | "YEARLY_CLOSING_SUMMARY"
  | "SYSTEM_ALERT";

export type NotificationSeverity = "INFO" | "WARNING" | "URGENT" | "SUCCESS";

export interface CreateNotificationParams {
  title: string;
  message: string;
  type: NotificationType;
  severity?: NotificationSeverity;
  targetRole?: string | null; // "Admin" | "Manager" | "Doctor" | "Cashier" | null
  userId?: string | null;
  companyId?: string | null;
  linkUrl?: string | null;
  metadata?: any;
}

/**
 * Creates a notification in the database for a specific role or user
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await (prisma as any).notification.create({
      data: {
        title: params.title,
        message: params.message,
        type: params.type,
        severity: params.severity || "INFO",
        target_role: params.targetRole || null,
        user_id: params.userId || null,
        company_id: params.companyId || null,
        link_url: params.linkUrl || null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
      },
    });
    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}

/**
 * Checks for sales with dues pending for more than 15 days
 * and generates automated alerts for Admin and Manager roles.
 */
export async function checkAndCreateOverdueDuesAlerts() {
  try {
    const fifteenDaysAgo = dayjs().subtract(15, "days").toDate();
    const sevenDaysAgo = dayjs().subtract(7, "days").toDate();

    // Find sales with unpaid/partial balances created >= 15 days ago
    const overdueSales = await prisma.sale.findMany({
      where: {
        payment_status: { in: ["DUE", "PARTIAL"] },
        date: { lte: fifteenDaysAgo },
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
      },
      take: 25,
    });

    for (const sale of overdueSales) {
      const balance = Math.max(0, sale.grand_total - (sale.paid_amount || 0));
      if (balance <= 0) continue;

      const daysPending = dayjs().diff(dayjs(sale.date), "day");

      // Check if we already alerted about this invoice in the last 7 days
      const existingAlert = await (prisma as any).notification.findFirst({
        where: {
          type: "OVERDUE_DUES",
          link_url: { contains: sale.invoice_number },
          created_at: { gte: sevenDaysAgo },
        },
      });

      if (!existingAlert) {
        await (prisma as any).notification.create({
          data: {
            title: `Overdue Dues Alert (Pending ${daysPending} Days)`,
            message: `Invoice ${sale.invoice_number} for patient ${sale.customer?.name || "Patient"} has an outstanding balance ofPKR ${balance.toFixed(2)}.`,
            type: "OVERDUE_DUES",
            severity: "URGENT",
            target_role: "Admin",
            link_url: `/dashboard/sales?search=${sale.invoice_number}`,
            metadata: JSON.stringify({
              invoice_number: sale.invoice_number,
              customer_name: sale.customer?.name,
              balance_due: balance,
              days_pending: daysPending,
            }),
          },
        });
      }
    }
  } catch (error) {
    console.error("Failed to check overdue dues alerts:", error);
  }
}

/**
 * Checks and creates Day-End Closing Notification for yesterday / today evening
 */
export async function checkAndCreateDailyClosingNotification() {
  try {
    const now = dayjs();
    const yesterday = now.subtract(1, "day");
    const yStart = yesterday.startOf("day").toDate();
    const yEnd = yesterday.endOf("day").toDate();
    const yKey = yesterday.format("YYYY-MM-DD");

    const existingDaily = await (prisma as any).notification.findFirst({
      where: {
        type: "DAILY_CLOSING_SUMMARY",
        link_url: { contains: yKey },
      },
    });

    if (!existingDaily) {
      // Calculate yesterday's stats
      const [salesAgg, paymentsAgg, expensesAgg, patientsCount] = await Promise.all([
        prisma.sale.aggregate({
          where: { date: { gte: yStart, lte: yEnd } },
          _sum: { grand_total: true },
          _count: { id: true },
        }),
        (prisma as any).payment.aggregate({
          where: { payment_date: { gte: yStart, lte: yEnd } },
          _sum: { amount: true },
        }),
        (prisma as any).expense.aggregate({
          where: { date: { gte: yStart, lte: yEnd } },
          _sum: { amount: true },
        }),
        prisma.sale.findMany({
          where: { date: { gte: yStart, lte: yEnd } },
          select: { customer_id: true },
          distinct: ["customer_id"],
        }),
      ]);

      const totalSales = salesAgg._sum.grand_total || 0;
      const totalPayments = paymentsAgg._sum.amount || 0;
      const totalExpenses = expensesAgg._sum.amount || 0;
      const netCashflow = totalPayments - totalExpenses;
      const invoiceCount = salesAgg._count.id || 0;

      // Only generate if there was activity yesterday
      if (totalSales > 0 || totalPayments > 0 || totalExpenses > 0) {
        await (prisma as any).notification.create({
          data: {
            title: `📊 Daily Closing Summary (${yesterday.format("DD MMM YYYY")})`,
            message: `Sales:PKR ${totalSales.toLocaleString()} | Collections:PKR ${totalPayments.toLocaleString()} | Expenses:PKR ${totalExpenses.toLocaleString()} | Net Cash:PKR ${netCashflow.toLocaleString()} (${patientsCount.length} Patients, ${invoiceCount} Invoices)`,
            type: "DAILY_CLOSING_SUMMARY",
            severity: "SUCCESS",
            target_role: "Admin",
            link_url: `/dashboard/reports/daily-sales?date=${yKey}`,
            metadata: JSON.stringify({
              date: yKey,
              sales: totalSales,
              payments: totalPayments,
              expenses: totalExpenses,
              net_cashflow: netCashflow,
              patients: patientsCount.length,
            }),
          },
        });

        // Also send to Manager
        await (prisma as any).notification.create({
          data: {
            title: `📊 Daily Sales Summary (${yesterday.format("DD MMM YYYY")})`,
            message: `Clinic recordedPKR ${totalSales.toLocaleString()} sales withPKR ${totalPayments.toLocaleString()} collected across ${patientsCount.length} patients.`,
            type: "DAILY_CLOSING_SUMMARY",
            severity: "INFO",
            target_role: "Manager",
            link_url: `/dashboard/reports/daily-sales?date=${yKey}`,
          },
        });
      }
    }
  } catch (error) {
    console.error("Failed to check daily closing notifications:", error);
  }
}

/**
 * Checks and creates Month-End Summary Notification
 */
export async function checkAndCreateMonthlyClosingNotification() {
  try {
    const now = dayjs();
    const lastMonth = now.subtract(1, "month");
    const lmStart = lastMonth.startOf("month").toDate();
    const lmEnd = lastMonth.endOf("month").toDate();
    const mKey = lastMonth.format("YYYY-MM");

    const existingMonthly = await (prisma as any).notification.findFirst({
      where: {
        type: "MONTHLY_CLOSING_SUMMARY",
        link_url: { contains: mKey },
      },
    });

    if (!existingMonthly) {
      const [salesAgg, paymentsAgg, expensesAgg, invoicesCount] = await Promise.all([
        prisma.sale.aggregate({
          where: { date: { gte: lmStart, lte: lmEnd } },
          _sum: { grand_total: true },
          _count: { id: true },
        }),
        (prisma as any).payment.aggregate({
          where: { payment_date: { gte: lmStart, lte: lmEnd } },
          _sum: { amount: true },
        }),
        (prisma as any).expense.aggregate({
          where: { date: { gte: lmStart, lte: lmEnd } },
          _sum: { amount: true },
        }),
        prisma.sale.count({
          where: { date: { gte: lmStart, lte: lmEnd } },
        }),
      ]);

      const totalSales = salesAgg._sum.grand_total || 0;
      const totalExpenses = expensesAgg._sum.amount || 0;
      const totalPayments = paymentsAgg._sum.amount || 0;
      const netProfit = totalSales - totalExpenses;

      if (totalSales > 0 || totalExpenses > 0) {
        await (prisma as any).notification.create({
          data: {
            title: `📈 Monthly Financial Summary (${lastMonth.format("MMMM YYYY")})`,
            message: `Monthly Revenue:PKR ${totalSales.toLocaleString()} | Expenses:PKR ${totalExpenses.toLocaleString()} | Net Profit:PKR ${netProfit.toLocaleString()} (${invoicesCount} Invoices, Collected:PKR ${totalPayments.toLocaleString()})`,
            type: "MONTHLY_CLOSING_SUMMARY",
            severity: "SUCCESS",
            target_role: "Admin",
            link_url: `/dashboard/reports/monthly-sales?month=${mKey}`,
            metadata: JSON.stringify({
              month: mKey,
              sales: totalSales,
              expenses: totalExpenses,
              net_profit: netProfit,
              invoices: invoicesCount,
            }),
          },
        });
      }
    }
  } catch (error) {
    console.error("Failed to check monthly closing notifications:", error);
  }
}

/**
 * Master scanner runner that triggers automated background clinic checks idempotently
 */
export async function runAutomatedClinicScanners() {
  await Promise.allSettled([
    checkAndCreateOverdueDuesAlerts(),
    checkAndCreateDailyClosingNotification(),
    checkAndCreateMonthlyClosingNotification(),
  ]);
}
