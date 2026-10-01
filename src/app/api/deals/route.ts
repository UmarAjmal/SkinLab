import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const deals = await prisma.deal.findMany({
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

  const role = (session.user as any)?.role;
  if (!["Admin", "Manager", "Cashier", "Doctor"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await request.json();
    
    if (!data.name || !data.items || data.items.length === 0) {
      return NextResponse.json({ error: "Name and at least one item are required" }, { status: 400 });
    }

    const totalPrice = data.price !== undefined && data.price !== null && data.price !== "" 
      ? Number(data.price) 
      : 0;

    const newDeal = await prisma.deal.create({
      data: {
        name: data.name,
        total_price: totalPrice,
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
