import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { runAutomatedClinicScanners } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userRole = (session.user as any).role || "";
    const userId = (session.user as any).id;

    // Trigger automated background scans (closing summaries, overdue dues, low stock)
    runAutomatedClinicScanners().catch((err) => console.error("Error in clinic background scans:", err));

    // Build RBAC Notification where condition
    let whereCondition: any = {};

    if (userRole === "Admin") {
      // Admin sees everything
      whereCondition = {};
    } else if (userRole === "Manager") {
      whereCondition = {
        OR: [
          { target_role: null },
          { target_role: "Manager" },
          { target_role: "Admin" },
          { user_id: userId },
        ],
      };
    } else if (userRole === "Doctor") {
      whereCondition = {
        OR: [
          { target_role: null },
          { target_role: "Doctor" },
          { user_id: userId },
        ],
      };
    } else if (userRole === "Cashier") {
      whereCondition = {
        OR: [
          { target_role: null },
          { target_role: "Cashier" },
          { user_id: userId },
        ],
      };
    } else {
      whereCondition = {
        OR: [{ target_role: null }, { user_id: userId }],
      };
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereCondition,
        orderBy: { created_at: "desc" },
        take: 50,
      }),
      prisma.notification.count({
        where: {
          ...whereCondition,
          is_read: false,
        },
      }),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch notifications" }, { status: 500 });
  }
}
