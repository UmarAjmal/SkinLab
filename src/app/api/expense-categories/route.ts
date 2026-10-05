import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

const DEFAULT_CATEGORIES = [
  { name: "Clinic Rent & Property", description: "Monthly clinic rent, building maintenance, property taxes" },
  { name: "Staff Salaries & Daily Wages", description: "Doctor percentages, therapist salaries, assistant and reception wages" },
  { name: "Medical & Clinic Supplies", description: "Botox, Fillers, HydraFacial serums, needles, gloves, consumables" },
  { name: "Utilities (Electricity, Gas, Water)", description: "WAPDA / K-Electric bills, generator fuel, water tankers, gas bills" },
  { name: "Marketing & Advertising", description: "Social media ads (Meta/Google), influencer collaborations, banners, print media" },
  { name: "Equipment Maintenance & Repairs", description: "Laser machine servicing, HydraFacial machine parts, AC repairs, plumbing" },
  { name: "Tea, Refreshments & Groceries", description: "Staff tea, patient refreshments, water dispenser bottles, cleaning supplies" },
  { name: "Software, Internet & Phone", description: "Clinic software subscription, high-speed Wi-Fi, clinic official SIM cards" },
  { name: "Miscellaneous & Petty Cash", description: "Day-to-day petty cash, emergency purchases, general minor expenses" },
];

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const companyId = (session.user as any)?.company_id;
    const whereScope = companyId ? { company_id: companyId } : {};

    let categories = await prisma.expenseCategory.findMany({
      where: whereScope,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { expenses: true },
        },
      },
    });

    // Auto seed if empty
    if (categories.length === 0) {
      await prisma.expenseCategory.createMany({
        data: DEFAULT_CATEGORIES.map((c) => ({
          ...c,
          ...(companyId ? { company_id: companyId } : {}),
        })),
        skipDuplicates: true,
      });

      categories = await prisma.expenseCategory.findMany({
        where: whereScope,
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: { expenses: true },
          },
        },
      });
    }

    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("GET /api/expense-categories error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any)?.role;
  if (!["Admin", "Manager"].includes(role)) {
    return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
  }

  try {
    const data = await request.json();
    const companyId = (session.user as any)?.company_id;
    const name = data.name ? String(data.name).trim() : "";
    const description = data.description ? String(data.description).trim() : null;

    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const existing = await prisma.expenseCategory.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        ...(companyId ? { company_id: companyId } : {}),
      },
    });

    if (existing) {
      return NextResponse.json({ error: "A category with this name already exists" }, { status: 400 });
    }

    const created = await prisma.expenseCategory.create({
      data: {
        name,
        description,
        ...(companyId ? { company_id: companyId } : {}),
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/expense-categories error:", error);
    return NextResponse.json({ error: error.message || "Failed to create category" }, { status: 500 });
  }
}
