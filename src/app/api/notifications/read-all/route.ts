import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function PUT() {
  const session = await getServerSession();
  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userRole = (session.user as any).role || "";
    const userId = (session.user as any).id;

    let whereCondition: any = { is_read: false };

    if (userRole !== "Admin") {
      whereCondition.OR = [
        { target_role: null },
        { target_role: userRole },
        { user_id: userId },
      ];
    }

    await prisma.notification.updateMany({
      where: whereCondition,
      data: { is_read: true },
    });

    return NextResponse.json({ success: true, message: "All notifications marked as read" });
  } catch (error: any) {
    console.error("PUT /api/notifications/read-all error:", error);
    return NextResponse.json({ error: error.message || "Failed to mark all as read" }, { status: 500 });
  }
}
