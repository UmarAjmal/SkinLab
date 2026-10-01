import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

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

    // 1. Basic validation
    if (!data.customer_id) {
      return NextResponse.json({ error: "Please select a patient before completing sale." }, { status: 400 });
    }
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty. Please add at least one service." }, { status: 400 });
    }

    const subtotal = Number(data.subtotal) || 0;
    const discountAmount = Number(data.discount_amount) || 0;
    const grandTotal = Math.max(0, Number(data.grand_total) || (subtotal - discountAmount));
    const paidAmount = Math.max(0, Number(data.paid_amount) || 0);

    // Determine payment status
    let paymentStatus = "DUE";
    if (paidAmount >= grandTotal) {
      paymentStatus = "PAID";
    } else if (paidAmount > 0) {
      paymentStatus = "PARTIAL";
    }

    // 2. Pre-fetch and validate entities outside transaction for maximum speed
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

    // Batch validate all product IDs
    const productIds = data.items.map((it: any) => it.product_id).filter(Boolean);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    const sanitizedItems: any[] = [];
    for (const item of data.items) {
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

    // Parallel pre-fetching of counts and settings
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

    let count = totalSales + 1;
    let invoiceNumber = `INV-${count.toString().padStart(4, "0")}`;

    // 3. Fast Atomic Transaction with extended timeout
    const result = await (prisma as any).$transaction(
      async (tx: any) => {
        // Ensure invoiceNumber is strictly unique
        while (await tx.sale.findUnique({ where: { invoice_number: invoiceNumber } })) {
          count++;
          invoiceNumber = `INV-${count.toString().padStart(4, "0")}`;
        }

        // Create Sale and SaleItems
        const sale = await tx.sale.create({
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

        // Update Customer Balance
        const balanceDelta = grandTotal - paidAmount;
        let newCurrentBalance = customer.current_balance;
        let newAdvanceBalance = customer.advance_balance;

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

        const updatedCustomer = await tx.customer.update({
          where: { id: customer.id },
          data: {
            current_balance: newCurrentBalance,
            advance_balance: newAdvanceBalance,
          },
        });

        return { sale, updatedCustomer };
      },
      {
        maxWait: 10000,
        timeout: 30000,
      }
    );

    return NextResponse.json(
      {
        sale: result.sale,
        token,
        visitCount,
        settings,
        customer: result.updatedCustomer || customer,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/sales error:", error);
    console.error("Error details:", error?.message, error?.stack);
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

    let whereClause: any = {};

    if (status && status !== "ALL") {
      whereClause.payment_status = status;
    }

    if (startDate && endDate) {
      whereClause.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    if (search) {
      whereClause.OR = [
        { invoice_number: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } }
      ];
    }

    const sales = await prisma.sale.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
      include: {
        customer: true,
        doctor: true,
        user: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error("GET /api/sales error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
