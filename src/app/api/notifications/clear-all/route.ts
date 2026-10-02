import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function DELETE() {
  const session = await getServerSession();
  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userRole = (session.user as any).role || "";
    const userId = (session.user as any).id;

    let whereCondition: any = {};

    if (userRole !== "Admin") {
      whereCondition = {
        OR: [
          { target_role: userRole },
          { user_id: userId },
        ],
      };
    }

    await prisma.notification.deleteMany({
      where: whereCondition,
    });

    return NextResponse.json({ success: true, message: "Notifications cleared" });
  } catch (error: any) {
    console.error("DELETE /api/notifications/clear-all error:", error);
    return NextResponse.json({ error: error.message || "Failed to clear notifications" }, { status: 500 });
  }
}
