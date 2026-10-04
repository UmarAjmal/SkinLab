import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const userCompanyId = (session.user as any)?.company_id;
    let settings = null;

    if (userCompanyId) {
      settings = await prisma.companySetting.findUnique({
        where: { id: userCompanyId },
      });
    }

    if (!settings) {
      settings = await prisma.companySetting.findFirst();
    }
    
    // Auto-create default settings if none exist
    if (!settings) {
      settings = await prisma.companySetting.create({
        data: {
          name: "Skin-Lab Clinic",
          phone: "",
          logo: "",
          address: "",
          tax_number: "",
          footer_note: "Thank you for visiting Skin-Lab Clinic! Powered by Falcon Swift PVT. LTD."
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
    const userCompanyId = (session.user as any)?.company_id;
    
    let settings = null;
    if (userCompanyId) {
      settings = await prisma.companySetting.findUnique({
        where: { id: userCompanyId },
      });
    }

    if (!settings) {
      settings = await prisma.companySetting.findFirst();
    }
    
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.logo !== undefined) updateData.logo = data.logo || null;
    if (data.address !== undefined) updateData.address = data.address || null;
    if (data.tax_number !== undefined) updateData.tax_number = data.tax_number || null;
    if (data.footer_note !== undefined) updateData.footer_note = data.footer_note || null;
    if (data.theme_config !== undefined) {
      updateData.theme_config = typeof data.theme_config === "object" ? JSON.stringify(data.theme_config) : data.theme_config || null;
    }

    if (!settings) {
      settings = await prisma.companySetting.create({
        data: {
          name: data.name || "Skin-Lab Clinic",
          phone: data.phone || "",
          logo: data.logo || "",
          address: data.address || "",
          tax_number: data.tax_number || "",
          footer_note: data.footer_note || "",
          theme_config: typeof data.theme_config === "object" ? JSON.stringify(data.theme_config) : data.theme_config || null,
        }
      });
    } else {
      settings = await prisma.companySetting.update({
        where: { id: settings.id },
        data: updateData,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("PUT /api/settings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
