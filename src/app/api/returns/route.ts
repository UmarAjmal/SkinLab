import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requireRole(["Admin", "Manager"]);
    const companyId = (session.user as any)?.company_id;

    const returns = await prisma.returnSale.findMany({
      where: companyId ? { sale: { company_id: companyId } } : undefined,
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
