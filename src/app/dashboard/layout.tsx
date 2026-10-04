import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import TopHeader from "@/components/layout/TopHeader";

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let session;
  try {
    session = await getServerSession();
    if (!session || !session.user) {
      redirect("/login");
    }
  } catch (error) {
    redirect("/login");
  }

  const role = (session?.user as any)?.role || "User";
  const email = session?.user?.email || "Unknown";
  const permissions = (session?.user as any)?.permissions || [];

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Full-width TopHeader at the top of the entire page */}
      <TopHeader userEmail={email} userRole={role} />

      {/* Main content body with Sidebar on left and page canvas on right */}
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar userEmail={email} userRole={role} userPermissions={permissions} />

        <main className="flex-1 overflow-auto flex flex-col min-h-0 min-w-0 relative w-full transition-all duration-300 ease-in-out">
          <div className="p-4 md:p-6 lg:p-8 flex-1 flex flex-col min-w-0 w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
