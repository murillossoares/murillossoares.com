"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";

import { locales } from "@/i18n/routing";

const labels: Record<string, string> = {
  "pt-br": "PT-BR",
  en: "EN",
  es: "ES",
};

export default function LanguageSwitcher({ label }: { label?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const buildHref = (nextLocale: string) => {
    const parts = (pathname ?? "/").split("/").filter(Boolean);

    if (parts.length === 0) {
      return `/${nextLocale}`;
    }

    if (locales.includes(parts[0] as never)) {
      parts[0] = nextLocale;
    } else {
      parts.unshift(nextLocale);
    }

    const base = `/${parts.join("/")}`;
    const query = searchParams?.toString() ?? "";
    return query ? `${base}?${query}` : base;
  };

  return (
    <div className="group flex items-center gap-2 rounded border border-white/10 bg-black/50 px-3 py-2 transition-colors hover:border-white/30">
      {label ? (
        <span className="hidden md:inline text-[10px] font-mono text-[color:var(--muted)]">{label}</span>
      ) : null}
      <div className="flex items-center gap-1">
        {locales.map((l) => (
          <Link
            key={l}
            href={buildHref(l)}
            aria-current={locale === l ? "page" : undefined}
            className={`rounded px-1.5 py-0.5 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
              locale === l
                ? "bg-white/10 text-[color:var(--text)]"
                : "hover:bg-white/5 text-gray-400"
            }`}
          >
            {labels[l] ?? l.toUpperCase()}
          </Link>
        ))}
      </div>
    </div>
  );
}
