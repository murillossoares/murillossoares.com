"use client";
import { useTranslations } from "next-intl";
import { useMessages } from "next-intl";
import Link from "next/link";
import { ArrowLeft, Activity, Layers, Box, Folder } from "lucide-react";
import { useMemo } from "react";
import ScoreboardScene from "@/components/ScoreboardScene";
import SkipLink from "@/components/SkipLink";
import type { ScoreboardData } from "@/models/metrics";
import { parseCareerHistory } from "@/services/careerData";

export default function ScoreboardClient({ locale }: { locale: string }) {
  const t = useTranslations("Scoreboard");
  const messages = useMessages() as Record<string, unknown>;
  const events = useMemo(() => Array.isArray(messages.careerHistory) ? parseCareerHistory(messages.careerHistory as unknown[]) : [], [messages]);
  const data: ScoreboardData = useMemo(() => ({
    uptime: { label: t("metrics.uptime.label"), value: t("metrics.uptime.value"), sub: t("metrics.uptime.description"), percent: 90 },
    stackDepth: { label: t("metrics.stackDepth.label"), value: t("metrics.stackDepth.value"), sub: t("metrics.stackDepth.description"), percent: 80 },
    architecture: { label: t("metrics.architecture.label"), value: t("metrics.architecture.value"), sub: t("metrics.architecture.description"), percent: 70 },
    projects: { label: t("metrics.projects.label"), value: String(events.length), sub: t("metrics.projects.description"), percent: 65 },
    careerEvents: events,
  }), [t, events]);
  const metrics = useMemo(() => [
    { metric: data.uptime, icon: Activity, c: "border-green-500/30", ic: "text-green-400", bg: "bg-green-500/10" },
    { metric: data.stackDepth, icon: Layers, c: "border-blue-500/30", ic: "text-blue-400", bg: "bg-blue-500/10" },
    { metric: data.architecture, icon: Box, c: "border-purple-500/30", ic: "text-purple-400", bg: "bg-purple-500/10" },
    { metric: data.projects, icon: Folder, c: "border-orange-500/30", ic: "text-orange-400", bg: "bg-orange-500/10" },
  ], [data]);
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-4 md:p-8 font-sans">
      <SkipLink /><div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <Link href={`/${locale}`} className="inline-flex items-center gap-2 text-sm font-mono text-[var(--muted)] hover:text-white mb-6 focus:ring-2 focus:ring-[var(--accent)]">
            <ArrowLeft size={16} aria-hidden="true" />{t("title")}</Link>
          <h1 className="text-3xl md:text-4xl font-bold text-white">{t("title")}</h1>
          <p className="text-[var(--muted)] font-mono text-sm mt-2">{t("subtitle")}</p>
        </header>
        <main id="main-content">
          <ScoreboardScene data={data} />
          <section aria-label={t("metricsSectionLabel")} className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {metrics.map(({ metric, icon: I, c, ic, bg }) => (
                <article key={metric.label} className={`bg-black/40 backdrop-blur border ${c} rounded-lg p-5 hover:bg-white/5`}>
                  <div className="flex items-center gap-3 mb-3"><div className={`w-10 h-10 rounded ${bg} border ${c} flex items-center justify-center`}><I size={18} className={ic} aria-hidden="true" /></div><span className="text-xs font-mono text-gray-500 uppercase">{metric.label}</span></div>
                  <div className="text-2xl md:text-3xl font-bold text-white mb-1">{metric.value}</div>
                  <div className="text-xs text-[var(--muted)] font-mono">{metric.sub}</div>
                </article>
              ))}
            </div>
          </section>
        </main>
        <footer className="mt-6 text-xs font-mono text-gray-600 flex gap-4"><span>{t("controls.rotate")}</span><span>{t("controls.zoom")}</span><span>{t("controls.reset")}</span></footer>
      </div>
    </div>
  );
}
