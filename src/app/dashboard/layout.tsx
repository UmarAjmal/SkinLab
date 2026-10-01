import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let session;
  try {
    session = await requireRole(["Admin", "Manager", "Doctor", "Cashier"]);
  } catch (error) {
    redirect("/login");
  }

  const role = (session?.user as any)?.role;
  const email = session?.user?.email || "Unknown";

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 overflow-hidden">
      <Sidebar userEmail={email} userRole={role} />

      {/* Main content */}
      <main className="flex-1 overflow-auto flex flex-col min-h-0 min-w-0 relative w-full transition-all duration-300 ease-in-out">
        <div className="p-4 md:p-6 lg:p-8 flex-1 flex flex-col min-w-0 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
