import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Skin-Lab POS | Clinic Management System",
  description: "All-in-one point-of-sale and clinic management system for aesthetic clinics, dermatology centers, and medical spas.",
  openGraph: {
    title: "Skin-Lab POS | Clinic Management System",
    description: "All-in-one point-of-sale and clinic management system for aesthetic clinics, dermatology centers, and medical spas.",
  },
};

export const viewport: Viewport = {
  themeColor: "#4338ca",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ colorScheme: "light" }}>
      <body
        className={` {geistSans.variable}  {geistMono.variable} antialiased text-slate-900 bg-slate-50`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );

}
