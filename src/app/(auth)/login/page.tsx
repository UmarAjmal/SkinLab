"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FlaskConical, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [clinicName, setClinicName] = useState("Skin-Lab");
  const [clinicLogo, setClinicLogo] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings/public")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.name) setClinicName(d.name);
        if (d?.logo) setClinicLogo(d.logo);
      })
      .catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError("");
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
        callbackUrl,
      });

      if (!res?.error) {
        window.location.href = res?.url || callbackUrl;
      } else {
        setError("Invalid email or password");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full max-w-[380px]">
        {/* Card Container */}
        <div className="bg-white py-8 px-6 shadow-sm rounded-3xl border border-gray-100">
          
          {/* Logo & Wordmark */}
          <div className="flex items-center justify-center space-x-2.5 mb-8">
            <div 
              style={{ 
                background: `linear-gradient(135deg, var(--color-primary, #4f46e5), var(--color-accent, #06b6d4))` 
              }}
              className="w-10 h-10 rounded-xl text-white shadow-xs flex items-center justify-center shrink-0 overflow-hidden"
            >
              {clinicLogo ? (
                <img
                  src={clinicLogo}
                  alt={clinicName}
                  className="w-full h-full object-contain p-1 bg-white/10"
                />
              ) : (
                <FlaskConical className="w-5 h-5 text-white" strokeWidth={2.5} />
              )}
            </div>
            <span className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-1.5">
              {clinicName}
              <span 
                style={{ 
                  backgroundColor: "var(--color-primary, #4f46e5)",
                  color: "var(--color-primary-text, #ffffff)"
                }}
                className="text-[10px] uppercase px-2 py-0.5 rounded-md font-bold"
              >
                POS
              </span>
            </span>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Sign in to access your clinic dashboard.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-sm text-center border border-red-100 font-medium">
                {error}
              </div>
            )}
            
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  {...register("email")}
                  type="email"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent sm:text-sm transition-all outline-none text-gray-900 placeholder-gray-400 bg-gray-50/50 focus:bg-white"
                  placeholder="admin@skinlab.local"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  className="block w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent sm:text-sm transition-all outline-none text-gray-900 placeholder-gray-400 bg-gray-50/50 focus:bg-white"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600 cursor-pointer">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
                {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />}
              </button>
            </div>
          </form>
        </div>
        
        {/* Footer */}
        <div className="mt-6 flex items-center justify-center text-xs text-gray-400 space-x-1.5">
          <ShieldCheck className="h-4 w-4" />
          <span>Secure clinic access only</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
