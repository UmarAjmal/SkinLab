import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const deal = await prisma.deal.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: { product: true }
        }
      }
    });
    if (!deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    return NextResponse.json(deal);
  } catch (error) {
    console.error("GET /api/deals/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await request.json();
    
    // First, delete existing items to replace them
    await prisma.dealItem.deleteMany({
      where: { deal_id: params.id }
    });

    const totalPrice = data.price !== undefined && data.price !== null && data.price !== "" 
      ? Number(data.price) 
      : 0;

    const updatedDeal = await prisma.deal.update({
      where: { id: params.id },
      data: {
        name: data.name,
        total_price: totalPrice,
        items: {
          create: (data.items || []).map((item: any) => ({
            product_id: item.product_id,
            sessions_allowed: item.sessions || 1,
            quantity: 1
          }))
        }
      },
      include: {
        items: true
      }
    });

    return NextResponse.json(updatedDeal);

  } catch (error) {
    console.error("PUT /api/deals/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // DealItem rows will be deleted if there is a onDelete: Cascade in prisma schema. 
    // If not, we should delete them manually first.
    await prisma.dealItem.deleteMany({
      where: { deal_id: params.id }
    });
    
    await prisma.deal.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/deals/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

