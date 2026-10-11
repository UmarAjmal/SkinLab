import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { hasModulePermission } from "@/lib/permissions";

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const companyId = (session.user as any)?.company_id;

  try {
    const deals = await prisma.deal.findMany({
      where: companyId ? { company_id: companyId } : {},
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });
    return NextResponse.json(deals);
  } catch (error) {
    console.error("GET /api/deals error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const canWrite = await hasModulePermission(session, "services", "write", ["Admin", "Manager", "Cashier", "Doctor"]);
  if (!canWrite) {
    return NextResponse.json({ error: "Forbidden: You do not have permission to create packages" }, { status: 403 });
  }

  try {
    const data = await request.json();
    
    if (!data.name || !data.items || data.items.length === 0) {
      return NextResponse.json({ error: "Name and at least one item are required" }, { status: 400 });
    }

    const totalPrice = data.price !== undefined && data.price !== null && data.price !== "" 
      ? Number(data.price) 
      : 0;

    const companyId = (session.user as any)?.company_id;

    const newDeal = await prisma.deal.create({
      data: {
        name: data.name,
        total_price: totalPrice,
        company_id: companyId,
        items: {
          create: data.items.map((item: any) => ({
            product_id: item.product_id,
            sessions_allowed: item.sessions || 1,
            quantity: 1
          }))
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    return NextResponse.json(newDeal, { status: 201 });

  } catch (error) {
    console.error("POST /api/deals error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
