import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    let settings = await prisma.companySetting.findFirst();
    
    // Auto-create default settings if none exist
    if (!settings) {
      settings = await prisma.companySetting.create({
        data: {
          name: "Skin-Lab Clinic",
          phone: "",
          logo: "",
          address: "",
          tax_number: "",
          footer_note: "Thank you for visiting Skin-Lab Clinic!"
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await request.json();
    
    let settings = await prisma.companySetting.findFirst();
    
    if (!settings) {
      settings = await prisma.companySetting.create({
        data: {
          name: data.name || "Skin-Lab Clinic",
          phone: data.phone || "",
          logo: data.logo || "",
          address: data.address || "",
          tax_number: data.tax_number || "",
          footer_note: data.footer_note || ""
        }
      });
    } else {
      settings = await prisma.companySetting.update({
        where: { id: settings.id },
        data: {
          name: data.name,
          phone: data.phone || null,
          logo: data.logo || null,
          address: data.address || null,
          tax_number: data.tax_number || null,
          footer_note: data.footer_note || null,
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("PUT /api/settings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
