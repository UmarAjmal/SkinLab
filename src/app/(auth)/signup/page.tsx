"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FlaskConical,
  User,
  Mail,
  Lock,
  Phone,
  Building2,
  MapPin,
  FileText,
  Upload,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Check,
  Image as ImageIcon,
} from "lucide-react";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Wizard Step State (1: Personal, 2: Plan, 3: Business & Branding)
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Personal Info
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2: Plan
  const [selectedPlan, setSelectedPlan] = useState("Monthly Subscription");

  // Step 3: Business & Branding Info
  const [businessName, setBusinessName] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [footerNote, setFooterNote] = useState("Thank you for choosing our clinic!");
  const [logo, setLogo] = useState<string | null>(null);

  // Logo file handler
  const handleLogoUpload = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (PNG, JPG, SVG, WebP)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64) setLogo(base64);
    };
    reader.readAsDataURL(file);
  };

  // Step 1 Validation
  const handleNextFromPersonal = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Auto populate business phone with personal phone if empty
    if (!businessPhone) setBusinessPhone(phone);
    if (!businessName) setBusinessName(`${fullName}'s Aesthetic Clinic`);

    setStep(2);
  };

  // Step 2 Next
  const handleNextFromPlan = () => {
    setError("");
    setStep(3);
  };

  // Final Submit
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!businessName.trim()) {
      setError("Please enter your Business / Clinic name.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
          password,
          plan: selectedPlan,
          businessName: businessName.trim(),
          businessPhone: businessPhone.trim() || phone.trim(),
          businessAddress: businessAddress.trim(),
          taxNumber: taxNumber.trim(),
          footerNote: footerNote.trim(),
          logo,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      // Success -> Redirect to login with created banner & auto-fill
      router.push(`/login?registered=true&email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col selection:bg-indigo-100">
      <PublicNavbar />

      <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Progress Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-lg mx-auto relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 w-full bg-slate-200 -z-0"></div>
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 transition-all duration-300 -z-0"
              style={{ width: step === 1 ? "0%" : step === 2 ? "50%" : "100%" }}
            ></div>

            {/* Step 1 Circle */}
            <div className="relative z-10 flex flex-col items-center gap-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-xs ${
                  step >= 1
                    ? "bg-indigo-600 text-white ring-4 ring-indigo-50"
                    : "bg-white text-slate-400 border border-slate-300"
                }`}
              >
                {step > 1 ? <Check className="w-4 h-4" /> : "1"}
              </div>
              <span className="text-[11px] font-bold text-slate-600">Personal</span>
            </div>

            {/* Step 2 Circle */}
            <div className="relative z-10 flex flex-col items-center gap-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-xs ${
                  step >= 2
                    ? "bg-indigo-600 text-white ring-4 ring-indigo-50"
                    : "bg-white text-slate-400 border border-slate-300"
                }`}
              >
                {step > 2 ? <Check className="w-4 h-4" /> : "2"}
              </div>
              <span className="text-[11px] font-bold text-slate-600">Plan</span>
            </div>

            {/* Step 3 Circle */}
            <div className="relative z-10 flex flex-col items-center gap-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-xs ${
                  step === 3
                    ? "bg-indigo-600 text-white ring-4 ring-indigo-50"
                    : "bg-white text-slate-400 border border-slate-300"
                }`}
              >
                3
              </div>
              <span className="text-[11px] font-bold text-slate-600">Business</span>
            </div>
          </div>
        </div>

        {/* Card Box */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-xl">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-semibold rounded-2xl">
              {error}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* STEP 1: Personal Information */}
          {/* ══════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <form onSubmit={handleNextFromPersonal} className="space-y-5">
              <div className="text-center sm:text-left space-y-1 mb-6">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Step 1: Your Personal Profile
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm font-medium">
                  Enter your contact details to create your administrator account.
                </p>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Aamish Rehmani"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-sm text-slate-800 font-medium outline-none bg-slate-50/50 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Phone & Email Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Phone / WhatsApp *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0326-3392082"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-sm text-slate-800 font-medium outline-none bg-slate-50/50 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="doctor@clinic.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-sm text-slate-800 font-medium outline-none bg-slate-50/50 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Create Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-sm text-slate-800 font-medium outline-none bg-slate-50/50 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-sm text-slate-800 font-medium outline-none bg-slate-50/50 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <Link
                  href="/login"
                  className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-indigo-600"
                >
                  Already have an account? Log in
                </Link>

                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <span>Continue to Plan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* STEP 2: Subscription Plan Selection */}
          {/* ══════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center sm:text-left space-y-1 mb-4">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Step 2: Select Your Subscription Plan
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm font-medium">
                  Choose your clinic operating plan.
                </p>
              </div>

              {/* Plan Card */}
              <div
                onClick={() => setSelectedPlan("Monthly Subscription")}
                className="p-6 rounded-3xl border-2 border-indigo-600 bg-indigo-50/40 shadow-md cursor-pointer transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5" /> Recommended Plan
                  </div>
                  <h3 className="text-xl font-black text-slate-900">
                    Monthly Subscription Suite
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">
                    Unlimited patients, POS invoicing, packages, thermal printing, and multi-user RBAC.
                  </p>
                </div>

                <div className="text-right sm:text-right shrink-0">
                  <div className="text-2xl sm:text-3xl font-black text-slate-900">
                    PKR 3,000
                  </div>
                  <div className="text-xs text-slate-500 font-bold">per month</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Falcon Swift Subscription Promise:
                </div>
                <p>
                  Your account is activated instantly with 30-day billing cycle. Invoices are generated automatically with official receipt.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <button
                  type="button"
                  onClick={handleNextFromPlan}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <span>Continue to Business Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* STEP 3: Business & Branding Info */}
          {/* ══════════════════════════════════════════════════════════ */}
          {step === 3 && (
            <form onSubmit={handleFinalSubmit} className="space-y-5">
              <div className="text-center sm:text-left space-y-1 mb-6">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Step 3: Clinic Profile &amp; Branding
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm font-medium">
                  Configure your clinic name, contact info, and branding logo for POS receipts.
                </p>
              </div>

              {/* Clinic Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Clinic / Business Name *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. SkinLab Aesthetic Clinic"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-sm text-slate-800 font-medium outline-none bg-slate-50/50 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Clinic Phone & Tax Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Clinic Contact Phone
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={businessPhone}
                      onChange={(e) => setBusinessPhone(e.target.value)}
                      placeholder="0326-3392082"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-sm text-slate-800 font-medium outline-none bg-slate-50/50 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    NTN / Tax Number (Optional)
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={taxNumber}
                      onChange={(e) => setTaxNumber(e.target.value)}
                      placeholder="e.g. 1234567-8"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-sm text-slate-800 font-medium outline-none bg-slate-50/50 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Clinic Physical Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    placeholder="e.g. Suite 402, Medical Plaza, Gulberg III, Lahore"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-sm text-slate-800 font-medium outline-none bg-slate-50/50 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Logo Upload Box */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Clinic Brand Logo (Printed on Invoices &amp; Header)
                </label>
                <div className="flex items-center gap-4">
                  {logo ? (
                    <div className="w-16 h-16 rounded-2xl border-2 border-indigo-200 p-1 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden relative group">
                      <img src={logo} alt="Uploaded logo preview" className="w-full h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setLogo(null)}
                        className="absolute inset-0 bg-black/60 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <label className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/50 flex flex-col items-center justify-center cursor-pointer transition-all text-slate-400 hover:text-indigo-600 shrink-0">
                      <Upload className="w-5 h-5" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleLogoUpload(file);
                        }}
                      />
                    </label>
                  )}

                  <div className="text-xs text-slate-500 font-medium">
                    Upload PNG, JPG, or SVG logo. You can also customize this anytime in Clinic Settings.
                  </div>
                </div>
              </div>

              <div className="pt-6 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-70 cursor-pointer"
                >
                  {loading ? (
                    <span>Initializing Workspace...</span>
                  ) : (
                    <>
                      <span>Complete Setup &amp; Create Account</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
