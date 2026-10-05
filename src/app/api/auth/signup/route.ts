import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      fullName,
      phone,
      email,
      password,
      plan,
      businessName,
      businessPhone,
      businessAddress,
      taxNumber,
      footerNote,
      logo,
    } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: "Full Name, Email, and Password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail.length < 5 || !cleanEmail.includes("@")) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please log in." },
        { status: 400 }
      );
    }

    // Find or create Admin Role
    let adminRole = await prisma.role.findFirst({
      where: { name: "Admin" },
    });

    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: {
          name: "Admin",
          description: "Full administrative access to all clinic features",
          is_system: true,
        },
      });

      const modules = [
        "dashboard",
        "patients",
        "services",
        "staff",
        "purchases",
        "pos",
        "sales",
        "reports",
        "settings",
        "users",
        "expenses",
      ];

      for (const mod of modules) {
        await prisma.rolePermission.create({
          data: {
            role_id: adminRole.id,
            module: mod,
            can_read: true,
            can_write: true,
            can_delete: true,
          },
        });
      }
    }

    // Create Company / Business Profile
    const company = await prisma.companySetting.create({
      data: {
        name: businessName?.trim() || `${fullName}'s Clinic`,
        phone: businessPhone?.trim() || phone?.trim() || null,
        address: businessAddress?.trim() || null,
        tax_number: taxNumber?.trim() || null,
        footer_note: footerNote?.trim() || "Thank you for trusting our clinic! Powered by Falcon Swift PVT. LTD.",
        logo: logo || null,
        plan: plan || "Monthly Subscription",
        plan_price: 3000,
        owner_name: fullName.trim(),
        owner_phone: phone?.trim() || null,
      },
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Admin User linked to company
    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        password: hashedPassword,
        full_name: fullName.trim(),
        phone: phone?.trim() || null,
        role_id: adminRole.id,
        company_id: company.id,
        is_active: true,
        is_first_login: true,
      },
    });

    // Update company with owner_id
    await prisma.companySetting.update({
      where: { id: company.id },
      data: { owner_id: user.id },
    });

    // 1. Seed Default Department for this company
    try {
      const defaultDept = await prisma.department.create({
        data: {
          name: "General Aesthetics & Dermatology",
          company_id: company.id,
        },
      });

      // 2. Seed default Employee for owner / administrator
      await prisma.employee.create({
        data: {
          name: fullName.trim(),
          is_doctor: true,
          department_id: defaultDept.id,
          company_id: company.id,
        },
      });
    } catch (deptErr) {
      console.warn("Could not create initial department/employee:", deptErr);
    }

    // 3. Seed Default Categories for this company
    try {
      const defaultCategories = [
        "Consultation & Assessment",
        "Aesthetic Procedures",
        "Laser & Device Treatments",
        "Skincare & Consumables",
      ];
      for (const catName of defaultCategories) {
        await prisma.category.create({
          data: {
            name: catName,
            company_id: company.id,
          },
        });
      }
    } catch (catErr) {
      console.warn("Could not seed categories:", catErr);
    }

    // 4. Seed Default Expense Categories for this company
    try {
      const defaultExpCategories = [
        "Clinic Rent & Property",
        "Utilities & Bills",
        "Consumables & Medical Supplies",
        "Staff Salaries & Doctor Payouts",
        "Equipment & Maintenance",
        "Marketing & Refreshments",
      ];
      for (const expCat of defaultExpCategories) {
        await prisma.expenseCategory.create({
          data: {
            name: expCat,
            description: "Default clinic expense category",
            company_id: company.id,
          },
        });
      }
    } catch (expErr) {
      console.warn("Could not seed expense categories:", expErr);
    }

    // 5. Create initial welcome notification
    try {
      await prisma.notification.create({
        data: {
          title: `Welcome to ${company.name}! 🎉`,
          message: `Your clinic workspace has been created with isolated database security. Start by adding your team, procedures, or registering your first patient.`,
          type: "SYSTEM_ALERT",
          severity: "SUCCESS",
          user_id: user.id,
          company_id: company.id,
          link_url: "/dashboard",
        },
      });
    } catch (notifErr) {
      console.warn("Could not create signup notification:", notifErr);
    }

    return NextResponse.json({
      success: true,
      message: "Your clinic account has been created successfully!",
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
        companyId: company.id,
        companyName: company.name,
      },
    });
  } catch (error: any) {
    console.error("[SignUp API Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create account. Please try again." },
      { status: 500 }
    );
  }
}
