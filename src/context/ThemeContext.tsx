"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useEffect, type ReactNode } from "react";
import {
  applyAccessibilityPrefsToDocument,
  readAccessibilityPrefs,
} from "@/lib/settingsPreferences";

function AccessibilityPreferenceSync() {
  useEffect(() => {
    const prefs = readAccessibilityPrefs();
    applyAccessibilityPrefsToDocument(prefs);
  }, []);
  return null;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="learnova_theme"
      disableTransitionOnChange
    >
      <AccessibilityPreferenceSync />
      {children}
    </NextThemesProvider>
  );
}
