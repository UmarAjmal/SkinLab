import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";


export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any)?.role;
  if (!["Admin", "Manager", "Cashier", "Doctor"].includes(role)) {
    return NextResponse.json({ error: "Forbidden: insufficient permissions to create sales." }, { status: 403 });
  }

  try {
    const data = await request.json();
    const sessionUserId = (session.user as any).id;
    const sessionUserEmail = (session.user as any).email || (session.user as any).name || sessionUserId;
    const sessionCompanyId = (session.user as any).company_id;

    // 1. Basic validation
    if (!data.customer_id) {
      return NextResponse.json({ error: "Please select a patient before completing sale." }, { status: 400 });
    }
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty. Please add at least one service." }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({ where: { id: data.customer_id } });
    if (!customer) {
      return NextResponse.json({ error: "Selected patient was not found in database. Please re-select the patient." }, { status: 400 });
    }

    // Validate user_id
    let validUserId = sessionUserId;
    const userExists = await prisma.user.findUnique({ where: { id: sessionUserId } });
    if (!userExists) {
      const fallbackUser = await prisma.user.findFirst({ where: { is_active: true } });
      if (fallbackUser) {
        validUserId = fallbackUser.id;
      }
    }

    // Validate doctor_id if provided
    let validDoctorId: string | null = null;
    if (data.doctor_id && typeof data.doctor_id === "string" && data.doctor_id.trim() !== "") {
      const doctorExists = await prisma.employee.findUnique({ where: { id: data.doctor_id.trim() } });
      if (doctorExists) {
        validDoctorId = doctorExists.id;
      }
    }

    // Counts and settings
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [totalSales, customerVisits, salesToday, settings] = await Promise.all([
      prisma.sale.count(),
      prisma.sale.count({ where: { customer_id: customer.id } }),
      prisma.sale.count({ where: { date: { gte: startOfDay, lte: endOfDay } } }),
      prisma.companySetting.findFirst(),
    ]);

    const token = `P-${(salesToday + 1).toString().padStart(2, "0")}`;
    const visitCount = customerVisits + 1;

    // Check if this is purely a follow-up visit for an existing package (no new billable items)
    const isPureFollowUp = Boolean(
      data.original_sale_id &&
      data.items.every((it: any) => it.is_follow_up || it.consumed_from_item_id || it.is_follow_up_session || (Number(it.unit_price) === 0 && Number(it.total_price) === 0))
    );

    const paidAmount = Math.max(0, Number(data.paid_amount) || 0);

    // ==========================================
    // CASE 1: PURE FOLLOW-UP SESSION VISIT
    // ==========================================
    if (isPureFollowUp && data.original_sale_id) {
      const origSale = await prisma.sale.findUnique({
        where: { id: data.original_sale_id },
        include: {
          items: { include: { product: true } },
          customer: true,
          doctor: true,
        },
      });

      if (!origSale) {
        return NextResponse.json({ error: "Original package invoice not found." }, { status: 404 });
      }

      // 1. Increment consumed sessions on the original sale items
      for (const it of data.items) {
        if (it.consumed_from_item_id) {
          try {
            await prisma.saleItem.update({
              where: { id: it.consumed_from_item_id },
              data: {
                sessions_consumed: {
                  increment: 1,
                },
              },
            });
          } catch (sessionErr) {
            console.error("Failed to increment sessions_consumed:", it.consumed_from_item_id, sessionErr);
          }
        }
      }

      // 2. If remarks were added, update the session remarks
      if (data.session_remarks && data.session_remarks.trim()) {
        const dateTag = new Date().toLocaleDateString("en-PK");
        const newRemark = `[${dateTag}]: ${data.session_remarks.trim()}`;
        const updatedRemarks = origSale.session_remarks
          ? `${origSale.session_remarks} | ${newRemark}`
          : newRemark;

        await prisma.sale.update({
          where: { id: origSale.id },
          data: { session_remarks: updatedRemarks },
        });
      }

      // 3. If any due payment was collected today at the counter
      let createdPayment = null;
      let newOrigPaid = origSale.paid_amount;
      let newOrigStatus = origSale.payment_status;

      if (paidAmount > 0) {
        // Record payment in the dedicated Payment ledger
        createdPayment = await prisma.payment.create({
          data: {
            sale_id: origSale.id,
            customer_id: customer.id,
            amount: paidAmount,
            payment_method: data.payment_method || "Cash",
            payment_date: new Date(),
            received_by: sessionUserEmail,
            notes: `Follow-up session payment against invoice ${origSale.invoice_number}`,
          },
        });

        // Update original sale's paid amount & status
        newOrigPaid = Math.min(origSale.grand_total, origSale.paid_amount + paidAmount);
        newOrigStatus = newOrigPaid >= (origSale.grand_total - 0.01) ? "PAID" : "PARTIAL";

        await prisma.sale.update({
          where: { id: origSale.id },
          data: {
            paid_amount: newOrigPaid,
            payment_status: newOrigStatus,
          },
        });

        // Update Customer current balance
        let newCurrentBalance = customer.current_balance;
        let newAdvanceBalance = customer.advance_balance;

        if (newCurrentBalance >= paidAmount) {
          newCurrentBalance -= paidAmount;
        } else {
          const excess = paidAmount - newCurrentBalance;
          newCurrentBalance = 0;
          newAdvanceBalance += excess;
        }

        await prisma.customer.update({
          where: { id: customer.id },
          data: {
            current_balance: newCurrentBalance,
            advance_balance: newAdvanceBalance,
          },
        });
      }

      const refreshedOrigSale = await prisma.sale.findUnique({
        where: { id: origSale.id },
        include: {
          items: { include: { product: true } },
          customer: true,
          doctor: true,
          payments: { orderBy: { payment_date: "desc" } },
        },
      });

      const updatedCustomer = await prisma.customer.findUnique({ where: { id: customer.id } });

      // Trigger RBAC Notification for follow-up session & payment
      createNotification({
        title: `Package Session Consumed: ${origSale.invoice_number}`,
        message: `Patient ${customer.name} completed a package follow-up session${paidAmount > 0 ? ` with payment of PKR ${paidAmount.toFixed(2)}` : ""}.`,
        type: "PAYMENT_RECEIVED",
        severity: "INFO",
        targetRole: "Admin",
        linkUrl: `/dashboard/sales?search=${origSale.invoice_number}`,
      }).catch(console.error);

      if (origSale.doctor_id) {
        createNotification({
          title: `Follow-up Session: ${origSale.invoice_number}`,
          message: `Patient ${customer.name} checked in for scheduled treatment.`,
          type: "PAYMENT_RECEIVED",
          severity: "INFO",
          targetRole: "Doctor",
          linkUrl: `/dashboard/sales?search=${origSale.invoice_number}`,
        }).catch(console.error);
      }

      return NextResponse.json(
        {
          is_followup: true,
          sale: refreshedOrigSale || origSale,
          token,
          visitCount,
          settings,
          customer: updatedCustomer || customer,
          payment: createdPayment,
          paid_today: paidAmount,
        },
        { status: 200 }
      );
    }

    // ==========================================
    // CASE 2: NEW SALE / NEW INVOICE
    // ==========================================
    const billableItems = data.items.filter(
      (it: any) => !it.consumed_from_item_id && !it.is_follow_up && !it.is_follow_up_session
    );
    const followUpItems = data.items.filter(
      (it: any) => it.consumed_from_item_id || it.is_follow_up || it.is_follow_up_session
    );

    // If there are follow-up items attached in the same cart, increment their session counts
    for (const it of followUpItems) {
      if (it.consumed_from_item_id) {
        try {
          await prisma.saleItem.update({
            where: { id: it.consumed_from_item_id },
            data: { sessions_consumed: { increment: 1 } },
          });
        } catch (err) {
          console.error("Failed to increment session count on item:", it.consumed_from_item_id, err);
        }
      }
    }

    // Batch validate all product IDs for billable items
    const itemsToProcess = billableItems.length > 0 ? billableItems : data.items;
    const productIds = itemsToProcess.map((it: any) => it.product_id).filter(Boolean);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    const sanitizedItems: any[] = [];
    for (const item of itemsToProcess) {
      if (!item.product_id) {
        return NextResponse.json({ error: `Cart item "${item.name || "Service"}" is missing a valid product ID.` }, { status: 400 });
      }
      const prod = productMap.get(item.product_id);
      if (!prod) {
        return NextResponse.json({ error: `Service "${item.name || "Unknown"}" (ID: ${item.product_id}) not found in database.` }, { status: 400 });
      }

      const unitPrice = Number(item.unit_price) !== undefined && !isNaN(Number(item.unit_price))
        ? Number(item.unit_price)
        : (prod.selling_price || 0);
      const quantity = Math.max(1, parseInt(item.quantity) || 1);
      const totalPrice = Number(item.total_price) !== undefined && !isNaN(Number(item.total_price))
        ? Number(item.total_price)
        : unitPrice * quantity;

      sanitizedItems.push({
        product_id: prod.id,
        quantity: quantity,
        unit_price: unitPrice,
        sessions_allowed: Math.max(1, parseInt(item.sessions_allowed) || 1),
        sessions_consumed: Math.max(0, parseInt(item.sessions_consumed) || 0),
        total_price: totalPrice,
        item_group_name: item.item_group_name || null,
      });
    }

    const calculatedSubtotal = sanitizedItems.reduce((acc, it) => acc + it.total_price, 0);
    const subtotal = Number(data.subtotal) !== undefined && !isNaN(Number(data.subtotal)) ? Number(data.subtotal) : calculatedSubtotal;
    const discountAmount = Number(data.discount_amount) || 0;
    const grandTotal = Math.max(0, Number(data.grand_total) || (subtotal - discountAmount));

    let paymentStatus = "DUE";
    if (paidAmount >= grandTotal - 0.01 && grandTotal > 0) {
      paymentStatus = "PAID";
    } else if (paidAmount > 0) {
      paymentStatus = "PARTIAL";
    } else if (grandTotal === 0) {
      paymentStatus = "PAID";
    }

    let count = totalSales + 1;
    let invoiceNumber = `INV-${count.toString().padStart(4, "0")}`;

    while (
      await prisma.sale.findFirst({
        where: {
          invoice_number: invoiceNumber,
          ...(sessionCompanyId ? { company_id: sessionCompanyId } : {}),
        },
      })
    ) {
      count++;
      invoiceNumber = `INV-${count.toString().padStart(4, "0")}`;
    }

    const sale = await prisma.sale.create({
      data: {
        invoice_number: invoiceNumber,
        customer_id: customer.id,
        user_id: validUserId,
        doctor_id: validDoctorId,
        subtotal: subtotal,
        discount_amount: discountAmount,
        grand_total: grandTotal,
        paid_amount: paidAmount,
        payment_status: paymentStatus,
        payment_method: data.payment_method || "Cash",
        session_remarks: data.session_remarks || null,
        company_id: sessionCompanyId,
        items: {
          create: sanitizedItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
        doctor: true,
        user: true,
      },
    });

    // If payment was made on this new sale, record in Payment table
    if (paidAmount > 0) {
      await prisma.payment.create({
        data: {
          sale_id: sale.id,
          customer_id: customer.id,
          amount: paidAmount,
          payment_method: data.payment_method || "Cash",
          payment_date: sale.date,
          received_by: sessionUserEmail,
          notes: `Initial payment on Invoice ${sale.invoice_number}`,
          company_id: sessionCompanyId,
        },
      });
    }

    // Update Customer Balance
    let newCurrentBalance = customer.current_balance;
    let newAdvanceBalance = customer.advance_balance;

    const balanceDelta = grandTotal - paidAmount;
    if (balanceDelta > 0) {
      if (newAdvanceBalance >= balanceDelta) {
        newAdvanceBalance -= balanceDelta;
      } else {
        const remainingOwed = balanceDelta - newAdvanceBalance;
        newAdvanceBalance = 0;
        newCurrentBalance += remainingOwed;
      }
    } else if (balanceDelta < 0) {
      const overpaidAmount = Math.abs(balanceDelta);
      if (newCurrentBalance >= overpaidAmount) {
        newCurrentBalance -= overpaidAmount;
      } else {
        const remainingAdvance = overpaidAmount - newCurrentBalance;
        newCurrentBalance = 0;
        newAdvanceBalance += remainingAdvance;
      }
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        current_balance: newCurrentBalance,
        advance_balance: newAdvanceBalance,
      },
    });

    // Trigger RBAC Notifications for New Sale
    createNotification({
      title: `New Sale: ${sale.invoice_number}`,
      message: `Patient ${customer.name} billed for PKR ${grandTotal.toFixed(2)} (Paid: PKR ${paidAmount.toFixed(2)}${paymentStatus !== "PAID" ? `, Balance: PKR ${(grandTotal - paidAmount).toFixed(2)}` : ""}).`,
      type: "SALE_CREATED",
      severity: paymentStatus === "PAID" ? "SUCCESS" : "WARNING",
      targetRole: "Admin",
      linkUrl: `/dashboard/sales?search=${sale.invoice_number}`,
    }).catch(console.error);

    if (validDoctorId) {
      createNotification({
        title: `Patient Consultation/Procedure: ${sale.invoice_number}`,
        message: `Patient ${customer.name} assigned to your schedule for treatment.`,
        type: "SALE_CREATED",
        severity: "INFO",
        targetRole: "Doctor",
        linkUrl: `/dashboard/sales?search=${sale.invoice_number}`,
      }).catch(console.error);
    }

    return NextResponse.json(
      {
        sale,
        token,
        visitCount,
        settings,
        customer: updatedCustomer || customer,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/sales error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process sale", details: error?.message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limitParam = searchParams.get("limit");
    const take = limitParam ? Math.min(500, Math.max(1, parseInt(limitParam) || 100)) : 100;
    const sessionCompanyId = (session.user as any)?.company_id;
    let whereClause: any = sessionCompanyId ? { company_id: sessionCompanyId } : {};

    if (status && status !== "ALL") {
      whereClause.payment_status = status;
    }

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (search) {
      whereClause.OR = [
        { invoice_number: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const sales = await prisma.sale.findMany({
      where: whereClause,
      take,
      orderBy: { date: "desc" },
      include: {
        customer: true,
        doctor: { select: { id: true, name: true } },
        user: { select: { id: true, email: true } },
        payments: {
          orderBy: { payment_date: "desc" },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error("GET /api/sales error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

