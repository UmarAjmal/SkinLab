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
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 overflow-hidden">
      <Sidebar userEmail={email} userRole={role} userPermissions={permissions} />

      {/* Main content */}
      <main className="flex-1 overflow-auto flex flex-col min-h-0 min-w-0 relative w-full transition-all duration-300 ease-in-out">
        <TopHeader userEmail={email} userRole={role} />
        <div className="p-4 md:p-6 lg:p-8 flex-1 flex flex-col min-w-0 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
