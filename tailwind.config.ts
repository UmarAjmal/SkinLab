import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          DEFAULT: "var(--color-primary, #4f46e5)",
          hover: "var(--color-primary-hover, #4338ca)",
          light: "var(--color-primary-light, #eef2ff)",
          text: "var(--color-primary-text, #ffffff)",
        },
        sidebar: {
          bg: "var(--color-sidebar-bg, #0f172a)",
          hover: "var(--color-sidebar-hover, #1e293b)",
          active: "var(--color-sidebar-active, #4f46e5)",
          text: "var(--color-sidebar-text, #cbd5e1)",
        },
        header: {
          bg: "var(--color-header-bg, #ffffff)",
        },
        accent: {
          DEFAULT: "var(--color-accent, #06b6d4)",
        },
      },
    },
  },
  plugins: [],
};
export default config;
