import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    await requireRole(["Admin", "Manager"]);
    const returns = await prisma.returnSale.findMany({
      take: 100,
      orderBy: { date: "desc" },
      include: {
        sale: {
          include: {
            customer: true,
          }
        },
        items: {
          include: {
            sale_item: {
              include: {
                product: true
              }
            }
          }
        }
      },
    });
    return NextResponse.json(returns);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch returns" }, { status: 500 });
  }
}
