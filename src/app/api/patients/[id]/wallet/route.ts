import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any)?.role;
  if (!["Admin", "Manager", "Cashier"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const rawId = params?.id ? decodeURIComponent(params.id).trim() : "";
    if (!rawId) {
      return NextResponse.json({ error: "Invalid patient ID" }, { status: 400 });
    }

    const data = await request.json();
    const depositAmount = parseFloat(data.amount);
    const paymentMethod = data.payment_method || "Cash";

    if (isNaN(depositAmount) || depositAmount <= 0) {
      return NextResponse.json({ error: "Invalid advance deposit amount" }, { status: 400 });
    }

    const companyId = (session.user as any)?.company_id;
    const patient = await prisma.customer.findUnique({ where: { id: rawId } });
    if (!patient || (companyId && patient.company_id && patient.company_id !== companyId)) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const sessionUserEmail = (session.user as any)?.email || (session.user as any)?.name || (session.user as any)?.id;

    // 1. Record in Payment Ledger
    await prisma.payment.create({
      data: {
        sale_id: null,
        customer_id: rawId,
        amount: depositAmount,
        payment_method: paymentMethod,
        payment_date: new Date(),
        received_by: sessionUserEmail,
        notes: data.notes || "Advance deposit into patient wallet",
        ...(companyId ? { company_id: companyId } : {}),
      },
    });

    // 2. Increment advance balance
    const updated = await prisma.customer.update({
      where: { id: rawId },
      data: {
        advance_balance: {
          increment: depositAmount,
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("POST /api/patients/[id]/wallet error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
