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

  if (!mounted) {
    return null;
  }

  return (
    <div className="group flex items-center gap-2 bg-[color:var(--panel)] border border-[var(--border)] px-3 py-2 rounded hover:border-[color:var(--accent)] transition-colors">
      {label ? (
        <span className="hidden md:inline text-[10px] font-mono text-[color:var(--muted)]">{label}</span>
      ) : null}
      <select
        className="select-themed cursor-pointer font-mono text-xs outline-none focus:ring-1 focus:ring-[color:var(--accent)]"
        value={theme ?? "vscode-dark"}
        onChange={(e) => setTheme(e.target.value)}
      >
        {themes.map((t) => (
          <option key={t.id} value={t.id} className="option-themed">
            {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}
