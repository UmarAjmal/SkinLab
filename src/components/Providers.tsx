"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastContainer } from "@/components/ui/ToastContainer";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
        <ToastContainer />
      </ThemeProvider>
    </SessionProvider>
  );
}

