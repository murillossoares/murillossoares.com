"use client";

import { useTranslations } from "next-intl";

import LanguageSwitcher from "@/components/LanguageSwitcher";
import DownloadCVButton from "@/components/DownloadCVButton";
import ThemeSwitcher from "@/components/ThemeSwitcher";

export default function HeaderBar() {
  const t = useTranslations("Header");
  const tabs = t.raw("tabs") as { cv: string; skills: string; contact: string };

  return (
    <header className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        {[tabs.cv, tabs.skills, tabs.contact].map((tab) => (
          <div
            key={tab}
            className="rounded-lg border border-[var(--border)] bg-[var(--panel-2)] px-3 py-1.5 text-xs text-[color:var(--muted)]"
          >
            <span className="font-mono">{tab}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DownloadCVButton label={t("downloadCv")} />
        <ThemeSwitcher label={t("theme")} />
        <LanguageSwitcher label={t("language")} />
      </div>
    </header>
  );
}
