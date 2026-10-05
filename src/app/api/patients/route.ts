import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const companyId = (session.user as any)?.company_id;

  let where: any = companyId ? { company_id: companyId } : {};
  if (search) {
    where = {
      ...where,
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { medical_id: { contains: search, mode: 'insensitive' } },
      ],
    };
  }

  const patients = await prisma.customer.findMany({
    where,
    orderBy: { medical_id: 'desc' },
  });

  return NextResponse.json(patients);
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

    if (!data.name || typeof data.name !== "string" || data.name.trim() === "") {
      return NextResponse.json({ error: "Patient name is required" }, { status: 400 });
    }

    // Generate medical_id format 0001-MM-YYYY
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const suffix = `${month}-${year}`;

    const companyId = (session.user as any)?.company_id;

    // Find the latest patient for this company & month/year
    const latestPatient = await prisma.customer.findFirst({
      where: {
        ...(companyId ? { company_id: companyId } : {}),
        medical_id: {
          endsWith: suffix,
        }
      },
      orderBy: {
        medical_id: 'desc'
      }
    });

    let nextSequence = 1;
    if (latestPatient) {
      const parts = latestPatient.medical_id.split('-');
      if (parts.length === 3) {
        const parsed = parseInt(parts[0], 10);
        if (!isNaN(parsed)) {
          nextSequence = parsed + 1;
        }
      }
    }

    const medical_id = `${String(nextSequence).padStart(4, '0')}-${suffix}`;

    const newPatient = await prisma.customer.create({
      data: {
        medical_id,
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        address: data.address?.trim() || null,
        company_id: companyId,
      }
    });

    return NextResponse.json(newPatient, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/patients error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
