"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallbackUrl = searchParams.get("callbackUrl");
  let callbackUrl = "/dashboard";
  if (rawCallbackUrl) {
    if (rawCallbackUrl.startsWith("/")) {
      callbackUrl = rawCallbackUrl;
    } else {
      try {
        const parsed = new URL(rawCallbackUrl);
        if (parsed.hostname.endsWith("vercel.app") || parsed.hostname === "localhost") {
          callbackUrl = parsed.pathname + parsed.search;
        }
      } catch {
        callbackUrl = "/dashboard";
      }
    }
  }
  const registered = searchParams.get("registered") === "true";
  const newUser = searchParams.get("new_user") === "true";
  const prefilledEmail = searchParams.get("email") || "";
  
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: prefilledEmail,
      password: "",
    },
  });

  useEffect(() => {
    if (prefilledEmail) {
      setValue("email", prefilledEmail);
    }
  }, [prefilledEmail, setValue]);

  const onSubmit = async (data: LoginFormValues) => {
    setError("");
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
        callbackUrl,
      });

      if (res?.ok && !res?.error) {
        // Fetch session to check if first login
        try {
          const sessRes = await fetch("/api/auth/session");
          const sessData = await sessRes.json();
          if (sessData?.user?.is_first_login) {
            window.location.href = "/welcome";
            return;
          }
        } catch (e) {
          // ignore
        }
        window.location.href = res?.url || callbackUrl;
      } else {
        setError(res?.error === "CredentialsSignin" ? "Invalid email or password" : (res?.error || "Invalid email or password"));
      }
    } catch (err: any) {
      console.error("Login submission error:", err);
      setError(err?.message || "An unexpected error occurred");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-indigo-100 relative">
      {/* Back to Website Button */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Website</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full max-w-[420px]">
        {/* Card Container */}
        <div className="bg-white py-8 px-6 sm:px-8 shadow-xl rounded-3xl border border-slate-200/80">
          
          {/* Brand Logo & Wordmark */}
          <div className="flex flex-col items-center justify-center mb-6 text-center">
            <div className="w-16 h-16 rounded-full bg-white border border-slate-200/90 shadow-xs flex items-center justify-center p-2 mb-2.5 shrink-0 overflow-hidden ring-4 ring-indigo-50/70">
              <img
                src="/logo.png"
                alt="Falcon Swift"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-xl font-black text-slate-900 tracking-tight">
                Falcon Swift
              </span>
              <span 
                style={{ 
                  backgroundColor: "var(--color-primary, #4f46e5)",
                  color: "var(--color-primary-text, #ffffff)"
                }}
                className="text-[9px] uppercase px-2 py-0.5 rounded-md font-extrabold tracking-wider"
              >
                PVT. LTD.
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
              Clinic &amp; Healthcare POS
            </p>
          </div>

          {/* Registered Success Notice */}
          {(registered || newUser) && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold rounded-2xl flex items-start gap-2.5">
              <span className="text-base">🎉</span>
              <div>
                <p className="font-bold">Account &amp; Business Created Successfully!</p>
                <p className="text-xs text-emerald-700 font-medium mt-0.5">
                  Please login with your credentials to access your store.
                </p>
              </div>
            </div>
          )}

          {/* Heading */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              Welcome back
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-gray-500 font-medium">
              Sign in to manage your clinic, patients, and POS.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-xs sm:text-sm text-center border border-red-100 font-semibold">
                {error}
              </div>
            )}
            
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  {...register("email")}
                  type="email"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl shadow-xs focus:ring-2 focus:ring-indigo-600 focus:border-transparent sm:text-sm transition-all outline-none text-gray-900 placeholder-gray-400 bg-gray-50/50 focus:bg-white font-medium"
                  placeholder="doctor@clinic.local"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  className="block w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl shadow-xs focus:ring-2 focus:ring-indigo-600 focus:border-transparent sm:text-sm transition-all outline-none text-gray-900 placeholder-gray-400 bg-gray-50/50 focus:bg-white font-medium"
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
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Remember */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs font-medium text-gray-600 cursor-pointer">
                  Remember my session
                </label>
              </div>

              <div className="text-xs">
                <a
                  href="https://wa.me/923263392082?text=Hello%2C%20I%20need%20password%20reset%20assistance%20for%20SkinLab%20POS."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  Forgot password?
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed group active:scale-98 cursor-pointer"
              >
                {isSubmitting ? "Signing in..." : "Sign in to Dashboard"}
                {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />}
              </button>
            </div>
          </form>

          {/* New Account Sign Up Prompt */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-2">
            <p className="text-xs text-slate-500 font-medium">
              Don't have a clinic account yet?
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 px-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200 text-slate-800 hover:text-indigo-700 text-xs font-bold rounded-xl transition-all"
            >
              <span>Create Clinic Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-6 flex flex-col items-center justify-center text-xs text-gray-400 space-y-1 font-medium">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Developed &amp; Powered by <strong>Falcon Swift PVT. LTD.</strong></span>
          </div>
          <a
            href="https://wa.me/923263392082"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 hover:underline font-bold"
          >
            WhatsApp Support: 0326-3392082
          </a>
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
