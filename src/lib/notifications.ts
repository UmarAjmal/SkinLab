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
  | "SYSTEM_ALERT";

export type NotificationSeverity = "INFO" | "WARNING" | "URGENT" | "SUCCESS";

export interface CreateNotificationParams {
  title: string;
  message: string;
  type: NotificationType;
  severity?: NotificationSeverity;
  targetRole?: string | null; // "Admin" | "Manager" | "Doctor" | "Cashier" | null
  userId?: string | null;
  linkUrl?: string | null;
  metadata?: any;
}

/**
 * Creates a notification in the database for a specific role or user
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        title: params.title,
        message: params.message,
        type: params.type,
        severity: params.severity || "INFO",
        target_role: params.targetRole || null,
        user_id: params.userId || null,
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
      const existingAlert = await prisma.notification.findFirst({
        where: {
          type: "OVERDUE_DUES",
          link_url: { contains: sale.invoice_number },
          created_at: { gte: sevenDaysAgo },
        },
      });

      if (!existingAlert) {
        await prisma.notification.create({
          data: {
            title: `Overdue Dues Alert (Pending ${daysPending} Days)`,
            message: `Invoice ${sale.invoice_number} for patient ${sale.customer?.name || "Patient"} has an outstanding balance of Rs. ${balance.toFixed(2)}.`,
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
