import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = params;
    const updated = await prisma.notification.update({
      where: { id },
      data: { is_read: true },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT /api/notifications/[id]/read error:", error);
    return NextResponse.json({ error: error.message || "Failed to mark notification as read" }, { status: 500 });
  }
}
