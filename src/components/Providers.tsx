"use client";

import { ThemeProvider } from "next-themes";
import { MotionConfig } from "framer-motion";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="vscode-dark"
      enableSystem={false}
      disableTransitionOnChange
      themes={["vscode-dark", "intellij-darcula", "sublime-monokai"]}
    >
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </ThemeProvider>
  );
}
