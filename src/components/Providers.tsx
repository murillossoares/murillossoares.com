"use client";
import { SYSTEM, THEME_ATTRIBUTE_VALUES, THEME_IDS } from "@/lib/themes";
import { ThemeProvider } from "next-themes";
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    // First visit follows the operating system (light → Bluloco Light, dark → VS Code Dark); a theme picked in the
    // switcher is stored and wins from then on.
    <ThemeProvider attribute="data-theme" defaultTheme={SYSTEM} enableSystem value={THEME_ATTRIBUTE_VALUES}
      disableTransitionOnChange themes={THEME_IDS}>{children}</ThemeProvider>
  );
}
