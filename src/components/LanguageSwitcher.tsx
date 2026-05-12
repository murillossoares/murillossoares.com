"use client";
import { usePathname } from "next/navigation";
import { locales } from "@/i18n/routing";
export default function LanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const pathname = usePathname();
  const getPath = (locale: string) => { const s = pathname.split("/"); s[1] = locale; return s.join("/"); };
  return (
    <nav aria-label="Language" className="group flex items-center gap-2 bg-panel border border-border px-3 py-2 rounded hover:border-accent transition-colors">
      {locales.map((l) => (
        <a key={l} href={getPath(l)} aria-current={currentLocale === l ? "page" : undefined}
          className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded transition-colors focus:ring-2 focus:ring-[var(--accent)] ${currentLocale === l ? "bg-accent text-white" : "text-muted hover:text-white"}`}>{l}</a>
      ))}
    </nav>
  );
}
