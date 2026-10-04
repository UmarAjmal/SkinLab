import { getServerSession } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FlaskConical, Users, ShoppingBag, BarChart3, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

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
    <div className="min-h-screen bg-slate-50 font-sans flex items-center justify-center overflow-hidden relative selection:bg-indigo-100">
      <div className="max-w-7xl w-full mx-auto px-6 sm:px-12 lg:px-16 py-12 lg:py-20 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20 z-10">
        
        {/* Left Column: Content */}
        <div className="flex-1 w-full max-w-xl flex flex-col items-start text-left">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 mb-10">
            <div 
              style={{ 
                background: `linear-gradient(135deg, var(--color-primary, #4f46e5), var(--color-accent, #06b6d4))` 
              }}
              className="p-2.5 rounded-2xl text-white shadow-md shadow-black/5 shrink-0 flex items-center justify-center w-12 h-12 overflow-hidden"
            >
              {clinicLogo ? (
                <img
                  src={clinicLogo}
                  alt={clinicName}
                  className="w-full h-full object-contain p-0.5 bg-white/10 rounded-xl"
                />
              ) : (
                <FlaskConical className="w-6 h-6 text-white" strokeWidth={2.5} />
              )}
            </div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              {clinicName}
              <span 
                style={{ 
                  backgroundColor: "var(--color-primary, #4f46e5)",
                  color: "var(--color-primary-text, #ffffff)"
                }}
                className="text-[11px] uppercase px-2.5 py-0.5 rounded-lg font-extrabold tracking-wider shadow-xs"
              >
                POS
              </span>
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12] mb-6">
            Welcome to <br />
            <span 
              style={{ color: "var(--color-primary, #4f46e5)" }}
              className="transition-colors duration-300"
            >
              {clinicName} POS
            </span>
          </h1>
          <p className="text-lg text-slate-600 mb-10 max-w-md leading-relaxed font-medium">
            The all-in-one system to manage your clinic, patients, services, and sales effortlessly.
          </p>

          {/* Feature List */}
          <div className="space-y-5 mb-12 w-full">
            
            {/* Feature 1 */}
            <div className="flex items-start group">
              <div className="flex-shrink-0 mt-0.5">
                <div 
                  style={{ 
                    backgroundColor: "var(--color-primary-light, #eef2ff)",
                    color: "var(--color-primary, #4f46e5)"
                  }}
                  className="p-3 rounded-2xl shadow-xs transition-transform duration-200 group-hover:scale-105"
                >
                  <Users className="w-6 h-6" strokeWidth={2} />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-base font-bold text-slate-900">Manage Patients</h3>
                <p className="mt-0.5 text-sm text-slate-500 font-medium leading-relaxed">
                  Easily manage patient records, medical history, and sessions.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start group">
              <div className="flex-shrink-0 mt-0.5">
                <div 
                  style={{ 
                    backgroundColor: "var(--color-primary-light, #eef2ff)",
                    color: "var(--color-primary, #4f46e5)"
                  }}
                  className="p-3 rounded-2xl shadow-xs transition-transform duration-200 group-hover:scale-105"
                >
                  <ShoppingBag className="w-6 h-6" strokeWidth={2} />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-base font-bold text-slate-900">Track Services &amp; Sales</h3>
                <p className="mt-0.5 text-sm text-slate-500 font-medium leading-relaxed">
                  Manage aesthetic treatments, POS billing, and real-time sales.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start group">
              <div className="flex-shrink-0 mt-0.5">
                <div 
                  style={{ 
                    backgroundColor: "var(--color-primary-light, #eef2ff)",
                    color: "var(--color-primary, #4f46e5)"
                  }}
                  className="p-3 rounded-2xl shadow-xs transition-transform duration-200 group-hover:scale-105"
                >
                  <BarChart3 className="w-6 h-6" strokeWidth={2} />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-base font-bold text-slate-900">Reports &amp; Analytics</h3>
                <p className="mt-0.5 text-sm text-slate-500 font-medium leading-relaxed">
                  Get real-time insights, revenue breakdowns, and business growth.
                </p>
              </div>
            </div>
            
          </div>

          {/* CTA Button */}
          <Link
            href="/login"
            style={{ 
              backgroundColor: "var(--color-primary, #4f46e5)",
              color: "var(--color-primary-text, #ffffff)"
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-4 border border-transparent text-base sm:text-lg font-bold rounded-2xl shadow-lg hover:brightness-110 hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer"
          >
            <span>Get Started</span>
            <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
          </Link>

          {/* Footer mini text */}
          <div className="mt-10 flex items-center text-sm text-slate-500 font-medium">
            <ShieldCheck 
              style={{ color: "var(--color-primary, #4f46e5)" }} 
              className="h-5 w-5 mr-2 shrink-0" 
            />
            <span>Secure</span>
            <span className="mx-2 text-slate-300">•</span>
            <span>Reliable</span>
            <span className="mx-2 text-slate-300">•</span>
            <span>Built for Modern Clinics</span>
          </div>

        </div>

        {/* Right Column: Hero Image/Illustration */}
        <div className="flex-1 w-full flex justify-center lg:justify-end relative">
          <div className="relative w-full max-w-lg lg:max-w-xl aspect-square drop-shadow-2xl hover:scale-[1.01] transition-transform duration-500">
            <Image
              src="/landing-hero.jpg"
              alt="Clinic POS Interface Illustration"
              fill
              className="object-contain rounded-3xl"
              priority
            />
          </div>
        </div>

      </div>
    </div>
  );
}
