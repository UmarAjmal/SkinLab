import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("category_id");

  try {
    const products = await prisma.product.findMany({
      where: categoryId ? { category_id: categoryId } : undefined,
      include: { category: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any)?.role;
  if (!["Admin", "Manager"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await request.json();
    
    if (!data.name || !data.category_id) {
      return NextResponse.json({ error: "Name and Category are required" }, { status: 400 });
    }

    // Auto-generate SKU
    const count = await prisma.product.count();
    const sku = `SRV-${String(count + 1).padStart(4, '0')}`;

    const sellingPrice = data.selling_price !== undefined && data.selling_price !== null && data.selling_price !== "" 
      ? Number(data.selling_price) 
      : 0;

    const costPrice = data.cost_price !== undefined && data.cost_price !== null && data.cost_price !== "" 
      ? Number(data.cost_price) 
      : 0;

    const stockQuantity = data.stock_quantity !== undefined && data.stock_quantity !== null && data.stock_quantity !== "" 
      ? parseInt(data.stock_quantity, 10) 
      : 0;

    const newProduct = await prisma.product.create({
      data: {
        name: data.name,
        sku: sku,
        category_id: data.category_id,
        cost_price: costPrice,
        selling_price: sellingPrice,
        tax_class: data.tax_class || "Standard",
        stock_quantity: stockQuantity,
      }
    });

    return NextResponse.json(newProduct, { status: 201 });

  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
