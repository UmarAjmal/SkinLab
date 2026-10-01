import { requireModulePermission } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function ReportsLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireModulePermission("reports", "read");
  } catch (error) {
    redirect("/dashboard");
  }
  return <>{children}</>;
}

