import Link from "next/link";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";
import WhatsAppWidget from "@/components/WhatsAppWidget";
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Phone,
  ShieldCheck,
  Zap,
  HelpCircle,
  Clock,
  Printer,
  Headphones,
} from "lucide-react";

export const metadata = {
  title: "Subscription Plans & Pricing - SkinLab POS by Falcon Swift",
  description:
    "Simple, transparent pricing for aesthetic clinics and salons. PKR 3,000/month with unlimited patients, POS, and thermal printing.",
};

export default function PlanPage() {
  const planFeatures = [
    "Unlimited Patients Database & Medical IDs",
    "Unlimited POS Invoices & Sales History",
    "Multi-Session Treatment Package Tracking",
    "Patient Advance Wallet & Overdue Dues Ledger",
    "Expense Management & Cashflow Audit Trails",
    "Unlimited Staff, Doctor & Cashier Accounts (RBAC)",
    "Instant 80mm & 58mm Thermal Receipt Printing",
    "Real-time Alerts & Notification Center",
    "Custom Clinic Branding, Logo & Theme Engine",
    "Cloud Synchronization & Automated Daily Backups",
    "Direct WhatsApp Tech Support & Onboarding",
  ];

  const faqs = [
    {
      q: "How does the PKR 3,000 / month subscription work?",
      a: "You get full, unrestricted access to all SkinLab POS features, unlimited patients, thermal printing, and multi-user roles for just PKR 3,000 per month.",
    },
    {
      q: "Can I use thermal printers with this software?",
      a: "Yes! SkinLab supports standard 80mm and 58mm ESC/POS USB and network thermal receipt printers right out of the box with custom clinic logos and QR codes.",
    },
    {
      q: "How do I make the monthly subscription payment?",
      a: "You can pay easily via Bank Transfer, Raast, JazzCash, or EasyPaisa. Our WhatsApp team (0326-3392082) assists you instantly upon account creation.",
    },
    {
      q: "Can multiple staff members and doctors use it simultaneously?",
      a: "Absolutely. You can create separate role-based logins for receptionists, managers, doctors, and cashiers with custom permission levels.",
    },
    {
      q: "Is my clinic and patient data secure?",
      a: "Yes, your database is hosted on enterprise cloud infrastructure with end-to-end encryption and regular automated backups.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col selection:bg-indigo-100">
      <PublicNavbar />

      {/* Header */}
      <section className="bg-gradient-to-b from-white to-slate-50 py-16 sm:py-20 border-b border-slate-200/70">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">

          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Simple, all-inclusive pricing for your clinic.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 font-medium max-w-2xl mx-auto">
            No hidden setup fees, no per-patient charges. Everything you need to run your clinic smoothly.
          </p>
        </div>
      </section>

      {/* Pricing Card Section */}
      <section className="py-12 sm:py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border-2 border-indigo-500/80 shadow-2xl overflow-hidden relative">
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-indigo-600 to-cyan-600 py-3 px-6 text-white text-center text-xs sm:text-sm font-black uppercase tracking-wider">
            ⭐ Most Popular • Full Clinic Suite
          </div>

          <div className="p-6 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left: Price & CTA */}
            <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-full">
                  Monthly Subscription
                </span>
                <div className="mt-4 flex items-baseline justify-center lg:justify-start gap-2">
                  <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                    PKR 3,000
                  </span>
                  <span className="text-slate-500 font-semibold text-base">/ month</span>
                </div>
                <p className="text-xs text-slate-500 mt-2 font-medium">
                  Billed monthly • Cancel anytime • Dedicated WhatsApp support
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <Link
                  href="/signup?plan=monthly"
                  style={{
                    backgroundColor: "var(--color-primary, #4f46e5)",
                    color: "var(--color-primary-text, #ffffff)",
                  }}
                  className="w-full py-4 px-6 rounded-2xl font-bold text-base shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                >
                  <span>Choose Plan &amp; Sign Up</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <a
                  href="https://wa.me/923263392082?text=Hello%20Falcon%20Swift%2C%20I%20want%20to%20subscribe%20to%20SkinLab%20POS%20(PKR%203000%2Fmo)."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl font-bold text-sm hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>Contact Sales (0326-3392082)</span>
                </a>
              </div>

              <div className="pt-4 flex items-center justify-center lg:justify-start gap-4 text-xs text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" /> 100% Data Privacy
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="w-4 h-4 text-amber-500" /> Instant Setup
                </span>
              </div>
            </div>

            {/* Right: Feature Highlights */}
            <div className="lg:col-span-7 bg-slate-50/80 p-6 sm:p-8 rounded-3xl border border-slate-200/80 space-y-4">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" /> What's Included in the PKR 3,000 Plan:
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                {planFeatures.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 font-medium text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-500 text-sm font-medium">
            Got questions about setup, devices, or payments? We're here to help.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-2"
            >
              <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                {faq.q}
              </h4>
              <p className="text-sm text-slate-600 font-medium leading-relaxed pl-6">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      <PublicFooter />
      <WhatsAppWidget />
    </div>
  );
}
