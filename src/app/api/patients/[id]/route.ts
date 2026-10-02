import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rawId = params?.id ? decodeURIComponent(params.id).trim() : "";
    if (!rawId) {
      return NextResponse.json({ error: "Invalid patient ID" }, { status: 400 });
    }

    const patient = await prisma.customer.findUnique({
      where: { id: rawId },
      include: {
        payments: {
          orderBy: { payment_date: "desc" },
          include: {
            sale: {
              select: { invoice_number: true, grand_total: true }
            }
          }
        },
        sales: {
          orderBy: { date: "desc" },
          include: {
            doctor: {
              select: { id: true, name: true, is_doctor: true }
            },
            payments: {
              orderBy: { payment_date: "desc" }
            },
            items: {
              include: {
                product: {
                  select: { id: true, name: true, sku: true, category: { select: { name: true } } }
                }
              }
            }
          }
        }
      }
    });

    if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

    return NextResponse.json(patient);
  } catch (error: any) {
    console.error("GET /api/patients/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any)?.role;
  if (!["Admin", "Manager", "Cashier"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const rawId = params?.id ? decodeURIComponent(params.id).trim() : "";
    if (!rawId) {
      return NextResponse.json({ error: "Invalid patient ID" }, { status: 400 });
    }

    const data = await request.json();
    
    const updatedPatient = await prisma.customer.update({
      where: { id: rawId },
      data: {
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
      }
    });

    return NextResponse.json(updatedPatient);
  } catch (error: any) {
    console.error("PUT /api/patients/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
