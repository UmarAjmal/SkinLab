import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Fetch sale items within date range
    const saleItems = await prisma.saleItem.findMany({
      where: {
        sale: {
          date: Object.keys(dateFilter).length > 0 ? dateFilter : undefined
        }
      },
      include: {
        product: true,
        sale: true
      }
    });

    // Aggregate by product
    const performanceMap = new Map<string, any>();

    for (const item of saleItems) {
      const pId = item.product_id;
      const pName = item.item_group_name ? ` {item.item_group_name} -  {item.product.name}` : item.product.name;

      if (!performanceMap.has(pId)) {
        performanceMap.set(pId, {
          id: pId,
          name: pName,
          sku: item.product.sku || 'N/A',
          quantity_sold: 0,
          revenue: 0
        });
      }

      const current = performanceMap.get(pId);
      current.quantity_sold += item.quantity;

      // Calculate effective revenue considering discounts
      // If sale had discount, prorate it, or just use total_price (it's simpler and standard unless discount is itemized)
      // We will use item.total_price as the base revenue.
      // Wait, grand_total is subtotal - discount_amount. total_price is before discount.
      // We will just report Gross Revenue for simplicity, unless we want to prorate. Gross is fine.
      current.revenue += item.total_price;
    }

    const result = Array.from(performanceMap.values()).sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/reports/service-performance error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
