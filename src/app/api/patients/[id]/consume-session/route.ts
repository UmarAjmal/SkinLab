import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rawId = params?.id ? decodeURIComponent(params.id).trim() : "";
    if (!rawId) {
      return NextResponse.json({ error: "Invalid patient ID" }, { status: 400 });
    }

    const { sale_item_id, notes } = await request.json();

    if (!sale_item_id) {
      return NextResponse.json({ error: "Missing sale_item_id" }, { status: 400 });
    }

    const item = await prisma.saleItem.findUnique({
      where: { id: sale_item_id },
      include: { sale: true, product: true },
    });

    if (!item) {
      return NextResponse.json({ error: "Treatment session item not found" }, { status: 404 });
    }

    if (item.sale.customer_id !== rawId) {
      return NextResponse.json({ error: "Treatment does not belong to this patient" }, { status: 403 });
    }

    const maxAllowed = (item.sessions_allowed || 1) * (item.quantity || 1);
    if ((item.sessions_consumed || 0) >= maxAllowed) {
      return NextResponse.json({ error: "All sessions have already been consumed for this package/treatment" }, { status: 400 });
    }

    const updatedItem = await prisma.saleItem.update({
      where: { id: sale_item_id },
      data: {
        sessions_consumed: {
          increment: 1,
        },
      },
    });

    if (notes && notes.trim()) {
      const existingRemarks = item.sale.session_remarks || "";
      const updatedRemarks = existingRemarks
        ? `${existingRemarks} | [${new Date().toLocaleDateString()}]: ${notes.trim()}`
        : `[${new Date().toLocaleDateString()}]: ${notes.trim()}`;

      await prisma.sale.update({
        where: { id: item.sale_id },
        data: { session_remarks: updatedRemarks },
      });
    }

    return NextResponse.json({ success: true, item: updatedItem });
  } catch (error: any) {
    console.error("POST /api/patients/[id]/consume-session error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
