import { requireModulePermission } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function ServicesLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireModulePermission("services", "read");
  } catch (error) {
    redirect("/dashboard");
  }
  return <>{children}</>;
}

