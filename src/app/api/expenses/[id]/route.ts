import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { hasModulePermission } from "@/lib/permissions";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = params;
    const companyId = (session.user as any)?.company_id;
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        category: true,
        created_by: {
          select: { id: true, email: true },
        },
      },
    });

    if (!expense || (companyId && expense.company_id && expense.company_id !== companyId)) {
      return NextResponse.json({ error: "Expense record not found" }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch (error: any) {
    console.error("GET /api/expenses/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch expense" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const canWrite = await hasModulePermission(session, "expenses", "write", ["Admin", "Manager", "Cashier"]);
  if (!canWrite) {
    return NextResponse.json({ error: "Forbidden: insufficient permissions to edit expenses" }, { status: 403 });
  }

  try {
    const { id } = params;
    const companyId = (session.user as any)?.company_id;
    const data = await request.json();

    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing || (companyId && existing.company_id && existing.company_id !== companyId)) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const title = data.title !== undefined ? String(data.title).trim() : existing.title;
    const amount = data.amount !== undefined ? Number(data.amount) : existing.amount;
    const categoryId = data.category_id || data.categoryId || existing.category_id;
    const date = data.date ? new Date(data.date) : existing.date;
    const paymentMethod = data.payment_method || data.paymentMethod || existing.payment_method;
    const payee = data.payee !== undefined ? (data.payee ? String(data.payee).trim() : null) : existing.payee;
    const notes = data.notes !== undefined ? (data.notes ? String(data.notes).trim() : null) : existing.notes;
    const referenceNo = data.reference_no !== undefined || data.referenceNo !== undefined
      ? (data.reference_no || data.referenceNo ? String(data.reference_no || data.referenceNo).trim() : null)
      : existing.reference_no;

    if (!title) {
      return NextResponse.json({ error: "Expense title is required" }, { status: 400 });
    }

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 });
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        title,
        amount,
        category_id: categoryId,
        date,
        payment_method: paymentMethod,
        payee,
        notes,
        reference_no: referenceNo,
      },
      include: {
        category: true,
        created_by: {
          select: { id: true, email: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT /api/expenses/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to update expense" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const canDelete = await hasModulePermission(session, "expenses", "delete", ["Admin", "Manager"]);
  if (!canDelete) {
    return NextResponse.json({ error: "Forbidden: insufficient permissions to delete expenses" }, { status: 403 });
  }

  try {
    const { id } = params;
    const companyId = (session.user as any)?.company_id;

    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing || (companyId && existing.company_id && existing.company_id !== companyId)) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    await prisma.expense.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Expense deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/expenses/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete expense" }, { status: 500 });
  }
}
