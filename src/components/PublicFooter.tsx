import Link from "next/link";
import { FlaskConical, Phone, Mail, ShieldCheck, Heart, Sparkles } from "lucide-react";

export default function PublicFooter() {
  return (
    <footer className="bg-slate-900 text-slate-300 font-sans border-t border-slate-800 selection:bg-indigo-900 selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Col 1: Brand Info */}
          {/* Col 1: Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center p-1.5 shadow-md shrink-0">
                <img src="/logo.png" alt="Falcon Swift" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="text-xl font-black text-white tracking-tight flex items-center gap-1.5">
                  Falcon Swift
                  <span className="text-indigo-400 font-bold text-[10px] uppercase bg-indigo-950/80 border border-indigo-800/60 px-2 py-0.5 rounded-md">
                    PVT. LTD.
                  </span>
                </span>
                <p className="text-xs text-slate-400 font-medium">
                  SkinLab Healthcare &amp; Clinical POS Systems
                </p>
              </div>
            </div>
            
            <p className="text-sm text-slate-400 max-w-md leading-relaxed font-medium">
              Enterprise clinical practice management, point-of-sale billing, multi-session package tracking, and financial intelligence suite.
            </p>

            <div className="pt-1 text-xs text-slate-400 flex flex-wrap items-center gap-x-5 gap-y-2 font-medium">
              <a
                href="https://wa.me/923263392082"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" /> WhatsApp: <strong>0326-3392082</strong>
              </a>
              <span className="flex items-center gap-1.5 text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Cloud &amp; Offline Ready
              </span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Explore Suite
            </h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Home Overview
                </Link>
              </li>
              <li>
                <Link href="/product" className="hover:text-white transition-colors">
                  Product &amp; Modules
                </Link>
              </li>
              <li>
                <Link href="/plan" className="hover:text-white transition-colors">
                  Subscription Plans
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-white transition-colors text-indigo-400 font-bold">
                  Create Clinic Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Support & Contact */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Assistance &amp; Sales
            </h4>
            <ul className="space-y-2.5 text-sm font-medium">
              <li>
                <a
                  href="https://wa.me/923263392082"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" /> +92 326-3392082
                </a>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Client Portal Sign In
                </Link>
              </li>
              <li className="text-xs text-slate-500 pt-2 leading-relaxed">
                Dedicated 24/7 WhatsApp customer onboarding &amp; tech assistance.
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>
            © {new Date().getFullYear()} <strong>Falcon Swift PVT. LTD.</strong> All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span>Secure Cloud Architecture</span>
            <span>•</span>
            <span>Real-time POS Engine</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
