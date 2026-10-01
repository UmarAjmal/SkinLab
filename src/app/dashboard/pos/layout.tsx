import { requireModulePermission } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function POSLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireModulePermission("pos", "read");
  } catch (error) {
    redirect("/dashboard");
  }
  return <>{children}</>;
}

