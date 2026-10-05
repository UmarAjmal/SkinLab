import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any)?.role;
  if (!["Admin", "Manager"].includes(role)) {
    return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
  }

  try {
    const { id } = params;
    const companyId = (session.user as any)?.company_id;
    const data = await request.json();
    const name = data.name ? String(data.name).trim() : "";
    const description = data.description !== undefined ? String(data.description).trim() : undefined;

    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const existing = await prisma.expenseCategory.findUnique({ where: { id } });
    if (!existing || (companyId && existing.company_id && existing.company_id !== companyId)) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Check duplicate name
    const duplicate = await prisma.expenseCategory.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        id: { not: id },
        ...(companyId ? { company_id: companyId } : {}),
      },
    });

    if (duplicate) {
      return NextResponse.json({ error: "Another category with this name already exists" }, { status: 400 });
    }

    const updated = await prisma.expenseCategory.update({
      where: { id },
      data: {
        name,
        description,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT /api/expense-categories/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any)?.role;
  if (role !== "Admin") {
    return NextResponse.json({ error: "Forbidden: Only Admin can delete categories" }, { status: 403 });
  }

  try {
    const { id } = params;
    const companyId = (session.user as any)?.company_id;

    const existing = await prisma.expenseCategory.findUnique({ where: { id } });
    if (!existing || (companyId && existing.company_id && existing.company_id !== companyId)) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const expenseCount = await prisma.expense.count({ where: { category_id: id } });
    if (expenseCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete category: It has ${expenseCount} associated expense records.` },
        { status: 400 }
      );
    }

    await prisma.expenseCategory.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Category deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/expense-categories/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete category" }, { status: 500 });
  }
}
