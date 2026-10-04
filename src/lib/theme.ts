export interface ThemeConfig {
  presetId?: string;
  name?: string;
  primaryColor: string;     // Main brand / button / highlight color
  primaryHover: string;     // Hover state for primary buttons
  primaryLight: string;     // Light background tint (for badges, active tabs, subtle cards)
  primaryText: string;      // Text color on top of primary buttons
  sidebarBg: string;        // Sidebar background color
  sidebarHover: string;     // Sidebar nav link hover color
  sidebarActive: string;    // Sidebar active item color
  sidebarText: string;      // Sidebar inactive text color
  headerBg: string;         // Top header background
  accentColor: string;      // Secondary accent / sparkle / icon color
}

export interface ThemePreset {
  id: string;
  name: string;
  category: "Modern" | "Male" | "Female" | "Clinical" | "Luxury";
  description: string;
  theme: ThemeConfig;
  previewColors: {
    primary: string;
    sidebar: string;
    accent: string;
  };
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "modern-indigo",
    name: "Modern Indigo",
    category: "Modern",
    description: "Vibrant high-tech aesthetic with electric indigo highlights & sleek dark sidebar.",
    previewColors: {
      primary: "#4f46e5",
      sidebar: "#0f172a",
      accent: "#06b6d4",
    },
    theme: {
      presetId: "modern-indigo",
      name: "Modern Indigo",
      primaryColor: "#4f46e5",
      primaryHover: "#4338ca",
      primaryLight: "#eef2ff",
      primaryText: "#ffffff",
      sidebarBg: "#0f172a",
      sidebarHover: "#1e293b",
      sidebarActive: "#4f46e5",
      sidebarText: "#cbd5e1",
      headerBg: "#ffffff",
      accentColor: "#06b6d4",
    },
  },
  {
    id: "male-slate-ocean",
    name: "Masculine Slate & Ocean",
    category: "Male",
    description: "Deep steel charcoal, ocean blue accents, and confident executive styling.",
    previewColors: {
      primary: "#0284c7",
      sidebar: "#0f172a",
      accent: "#38bdf8",
    },
    theme: {
      presetId: "male-slate-ocean",
      name: "Masculine Slate & Ocean",
      primaryColor: "#0284c7",
      primaryHover: "#0369a1",
      primaryLight: "#f0f9ff",
      primaryText: "#ffffff",
      sidebarBg: "#0f172a",
      sidebarHover: "#1e293b",
      sidebarActive: "#0284c7",
      sidebarText: "#94a3b8",
      headerBg: "#ffffff",
      accentColor: "#38bdf8",
    },
  },
  {
    id: "female-rose-luxury",
    name: "Aesthetic Rose & Lavender",
    category: "Female",
    description: "Soft rose gold, velvet berry dark sidebar, and soothing MedSpa aesthetics.",
    previewColors: {
      primary: "#e11d48",
      sidebar: "#241221",
      accent: "#f43f5e",
    },
    theme: {
      presetId: "female-rose-luxury",
      name: "Aesthetic Rose & Lavender",
      primaryColor: "#e11d48",
      primaryHover: "#be123c",
      primaryLight: "#fff1f2",
      primaryText: "#ffffff",
      sidebarBg: "#241221",
      sidebarHover: "#361a32",
      sidebarActive: "#e11d48",
      sidebarText: "#fecdd3",
      headerBg: "#ffffff",
      accentColor: "#f43f5e",
    },
  },
  {
    id: "clinical-emerald",
    name: "Clinical Emerald & Mint",
    category: "Clinical",
    description: "Clean dermatology green, sterile medical precision, and trust-inspiring tones.",
    previewColors: {
      primary: "#059669",
      sidebar: "#06261f",
      accent: "#10b981",
    },
    theme: {
      presetId: "clinical-emerald",
      name: "Clinical Emerald & Mint",
      primaryColor: "#059669",
      primaryHover: "#047857",
      primaryLight: "#ecfdf5",
      primaryText: "#ffffff",
      sidebarBg: "#06261f",
      sidebarHover: "#0d3a30",
      sidebarActive: "#059669",
      sidebarText: "#a7f3d0",
      headerBg: "#ffffff",
      accentColor: "#10b981",
    },
  },
  {
    id: "luxury-gold",
    name: "Luxury Obsidian & Royal Gold",
    category: "Luxury",
    description: "Ultra-luxury obsidian black, warm amber-gold, and VIP clinic exclusivity.",
    previewColors: {
      primary: "#d97706",
      sidebar: "#18181b",
      accent: "#f59e0b",
    },
    theme: {
      presetId: "luxury-gold",
      name: "Luxury Obsidian & Royal Gold",
      primaryColor: "#d97706",
      primaryHover: "#b45309",
      primaryLight: "#fef3c7",
      primaryText: "#ffffff",
      sidebarBg: "#18181b",
      sidebarHover: "#27272a",
      sidebarActive: "#d97706",
      sidebarText: "#fde68a",
      headerBg: "#ffffff",
      accentColor: "#f59e0b",
    },
  },
  {
    id: "electric-violet",
    name: "Electric Violet & Neon",
    category: "Modern",
    description: "Deep violet nightscape with luminous neon highlights for high energy.",
    previewColors: {
      primary: "#7c3aed",
      sidebar: "#190d2e",
      accent: "#c084fc",
    },
    theme: {
      presetId: "electric-violet",
      name: "Electric Violet & Neon",
      primaryColor: "#7c3aed",
      primaryHover: "#6d28d9",
      primaryLight: "#f5f3ff",
      primaryText: "#ffffff",
      sidebarBg: "#190d2e",
      sidebarHover: "#29154a",
      sidebarActive: "#7c3aed",
      sidebarText: "#ddd6fe",
      headerBg: "#ffffff",
      accentColor: "#c084fc",
    },
  },
];

export const DEFAULT_THEME: ThemeConfig = THEME_PRESETS[0].theme;

/**
 * Injects CSS custom properties into document :root
 */
export function applyThemeToDocument(theme: ThemeConfig | null | undefined) {
  if (typeof window === "undefined" || !document?.documentElement) return;

  const activeTheme = theme || DEFAULT_THEME;
  const root = document.documentElement;

  root.style.setProperty("--color-primary", activeTheme.primaryColor || DEFAULT_THEME.primaryColor);
  root.style.setProperty("--color-primary-hover", activeTheme.primaryHover || DEFAULT_THEME.primaryHover);
  root.style.setProperty("--color-primary-light", activeTheme.primaryLight || DEFAULT_THEME.primaryLight);
  root.style.setProperty("--color-primary-text", activeTheme.primaryText || DEFAULT_THEME.primaryText);
  root.style.setProperty("--color-sidebar-bg", activeTheme.sidebarBg || DEFAULT_THEME.sidebarBg);
  root.style.setProperty("--color-sidebar-hover", activeTheme.sidebarHover || DEFAULT_THEME.sidebarHover);
  root.style.setProperty("--color-sidebar-active", activeTheme.sidebarActive || DEFAULT_THEME.sidebarActive);
  root.style.setProperty("--color-sidebar-text", activeTheme.sidebarText || DEFAULT_THEME.sidebarText);
  root.style.setProperty("--color-header-bg", activeTheme.headerBg || DEFAULT_THEME.headerBg);
  root.style.setProperty("--color-accent", activeTheme.accentColor || DEFAULT_THEME.accentColor);
}

/**
 * Parses a JSON string safely into ThemeConfig
 */
export function parseThemeConfig(raw: string | null | undefined): ThemeConfig {
  if (!raw) return DEFAULT_THEME;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return {
      presetId: parsed.presetId || "custom",
      name: parsed.name || "Custom Theme",
      primaryColor: parsed.primaryColor || DEFAULT_THEME.primaryColor,
      primaryHover: parsed.primaryHover || DEFAULT_THEME.primaryHover,
      primaryLight: parsed.primaryLight || DEFAULT_THEME.primaryLight,
      primaryText: parsed.primaryText || DEFAULT_THEME.primaryText,
      sidebarBg: parsed.sidebarBg || DEFAULT_THEME.sidebarBg,
      sidebarHover: parsed.sidebarHover || DEFAULT_THEME.sidebarHover,
      sidebarActive: parsed.sidebarActive || DEFAULT_THEME.sidebarActive,
      sidebarText: parsed.sidebarText || DEFAULT_THEME.sidebarText,
      headerBg: parsed.headerBg || DEFAULT_THEME.headerBg,
      accentColor: parsed.accentColor || DEFAULT_THEME.accentColor,
    };
  } catch {
    return DEFAULT_THEME;
  }
}
