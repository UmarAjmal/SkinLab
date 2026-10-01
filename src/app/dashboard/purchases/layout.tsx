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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1">
        <nav className="flex space-x-1" aria-label="Tabs">
          <Link
            href="/dashboard/purchases"
            className="flex-1 text-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-50 text-gray-700"
          >
            Purchases
          </Link>
          <Link
            href="/dashboard/purchases/suppliers"
            className="flex-1 text-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-50 text-gray-700"
          >
            Suppliers
          </Link>
        </nav>
      </div>

      <div className="flex-1 overflow-auto bg-white rounded-xl shadow-sm border border-gray-100">
        {children}
      </div>
    </div>
  );
}
