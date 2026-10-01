import { requireModulePermission } from "@/lib/permissions";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function PurchasesLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireModulePermission("purchases", "read");
  } catch (error) {
    redirect("/dashboard");
  }

  
  // Minimal tab navigation layout
  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Purchases & Suppliers</h1>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-1.5 max-w-md">
        <nav className="flex space-x-2" aria-label="Tabs">
          <Link
            href="/dashboard/purchases"
            className="flex-1 text-center px-4 py-2.5 text-sm font-semibold rounded-xl hover:bg-gray-50 text-gray-700 transition-colors"
          >
            Purchases
          </Link>
          <Link
            href="/dashboard/purchases/suppliers"
            className="flex-1 text-center px-4 py-2.5 text-sm font-semibold rounded-xl hover:bg-gray-50 text-gray-700 transition-colors"
          >
            Suppliers
          </Link>
        </nav>
      </div>

      <div className="flex-1 overflow-auto bg-white rounded-3xl shadow-xs border border-gray-100 p-4 sm:p-6 min-w-0">
        {children}
      </div>
    </div>
  );
}
