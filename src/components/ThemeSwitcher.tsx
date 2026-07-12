"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const themes = [
  { id: "vscode-dark", label: "VS Code Dark" },
  { id: "intellij-darcula", label: "IntelliJ Darcula" },
  { id: "sublime-monokai", label: "Sublime Monokai" },
] as const;

export default function ThemeSwitcher({ label }: { label?: string }) {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("Header");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="group flex items-center gap-2 bg-panel border border-border px-3 py-2 rounded hover:border-accent transition-colors">
      {label ? (
        <span className="hidden md:inline text-[10px] font-mono text-muted">{label}</span>
      ) : null}
      <select
        aria-label={label ?? t("theme")}
        className="cursor-pointer font-mono text-xs outline-none bg-panel-2 text-text border border-border rounded px-2 py-1 focus:ring-1 focus:ring-accent"
        value={theme ?? "vscode-dark"}
        onChange={(e) => setTheme(e.target.value)}
      >
        {themes.map((t) => (
          <option key={t.id} value={t.id} className="bg-panel-2 text-text">
            {t.label}
          </option>
        ))}
      </select>
    </div>
  );
}
