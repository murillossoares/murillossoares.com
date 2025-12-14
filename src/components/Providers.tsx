"use client";

import { ThemeProvider } from "next-themes";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="vscode-dark"
      enableSystem={false}
      disableTransitionOnChange
      themes={["vscode-dark", "intellij-darcula", "sublime-monokai"]}
    >
      {children}
    </ThemeProvider>
  );
}

