import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");

  let where = {};
  if (search) {
    where = {
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
  if (!["Admin", "Manager", "Cashier"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await request.json();

    // Generate medical_id format 0001-MM-YYYY
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const suffix = ` {month}- {year}`;

    // Find the latest patient for this month/year
    const latestPatient = await prisma.customer.findFirst({
      where: {
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
        nextSequence = parseInt(parts[0], 10) + 1;
      }
    }

    const medical_id = ` {String(nextSequence).padStart(4, '0')}- {suffix}`;

    const newPatient = await prisma.customer.create({
      data: {
        medical_id,
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
      }
    });

    return NextResponse.json(newPatient, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/patients error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
