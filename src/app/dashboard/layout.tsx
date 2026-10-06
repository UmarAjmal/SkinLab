import { getServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import TopHeader from "@/components/layout/TopHeader";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let session;
  try {
    session = await getServerSession();
    if (!session || !session.user) {
      redirect("/login");
    }
    if ((session.user as any)?.is_first_login) {
      redirect("/welcome");
    }
  } catch (error: any) {
    if (error?.message === "NEXT_REDIRECT") throw error;
    redirect("/login");
  }

  const role = (session?.user as any)?.role || "User";
  const email = session?.user?.email || "Unknown";
  const permissions = (session?.user as any)?.permissions || [];

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50 overflow-hidden selection:bg-indigo-100">
      {/* Full-width TopHeader at the top of the entire page */}
      <TopHeader userEmail={email} userRole={role} />

      {/* Main content body with Sidebar on left and page canvas on right */}
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar userEmail={email} userRole={role} userPermissions={permissions} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col min-h-0 min-w-0 relative w-full transition-all duration-300 ease-in-out pb-20 md:pb-0">
          <div className="p-3 sm:p-5 md:p-6 lg:p-8 flex-1 flex flex-col min-w-0 w-full max-w-[1920px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Native-Style Bottom Navigation Dock (Phones & Small Tablets) */}
      <MobileBottomNav />
    </div>
  );
}

