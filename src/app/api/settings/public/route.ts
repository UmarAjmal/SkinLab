import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseThemeConfig, DEFAULT_THEME } from "@/lib/theme";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await prisma.companySetting.findFirst();
    if (!settings) {
      return NextResponse.json({
        name: "Skin-Lab Clinic",
        logo: null,
        phone: null,
        theme_config: JSON.stringify(DEFAULT_THEME),
        theme: DEFAULT_THEME,
      });
    }

    const parsedTheme = parseThemeConfig(settings.theme_config);

    return NextResponse.json({
      name: settings.name,
      logo: settings.logo,
      phone: settings.phone,
      theme_config: settings.theme_config,
      theme: parsedTheme,
    });
  } catch (error) {
    console.error("GET /api/settings/public error:", error);
    return NextResponse.json({
      name: "Skin-Lab Clinic",
      logo: null,
      phone: null,
      theme: DEFAULT_THEME,
    });
  }
}
