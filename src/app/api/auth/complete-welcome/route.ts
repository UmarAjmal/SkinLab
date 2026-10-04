import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: { is_first_login: false },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Complete Welcome API Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update onboarding status" },
      { status: 500 }
    );
  }
}
