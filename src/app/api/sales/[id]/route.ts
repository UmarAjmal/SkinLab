import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";


export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const saleId = params.id;
    const companyId = (session.user as any)?.company_id;
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        customer: true,
        doctor: { select: { id: true, name: true, is_doctor: true } },
        user: { select: { id: true, email: true } },
        payments: { orderBy: { payment_date: "desc" } },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!sale || (companyId && sale.company_id && sale.company_id !== companyId)) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    return NextResponse.json(sale);
  } catch (error: any) {
    console.error("GET /api/sales/[id] error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any)?.role;
  if (!["Admin", "Manager"].includes(role)) {
    return NextResponse.json({ error: "Forbidden: insufficient permissions to edit sales." }, { status: 403 });
  }

  try {
    const saleId = params.id;
    const companyId = (session.user as any)?.company_id;
    const data = await request.json();

    const existingSale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { customer: true, items: true },
    });

    if (!existingSale || (companyId && existingSale.company_id && existingSale.company_id !== companyId)) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    // 1. Update items if provided
    let newSubtotal = existingSale.subtotal;
    if (Array.isArray(data.items) && data.items.length > 0) {
      newSubtotal = 0;
      for (const item of data.items) {
        if (item.id) {
          const qty = Math.max(1, parseInt(item.quantity) || 1);
          const unitPrice = Math.max(0, parseFloat(item.unit_price) || 0);
          const lineTotal = qty * unitPrice;
          newSubtotal += lineTotal;

          await prisma.saleItem.update({
            where: { id: item.id },
            data: {
              quantity: qty,
              unit_price: unitPrice,
              total_price: lineTotal,
              sessions_allowed: item.sessions_allowed ? Math.max(1, parseInt(item.sessions_allowed) || 1) : undefined,
              sessions_consumed: item.sessions_consumed !== undefined ? Math.max(0, parseInt(item.sessions_consumed) || 0) : undefined,
            },
          });
        }
      }
    }

    const discountAmount = data.discount_amount !== undefined ? Math.max(0, parseFloat(data.discount_amount) || 0) : existingSale.discount_amount;
    const newGrandTotal = Math.max(0, newSubtotal - discountAmount);
    const paidAmount = existingSale.paid_amount;

    let newStatus = "DUE";
    if (paidAmount >= newGrandTotal - 0.01 && newGrandTotal > 0) {
      newStatus = "PAID";
    } else if (paidAmount > 0) {
      newStatus = "PARTIAL";
    } else if (newGrandTotal === 0) {
      newStatus = "PAID";
    }

    // Doctor validation
    let validDoctorId = existingSale.doctor_id;
    if (data.doctor_id !== undefined) {
      if (data.doctor_id && data.doctor_id.trim()) {
        const doc = await prisma.employee.findUnique({ where: { id: data.doctor_id.trim() } });
        validDoctorId = doc ? doc.id : null;
      } else {
        validDoctorId = null;
      }
    }

    // Update Sale record
    const updatedSale = await prisma.sale.update({
      where: { id: saleId },
      data: {
        doctor_id: validDoctorId,
        date: data.date ? new Date(data.date) : existingSale.date,
        subtotal: newSubtotal,
        discount_amount: discountAmount,
        grand_total: newGrandTotal,
        payment_status: newStatus,
        payment_method: data.payment_method || existingSale.payment_method,
        session_remarks: data.session_remarks !== undefined ? data.session_remarks : existingSale.session_remarks,
      },
      include: {
        customer: true,
        doctor: { select: { id: true, name: true, is_doctor: true } },
        user: { select: { id: true, email: true } },
        payments: { orderBy: { payment_date: "desc" } },
        items: { include: { product: true } },
      },
    });

    // 2. Adjust customer current balance if grand_total changed
    const grandTotalDiff = newGrandTotal - existingSale.grand_total;
    if (grandTotalDiff !== 0) {
      const customer = await prisma.customer.findUnique({ where: { id: existingSale.customer_id } });
      if (customer) {
        const newBalance = Math.max(0, customer.current_balance + grandTotalDiff);
        await prisma.customer.update({
          where: { id: customer.id },
          data: { current_balance: newBalance },
        });
      }
    }

    // Trigger Notification for Invoice Edit
    createNotification({
      title: `Invoice Modified: ${existingSale.invoice_number}`,
      message: `Invoice ${existingSale.invoice_number} for ${updatedSale.customer?.name} was modified. New Total: PKR ${newGrandTotal.toFixed(2)}.`,
      type: "SALE_UPDATED",
      severity: "WARNING",
      targetRole: "Admin",
      linkUrl: `/dashboard/sales?search=${existingSale.invoice_number}`,
      companyId: companyId || undefined,
    }).catch(console.error);

    return NextResponse.json(updatedSale, { status: 200 });
  } catch (error: any) {
    console.error("PUT /api/sales/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to update sale" }, { status: 500 });
  }
}
