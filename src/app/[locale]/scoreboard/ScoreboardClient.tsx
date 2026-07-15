"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useMessages, useTranslations } from "next-intl";
import { useMemo } from "react";

import DownloadCVButton from "@/components/DownloadCVButton";
import ScoreboardScene from "@/components/ScoreboardScene";
import SkipLink from "@/components/SkipLink";
import { calculateScoreboardMetrics } from "@/models/metrics";
import { parseCareerHistory } from "@/services/careerData";

export default function ScoreboardClient({ locale }: { locale: string }) {
  const t = useTranslations("Scoreboard");
  const messages = useMessages() as Record<string, unknown>;
  const events = useMemo(
    () => (Array.isArray(messages.careerHistory) ? parseCareerHistory(messages.careerHistory as unknown[]) : []),
    [messages],
  );
  const data = useMemo(() => calculateScoreboardMetrics(events, (key) => t(key)), [events, t]);

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-6 text-[var(--text)] md:px-8 md:py-10">
      <SkipLink label={t("skipToContent")} />
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 max-w-2xl">
          <Link
            href={`/${locale}`}
            className="mb-6 inline-flex items-center gap-2 rounded text-sm text-[var(--muted)] transition-colors duration-150 hover:text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg)]"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            {t("back")}
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">{t("title")}</h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-[var(--muted)]">{t("subtitle")}</p>
        </header>

        <main id="main-content">
          <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(18rem,1fr)]">
            <div className="order-2 lg:order-1">
              <ScoreboardScene data={data} />
            </div>

            <section
              aria-labelledby="career-summary-title"
              className="order-1 rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5 lg:order-2 md:p-6"
            >
              <h2 id="career-summary-title" className="text-lg font-semibold text-white">
                {t("summaryTitle")}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{t("summaryDescription")}</p>
              <dl className="mt-5 divide-y divide-[var(--border)] border-y border-[var(--border)]">
                {data.metrics.map((metric) => (
                  <div key={metric.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 py-4">
                    <dt>
                      <span className="block font-mono text-xs uppercase tracking-wider text-[var(--muted)]">{metric.label}</span>
                      <span className="mt-1 block text-sm leading-snug text-[var(--muted)]">{metric.description}</span>
                    </dt>
                    <dd className="self-center font-mono text-3xl font-semibold tabular-nums text-white">{metric.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>

          <section className="mt-8 flex flex-col gap-4 border-t border-[var(--border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-white">{t("ctaTitle")}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">{t("ctaDescription")}</p>
            </div>
            <div className="self-start">
              <DownloadCVButton label={t("downloadCv")} showLabel />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
