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

    // Auto-heal any corrupt SKU stored in the database (e.g. from previous broken template string)
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      if (p.sku && (p.sku.includes("{") || p.sku.includes("count") || p.sku.includes("padStart"))) {
        let candidateNum = i + 1;
        let candidateSku = `SRV-${String(candidateNum).padStart(4, '0')}`;
        while (await prisma.product.findFirst({ where: { sku: candidateSku, NOT: { id: p.id } } })) {
          candidateNum++;
          candidateSku = `SRV-${String(candidateNum).padStart(4, '0')}`;
        }
        await prisma.product.update({
          where: { id: p.id },
          data: { sku: candidateSku }
        });
        p.sku = candidateSku;
      }
    }

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

    // Auto-heal any existing product with corrupt SKU to avoid uniqueness collision
    const corruptProducts = await prisma.product.findMany({
      where: {
        OR: [
          { sku: { contains: "{" } },
          { sku: { contains: "count" } },
          { sku: { contains: "padStart" } }
        ]
      }
    });

    for (let i = 0; i < corruptProducts.length; i++) {
      const cp = corruptProducts[i];
      let healedNum = i + 1;
      let healedSku = `SRV-${String(healedNum).padStart(4, '0')}`;
      while (await prisma.product.findFirst({ where: { sku: healedSku, NOT: { id: cp.id } } })) {
        healedNum++;
        healedSku = `SRV-${String(healedNum).padStart(4, '0')}`;
      }
      await prisma.product.update({
        where: { id: cp.id },
        data: { sku: healedSku }
      });
    }

    // Auto-generate clean, unique SKU
    let sku = data.sku ? String(data.sku).trim() : "";
    if (!sku) {
      const totalCount = await prisma.product.count();
      let skuNum = totalCount + 1;
      sku = `SRV-${String(skuNum).padStart(4, '0')}`;

      while (await prisma.product.findUnique({ where: { sku } })) {
        skuNum++;
        sku = `SRV-${String(skuNum).padStart(4, '0')}`;
      }
    } else {
      const existing = await prisma.product.findUnique({ where: { sku } });
      if (existing) {
        return NextResponse.json({ error: "A service or product with this SKU already exists" }, { status: 400 });
      }
    }

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
        name: data.name.trim(),
        sku: sku,
        category_id: data.category_id,
        cost_price: costPrice,
        selling_price: sellingPrice,
        tax_class: data.tax_class || "Standard",
        stock_quantity: stockQuantity,
      },
      include: {
        category: true
      }
    });

    return NextResponse.json(newProduct, { status: 201 });

  } catch (error: any) {
    console.error("POST /api/products error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
