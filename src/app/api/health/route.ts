import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        is_active: true,
        role: { select: { name: true } },
      },
    });

    return NextResponse.json({
      status: "ok",
      database_connected: true,
      user_count: userCount,
      users: users,
      env: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL ? "SET" : "MISSING",
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "SET" : "MISSING",
        DATABASE_URL: process.env.DATABASE_URL ? "SET" : "MISSING",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        database_connected: false,
        error_message: error?.message || String(error),
        error_code: error?.code,
        env: {
          NEXTAUTH_URL: process.env.NEXTAUTH_URL ? "SET" : "MISSING",
          NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "SET" : "MISSING",
          DATABASE_URL: process.env.DATABASE_URL ? "SET" : "MISSING",
        },
      },
      { status: 500 }
    );
  }
}
