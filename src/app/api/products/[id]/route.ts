import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const companyId = (session.user as any)?.company_id;
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: { category: true },
    });
    if (!product || (companyId && product.company_id && product.company_id !== companyId)) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error) {
    console.error("GET /api/products/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any)?.role;
  if (!["Admin", "Manager"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const companyId = (session.user as any)?.company_id;
    const data = await request.json();
    
    if (!data.name || !data.category_id) {
      return NextResponse.json({ error: "Name and Category are required" }, { status: 400 });
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

    const currentProduct = await prisma.product.findUnique({ where: { id: params.id } });
    if (!currentProduct || (companyId && currentProduct.company_id && currentProduct.company_id !== companyId)) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    let finalSku = currentProduct.sku;
    if (data.sku && data.sku.trim() !== "") {
      const trimmedSku = data.sku.trim();
      const existing = await prisma.product.findFirst({
        where: {
          sku: trimmedSku,
          NOT: { id: params.id },
          ...(companyId ? { company_id: companyId } : {}),
        }
      });
      if (existing) {
        return NextResponse.json({ error: "Another product already uses this SKU" }, { status: 400 });
      }
      finalSku = trimmedSku;
    } else if (!finalSku || finalSku.includes("{") || finalSku.includes("count") || finalSku.includes("padStart")) {
      // Auto-heal corrupt or missing SKU
      const totalCount = await prisma.product.count({
        where: companyId ? { company_id: companyId } : {},
      });
      let skuNum = totalCount + 1;
      let candidateSku = `SRV-${String(skuNum).padStart(4, '0')}`;
      while (await prisma.product.findFirst({
        where: {
          sku: candidateSku,
          NOT: { id: params.id },
          ...(companyId ? { company_id: companyId } : {}),
        }
      })) {
        skuNum++;
        candidateSku = `SRV-${String(skuNum).padStart(4, '0')}`;
      }
      finalSku = candidateSku;
    }

    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: {
        name: data.name.trim(),
        sku: finalSku,
        category_id: data.category_id,
        cost_price: costPrice,
        selling_price: sellingPrice,
        tax_class: data.tax_class || "Standard",
        stock_quantity: stockQuantity,
      }
    });
    return NextResponse.json(updatedProduct);

  } catch (error) {
    console.error("PUT /api/products/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any)?.role;
  if (!["Admin", "Manager"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const companyId = (session.user as any)?.company_id;
    const currentProduct = await prisma.product.findUnique({ where: { id: params.id } });
    if (!currentProduct || (companyId && currentProduct.company_id && currentProduct.company_id !== companyId)) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await prisma.product.delete({
      where: { id: params.id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/products/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
