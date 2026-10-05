import { getServerSession } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";
import WhatsAppWidget from "@/components/WhatsAppWidget";
import {
  FlaskConical,
  Users,
  ShoppingCart,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Package,
  Receipt,
  Phone,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession();

  if (session) {
    redirect("/dashboard");
  }

  let clinicName = "Skin-Lab";
  let clinicLogo: string | null = null;

  try {
    const settings = await prisma.companySetting.findFirst();
    if (settings?.name) clinicName = settings.name;
    if (settings?.logo) clinicLogo = settings.logo;
  } catch (err) {
    console.error("Home page settings fetch error:", err);
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col selection:bg-indigo-100">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-slate-50 py-12 sm:py-20 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
          {/* Left Column */}
          <div className="flex-1 w-full max-w-xl text-left space-y-6">

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
              Elevate Your <br />
              <span
                style={{ color: "var(--color-primary, #4f46e5)" }}
                className="bg-clip-text"
              >
                Clinic &amp; POS Operations
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-medium">
              The complete clinical management suite for aesthetic centers, dermatology clinics, and medspas.
              Manage patient databases, POS invoicing, multi-session packages, and expense tracking seamlessly.
            </p>

            {/* CTA Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3.5">
              <Link
                href="/signup"
                style={{
                  backgroundColor: "var(--color-primary, #4f46e5)",
                  color: "var(--color-primary-text, #ffffff)",
                }}
                className="px-7 py-3.5 rounded-2xl font-bold text-sm sm:text-base shadow-lg hover:brightness-110 transition-all flex items-center gap-2 active:scale-98 cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/product"
                className="px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm sm:text-base rounded-2xl border border-slate-200 shadow-2xs transition-all flex items-center gap-2"
              >
                <span>Explore Features</span>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 border-t border-slate-200/80">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 80mm/58mm Thermal Printing
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Multi-Session Packages
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Real-time RBAC Alerts
              </span>
            </div>
          </div>

          {/* Right Column Illustration */}
          <div className="flex-1 w-full flex justify-center lg:justify-end">
            <div className="relative w-full max-w-lg aspect-square drop-shadow-2xl hover:scale-[1.01] transition-transform duration-500">
              <Image
                src="/landing-hero.jpg"
                alt="Clinic POS Management Dashboard"
                fill
                className="object-contain rounded-3xl"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-3">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Designed specifically for modern clinics
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto text-sm sm:text-base font-medium">
            Everything you need to streamline patient consultations, billing, and financial reports.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Patient Relationship Management
            </h3>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              Complete patient medical profiles, visit history, advance deposit wallet, and automated overdue dues tracker.
            </p>
            <Link
              href="/product"
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 pt-2"
            >
              <span>Learn about PRM</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Point of Sale &amp; Thermal Receipts
            </h3>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              Fast POS checkout for procedures and treatments, with instant ESC/POS 80mm &amp; 58mm thermal receipts printing.
            </p>
            <Link
              href="/product"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 pt-2"
            >
              <span>Learn about POS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Packages &amp; Multi-Sessions
            </h3>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              Bundle aesthetic services into multi-session deals. Track session deductions per visit automatically without error.
            </p>
            <Link
              href="/product"
              className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700 pt-2"
            >
              <span>Learn about Packages</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="bg-slate-900 text-white py-16 sm:py-20 border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            One simple plan for your entire clinic.
          </h2>

          <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base font-medium">
            Includes all modules, unlimited invoices, multi-user accounts, thermal printer integration, and continuous cloud backup.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-base shadow-lg transition-all flex items-center gap-2"
            >
              <span>Create Clinic Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/plan"
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-base transition-all border border-white/20"
            >
              <span>View Full Plan Details</span>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
      <WhatsAppWidget />
    </div>
  );
}
