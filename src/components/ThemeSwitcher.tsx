"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
const themes = [
  { id: "vscode-dark", label: "VS Code Dark" },
  { id: "intellij-darcula", label: "IntelliJ Darcula" },
  { id: "sublime-monokai", label: "Sublime Monokai" },
] as const;
export default function ThemeSwitcher({ label }: { label?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // Rendered on the server too (with the default theme) so the header does not shift when it hydrates; the stored
  // theme is only known in the browser, so it is shown once mounted.
  return (
    <div className="group flex items-center gap-2 bg-panel border border-border px-3 py-2 rounded hover:border-accent transition-colors">
      {label ? <label htmlFor="theme-sel" className="sr-only md:not-sr-only text-[10px] font-mono text-muted">{label}</label> : null}
      <select id="theme-sel" aria-label={label ?? "Theme"} value={mounted ? theme ?? "vscode-dark" : "vscode-dark"} onChange={(e) => setTheme(e.target.value)}
        className="cursor-pointer font-mono text-xs outline-none bg-panel-2 text-text border border-border rounded px-2 py-1 focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]">
        {themes.map((t) => <option key={t.id} value={t.id} className="bg-panel-2 text-text">{t.label}</option>)}
      </select>
    </div>
  );
}
