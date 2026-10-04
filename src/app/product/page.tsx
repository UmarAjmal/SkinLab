import Link from "next/link";
import Image from "next/image";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";
import WhatsAppWidget from "@/components/WhatsAppWidget";
import {
  Users,
  ShoppingCart,
  Package,
  Receipt,
  BarChart3,
  ShieldCheck,
  BellRing,
  Palette,
  Printer,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Phone,
  Flame,
  Zap,
} from "lucide-react";

export const metadata = {
  title: "Product & Clinical Modules - SkinLab POS by Falcon Swift",
  description:
    "Explore the complete suite of features in SkinLab: PRM, POS Billing, Packages, Expense Management, Reports, and RBAC.",
};

export default function ProductPage() {
  const modules = [
    {
      icon: Users,
      title: "Patient Relationship Management (PRM)",
      badge: "Core Module",
      desc: "Complete digital medical records, unique MRIDs, contact tracking, advance deposit wallets, and automated overdue dues ledger.",
      features: [
        "Patient medical profiles with visit history",
        "Advance deposit wallet system",
        "Active dues & partial payment tracking",
        "Instant search by name, phone, or MRID",
      ],
      color: "from-blue-600 to-indigo-600",
      lightBg: "bg-blue-50 text-blue-700",
    },
    {
      icon: ShoppingCart,
      title: "Fast POS Billing & Thermal Receipts",
      badge: "High Performance",
      desc: "Instant point of sale checkout for services, aesthetic treatments, and packages with automatic thermal printer receipts.",
      features: [
        "1-Click thermal invoice printing (80mm & 58mm)",
        "Cash, Bank Card, Online, & Credit payment splits",
        "Doctor consultation & staff attribution",
        "Instant return & refund processing",
      ],
      color: "from-emerald-600 to-teal-600",
      lightBg: "bg-emerald-50 text-emerald-700",
    },
    {
      icon: Package,
      title: "Multi-Session Packages & Deals",
      badge: "Aesthetics Special",
      desc: "Bundle individual procedures into multi-session packages with intelligent per-session consumption deduction tracking.",
      features: [
        "Package creation with session limits",
        "Per-visit session check-in & deduction",
        "Remaining sessions ledger per patient",
        "Prevents billing discrepancies across treatments",
      ],
      color: "from-purple-600 to-indigo-600",
      lightBg: "bg-purple-50 text-purple-700",
    },
    {
      icon: Receipt,
      title: "Expense Management & Cashflow",
      badge: "Financial Control",
      desc: "Log clinic operating expenses, generator fuel, rent, consumables, and doctor payouts with custom categorization.",
      features: [
        "Custom expense categories & tags",
        "Voucher numbers & payee tracking",
        "Monthly and filtered expenditure totals",
        "Direct CSV export for accounting",
      ],
      color: "from-rose-600 to-amber-600",
      lightBg: "bg-rose-50 text-rose-700",
    },
    {
      icon: BarChart3,
      title: "Financial Reports & Analytics",
      badge: "Real-time BI",
      desc: "Comprehensive insights into daily sales, top performing treatments, payment method breakdowns, and patient ledgers.",
      features: [
        "Daily, weekly, & monthly sales registers",
        "Top treatments & revenue ranking",
        "Expense vs revenue profit analysis",
        "1-Click CSV data exports",
      ],
      color: "from-amber-600 to-orange-600",
      lightBg: "bg-amber-50 text-amber-700",
    },
    {
      icon: ShieldCheck,
      title: "Multi-User Staff & RBAC Security",
      badge: "Enterprise Security",
      desc: "Granular permissions for Doctors, Receptionists, Clinic Managers, and Admins to safeguard sensitive revenue data.",
      features: [
        "Custom role permissions per module",
        "Doctor and staff commission tracking",
        "Staff activity audit trail",
        "Password & credential control",
      ],
      color: "from-sky-600 to-blue-600",
      lightBg: "bg-sky-50 text-sky-700",
    },
    {
      icon: BellRing,
      title: "Real-time Notification Engine",
      badge: "Stay Updated",
      desc: "Instant live alerts for new sales, invoice modifications, expense additions, overdue debts, and end-of-day reports.",
      features: [
        "In-app notification center",
        "Targeted role-based notification dispatch",
        "End of day & month sales summaries",
        "Capacitor Android native push ready",
      ],
      color: "from-violet-600 to-purple-600",
      lightBg: "bg-violet-50 text-violet-700",
    },
    {
      icon: Palette,
      title: "Dynamic Theme & Brand Customization",
      badge: "Unique Look",
      desc: "Personalize your clinic software colors, brand logo, receipt header/footer, and choose curated color presets.",
      features: [
        "Curated presets (Modern, Rose, Obsidian, Emerald, etc.)",
        "Fine-tune primary, accent, & sidebar colors",
        "Instant live preview without page refresh",
        "Custom clinic logo on invoices & header",
      ],
      color: "from-fuchsia-600 to-pink-600",
      lightBg: "bg-fuchsia-50 text-fuchsia-700",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col selection:bg-indigo-100">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-slate-50 py-16 sm:py-24 border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs sm:text-sm font-bold shadow-2xs">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Complete Clinical Operating System</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Everything your aesthetic clinic needs to{" "}
            <span
              style={{ color: "var(--color-primary, #4f46e5)" }}
              className="bg-clip-text"
            >
              scale effortlessly.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
            Designed specifically for aesthetic centers, dermatology clinics, and medical spas.
            From patient intake to multi-session treatment packages and financial intelligence.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              style={{
                backgroundColor: "var(--color-primary, #4f46e5)",
                color: "var(--color-primary-text, #ffffff)",
              }}
              className="px-8 py-3.5 rounded-2xl font-bold text-base shadow-lg hover:brightness-110 transition-all flex items-center gap-2.5 active:scale-98"
            >
              <span>Start Monthly Plan (PKR 3,000)</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <a
              href="https://wa.me/923263392082?text=Hello%20Falcon%20Swift%2C%20I%20want%20a%20live%20demo%20of%20SkinLab%20POS."
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl font-bold text-base hover:bg-emerald-100 transition-all flex items-center gap-2"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>Get WhatsApp Demo (0326-3392082)</span>
            </a>
          </div>
        </div>
      </section>

      {/* Modules Grid */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-3">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Integrated Core Modules
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto font-medium text-sm sm:text-base">
            Engineered with high standards of data security, responsiveness, and speed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {modules.map((mod, idx) => {
            const Icon = mod.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-3xl p-7 border border-slate-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${mod.color} text-white flex items-center justify-center shadow-md`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[11px] font-extrabold px-3 py-1 rounded-full ${mod.lightBg}`}>
                      {mod.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    {mod.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {mod.desc}
                  </p>

                  <ul className="space-y-2 pt-2 border-t border-slate-100">
                    {mod.features.map((f, fIdx) => (
                      <li key={fIdx} className="text-xs text-slate-600 flex items-start gap-2 font-medium">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6">
                  <Link
                    href="/signup"
                    className="w-full py-2.5 px-4 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-200"
                  >
                    <span>Use this in your clinic</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 py-16 text-white border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Ready to streamline your clinic management?
          </h2>
          <p className="text-slate-300 max-w-xl mx-auto text-sm sm:text-base font-medium">
            Join clinics powered by Falcon Swift PVT. LTD. Set up your workspace in under 2 minutes.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-lg transition-all flex items-center gap-2"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/plan"
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-all border border-white/20"
            >
              View Pricing (PKR 3,000/mo)
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
      <WhatsAppWidget />
    </div>
  );
}
