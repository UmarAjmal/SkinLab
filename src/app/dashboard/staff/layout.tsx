import { requireModulePermission } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireModulePermission("staff", "read");
  } catch (error) {
    redirect("/dashboard");
  }
  return <>{children}</>;
}

