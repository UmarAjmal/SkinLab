import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session || !session.user || !(session.user as any).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any)?.role;
  if (!["Admin", "Manager", "Cashier"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await request.json();
    const userId = (session.user as any).id;

    // Validate request
    if (!data.customer_id || !data.items || data.items.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Determine payment status
    let paymentStatus = "DUE";
    if (data.paid_amount >= data.grand_total) {
      paymentStatus = "PAID";
    } else if (data.paid_amount > 0) {
      paymentStatus = "PARTIAL";
    }

    // Start transaction
    const result = await (prisma as any).$transaction(async (tx: any) => {
      // 1. Get next invoice number
      const totalSales = await tx.sale.count();
      const invoiceNumber = `INV-${(totalSales + 1).toString().padStart(4, '0')}`;

      // 2. Create Sale and SaleItems
      const sale = await tx.sale.create({
        data: {
          invoice_number: invoiceNumber,
          customer_id: data.customer_id,
          user_id: userId,
          doctor_id: data.doctor_id || null,
          subtotal: data.subtotal,
          discount_amount: data.discount_amount,
          grand_total: data.grand_total,
          paid_amount: data.paid_amount || 0,
          payment_status: paymentStatus,
          payment_method: data.payment_method || null,
          session_remarks: data.session_remarks || null,
          items: {
            create: data.items.map((item: any) => ({
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              sessions_allowed: item.sessions_allowed || 1,
              sessions_consumed: item.sessions_consumed || 0,
              total_price: item.total_price,
              item_group_name: item.item_group_name || null,
            }))
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          },
          customer: true,
          doctor: true,
          user: true
        }
      });

      // 3. Update Customer Balance
      const customer = await tx.customer.findUnique({ where: { id: data.customer_id } });
      let updatedCustomer = customer;
      if (customer) {
        const balanceDelta = data.grand_total - data.paid_amount;
        let newCurrentBalance = customer.current_balance;
        let newAdvanceBalance = customer.advance_balance;

        if (balanceDelta > 0) {
          // They underpaid, they owe us. 
          // First try to deduct from advance balance
          if (newAdvanceBalance >= balanceDelta) {
            newAdvanceBalance -= balanceDelta;
          } else {
            const remainingOwed = balanceDelta - newAdvanceBalance;
            newAdvanceBalance = 0;
            newCurrentBalance += remainingOwed;
          }
        } else if (balanceDelta < 0) {
          // They overpaid
          const overpaidAmount = Math.abs(balanceDelta);
          // First try to pay off current balance
          if (newCurrentBalance >= overpaidAmount) {
            newCurrentBalance -= overpaidAmount;
          } else {
            const remainingAdvance = overpaidAmount - newCurrentBalance;
            newCurrentBalance = 0;
            newAdvanceBalance += remainingAdvance;
          }
        }

        updatedCustomer = await tx.customer.update({
          where: { id: data.customer_id },
          data: {
            current_balance: newCurrentBalance,
            advance_balance: newAdvanceBalance
          }
        });
      }

      // 4. Count visits for this customer
      const visitCount = await tx.sale.count({
        where: { customer_id: data.customer_id }
      });

      // 5. Get clinic settings
      const settings = await tx.companySetting.findFirst();

      // 6. Generate daily token (optional to return here)
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const salesToday = await tx.sale.count({
        where: {
          date: { gte: startOfDay, lte: endOfDay }
        }
      });
      const token = `P-${salesToday.toString().padStart(2, '0')}`;

      return { sale, token, visitCount, settings, customer: updatedCustomer || sale.customer };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/sales error:", error);
    console.error("Error details:", error?.message, error?.stack);
    return NextResponse.json({ error: "Internal Server Error", details: error?.message }, { status: 500 });
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
