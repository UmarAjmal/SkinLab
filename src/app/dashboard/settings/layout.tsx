import { requireModulePermission } from "@/lib/permissions";
import { redirect } from "next/navigation";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireModulePermission("settings", "read");
  } catch (error) {
    redirect("/dashboard");
  }
  return <>{children}</>;
}

