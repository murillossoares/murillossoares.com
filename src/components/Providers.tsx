"use client";
import { DEFAULT_THEME, THEME_IDS } from "@/lib/themes";
import { ThemeProvider } from "next-themes";
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme={DEFAULT_THEME} enableSystem={false}
      disableTransitionOnChange themes={THEME_IDS}>{children}</ThemeProvider>
  );
}
