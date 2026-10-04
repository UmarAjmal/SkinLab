"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  ThemeConfig,
  THEME_PRESETS,
  DEFAULT_THEME,
  applyThemeToDocument,
  parseThemeConfig,
  ThemePreset,
} from "@/lib/theme";

interface ThemeContextType {
  theme: ThemeConfig;
  activeTheme: ThemeConfig; // effective theme (preview if active, otherwise saved theme)
  previewTheme: ThemeConfig | null;
  presets: ThemePreset[];
  isLoading: boolean;
  isSaving: boolean;
  setPreview: (theme: ThemeConfig) => void;
  resetPreview: () => void;
  applyPreset: (presetId: string) => void;
  updateThemeColors: (colors: Partial<ThemeConfig>) => void;
  saveTheme: (customTheme?: ThemeConfig) => Promise<boolean>;
  refreshTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "skinlab_active_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
  const [previewTheme, setPreviewTheme] = useState<ThemeConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Effective theme to render (preview if active, otherwise saved)
  const activeTheme = previewTheme || theme;

  // Sync to DOM whenever active theme changes
  useEffect(() => {
    applyThemeToDocument(activeTheme);
  }, [activeTheme]);

  // Initial load: 1. check localStorage for instant load, 2. fetch latest from server
  const loadTheme = useCallback(async () => {
    try {
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) {
          const parsed = parseThemeConfig(cached);
          setTheme(parsed);
          applyThemeToDocument(parsed);
        }
      }

      // Fetch from public settings endpoint (works authenticated or unauthenticated)
      const res = await fetch("/api/settings/public", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.theme_config || data.theme) {
          const fetchedTheme = data.theme || parseThemeConfig(data.theme_config);
          setTheme(fetchedTheme);
          applyThemeToDocument(fetchedTheme);
          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(fetchedTheme));
          }
        }
      }
    } catch (err) {
      console.error("Failed to load theme settings:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  // Live preview handler
  const setPreview = useCallback((t: ThemeConfig) => {
    setPreviewTheme(t);
  }, []);

  const resetPreview = useCallback(() => {
    setPreviewTheme(null);
  }, []);

  // Preset selector
  const applyPreset = useCallback((presetId: string) => {
    const found = THEME_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setPreviewTheme({ ...found.theme });
    }
  }, []);

  // Update specific colors dynamically
  const updateThemeColors = useCallback((colors: Partial<ThemeConfig>) => {
    setPreviewTheme((prev) => {
      const base = prev || theme;
      return {
        ...base,
        presetId: "custom",
        name: "Custom Theme",
        ...colors,
      };
    });
  }, [theme]);

  // Save theme permanently to database & localStorage
  const saveTheme = useCallback(
    async (customTheme?: ThemeConfig): Promise<boolean> => {
      const themeToSave = customTheme || previewTheme || theme;
      setIsSaving(true);
      try {
        const res = await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            theme_config: JSON.stringify(themeToSave),
          }),
        });

        if (res.ok) {
          setTheme(themeToSave);
          setPreviewTheme(null);
          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(themeToSave));
          }
          applyThemeToDocument(themeToSave);
          return true;
        }
        return false;
      } catch (err) {
        console.error("Failed to save theme settings:", err);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [previewTheme, theme]
  );

  return (
    <ThemeContext.Provider
      value={{
        theme,
        activeTheme,
        previewTheme,
        presets: THEME_PRESETS,
        isLoading,
        isSaving,
        setPreview,
        resetPreview,
        applyPreset,
        updateThemeColors,
        saveTheme,
        refreshTheme: loadTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
