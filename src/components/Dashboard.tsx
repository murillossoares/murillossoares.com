"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Terminal, Server, Code, Database, Github, Linkedin, Send, BarChart3, Boxes } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import DownloadCVButton from "./DownloadCVButton";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeSwitcher from "./ThemeSwitcher";
import SkipLink from "./SkipLink";
import Monogram from "./Monogram";
import CareerGalaxyScene from "./CareerGalaxyScene";
import { careerFacts, formatYears, type ArchType, type CareerMetric } from "@/models/metrics";
import { careerFile, educationLabel, getCareerHistory, getHeadline } from "@/services/careerData";
import { periodParts, type PeriodParts } from "@/lib/period";
import { groupStack } from "@/lib/tech";
import { ARCH_STYLE } from "@/lib/arch-style";

const ARCH_TYPES = Object.keys(ARCH_STYLE) as ArchType[];
import { useUiStore } from "@/store/ui";

export default function Dashboard({ locale, asOf }: { locale: string; asOf: string }) {
  const tDash = useTranslations("Dashboard");
  const tApp = useTranslations("App");
  const tHeader = useTranslations("Header");
  const prefersReduced = useReducedMotion();
  // The server cannot know the visitor's motion preference, so the first client render uses the server's (animated)
  // markup and the preference applies right after hydration; branching on it earlier caused a hydration mismatch.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const reduced = hydrated ? prefersReduced : false;
  const careerHistory = useMemo(() => getCareerHistory(locale), [locale]);
  // Server HTML and first client render use the build date (identical output, no hydration mismatch); afterwards the
  // browser switches to today so durations and years do not go stale between deploys.
  const [now, setNow] = useState(asOf);
  useEffect(() => setNow(new Date().toISOString()), []);
  const facts = useMemo(() => careerFacts(careerHistory, new Date(now)), [careerHistory, now]);
  const years = formatYears(facts);
  const activeJobId = useUiStore((s) => s.activeJobId);
  const setActiveJob = useUiStore((s) => s.setActiveJob);
  const activeJob = careerHistory.find((j) => j.id === activeJobId) ?? careerHistory[0] ?? null;
  const links = careerFile.person.links;
  // In the single-column layout (below lg) the stack panel sits under the whole timeline, so picking a position would
  // change content off-screen. Bring the panel into view there; on desktop it is already visible beside the list.
  const detailsRef = useRef<HTMLElement>(null);
  const selectFromTimeline = (id: string) => {
    setActiveJob(id);
    if (!window.matchMedia("(max-width: 1023.98px)").matches) return;
    requestAnimationFrame(() => detailsRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" }));
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-4 pb-28 md:p-8 md:pb-28 font-sans bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,0.08),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.06),transparent_40%)] bg-fixed">
      <SkipLink label={tHeader("skipToContent")} />
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/10 to-green-900/10 pointer-events-none light:opacity-30" aria-hidden="true" />
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4 border-b border-[var(--border)] pb-6 relative z-10">
        <div className="flex items-center gap-3">
          <Monogram className="h-9 w-9 shrink-0 text-[var(--text)]" />
          <div className="relative" aria-hidden="true"><div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" /><div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20" /></div>
          <span className="font-mono text-xs text-green-500 light:text-green-700 tracking-widest uppercase whitespace-nowrap">{tDash("systemOnline")}</span>
        </div>
        <nav aria-label={tHeader("controls")} className="flex flex-wrap gap-3">
          <SB icon={Linkedin} label="LINKEDIN" href={links.linkedin} color="text-blue-400 light:text-blue-600" rel="me noreferrer" />
          <SB icon={Github} label="GITHUB" href={links.github} color="text-purple-400 light:text-purple-600" rel="me noreferrer" />
          <SB icon={Send} label="TELEGRAM" href={links.telegram} color="text-sky-400 light:text-sky-700" status="ENCRYPTED" />
          <ThemeSwitcher label={tHeader("theme")} /><LanguageSwitcher currentLocale={locale} label={tHeader("language")} />
          <Link href={`/${locale}/scoreboard`} className="group flex items-center gap-2 bg-surface-strong border border-[var(--border)] px-3 py-2 rounded hover:border-line-strong transition-all focus:ring-2 focus:ring-[var(--accent)]" aria-label="Scoreboard">
            <BarChart3 size={14} className="text-[var(--accent)]" aria-hidden="true" /><span className="hidden md:inline text-[10px] font-mono text-[var(--muted)] group-hover:text-strong">SCOREBOARD</span>
          </Link>
          <DownloadCVButton label="GET_CV.pdf" />
        </nav>
      </header>

      <section className="relative z-10 mb-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center" aria-labelledby="profile-name">
        <div>
          <h1 id="profile-name" className="text-4xl md:text-6xl font-bold text-strong tracking-tight">{tApp("title")}</h1>
          <p className="mt-2 font-mono text-sm md:text-base text-[var(--accent-2)]">{getHeadline(locale)} · {careerFile.person.location.city}</p>
          <p className="mt-1 font-mono text-xs text-[var(--muted)]">{careerFile.person.fullName} · {tDash("educationLabel")}: {educationLabel(locale)}</p>
          <p className="mt-4 max-w-xl text-sm md:text-base leading-relaxed text-[var(--muted)]">
            {tDash("about", { city: careerFile.person.location.city, years, companies: facts.companies })}
          </p>
        </div>
        <CareerGalaxyScene events={careerHistory} activeId={activeJob?.id ?? null} onSelect={setActiveJob} label={tDash("galaxyLabel")} hint={tDash("galaxyHint")}
          archLabels={Object.fromEntries(ARCH_TYPES.map((k) => [k, tDash(`archNames.${k}`)]))} />
      </section>

      <section aria-label="KPIs" className="relative z-10 mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label={tDash("kpis.sinceLabel", { since: facts.since })} value={tDash("kpis.sinceValue", { years })} sub={tDash("kpis.sinceSub", { internships: facts.internships })} c="border-green-500/30" />
        <Kpi label={tDash("kpis.positionsLabel")} value={tDash("kpis.positionsValue", { positions: facts.positions })} sub={tDash("kpis.positionsSub", { companies: facts.companies })} c="border-blue-500/30" />
        <Kpi label={tDash("kpis.techLabel")} value={tDash("kpis.techValue", { technologies: facts.technologies })} sub={tDash("kpis.techSub")} c="border-orange-500/30" />
        <Kpi label={tDash("kpis.archLabel")} value={tDash("kpis.archValue", { architectures: facts.architectures })} sub={tDash("kpis.archSub")} c="border-purple-500/30" />
      </section>

      <main id="main-content" className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-6 relative z-10">
        <section className="bg-surface backdrop-blur-md border border-[var(--border)] rounded-lg p-4 md:p-6" aria-labelledby="experience-title">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-5">
            <h2 id="experience-title" className="text-sm font-mono text-[var(--muted)] uppercase tracking-widest flex items-center gap-2"><Terminal size={16} aria-hidden="true" />{tDash("eventHistoryTitle")}</h2>
            <span className="text-[10px] text-[var(--muted)] font-mono">{tDash("eventHistoryHint")}</span>
          </div>
          {careerHistory.length === 0 ? <p className="text-[var(--muted)] text-xs font-mono">{tDash("eventHistoryEmpty")}</p> : (
            <ol className="space-y-2">
              {careerHistory.map((job) => (
                <TimelineItem key={job.id} job={job} active={activeJob?.id === job.id} onSelect={() => selectFromTimeline(job.id)} reduced={reduced}
                  period={periodParts(job, locale, new Date(now))} status={job.current ? tDash("running") : tDash("exited")} archLabel={tDash(`archNames.${job.archType}`)} />
              ))}
            </ol>
          )}
        </section>

        <aside ref={detailsRef} className="space-y-6 scroll-mt-4 lg:sticky lg:top-6 lg:self-start">
          <div className="bg-surface backdrop-blur-md border border-[var(--border)] rounded-lg p-5 md:p-6" aria-live="polite">
            <h2 className="text-sm font-mono text-[var(--muted)] uppercase tracking-widest mb-1 flex items-center gap-2"><Boxes size={16} aria-hidden="true" />{tDash("dependenciesTitle")}</h2>
            {activeJob ? <p className="mb-5 font-mono text-xs text-[var(--text)]">{activeJob.company}</p> : null}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={activeJob?.id ?? "empty"} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? undefined : { opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                {activeJob ? (
                  <div className="space-y-4">
                    {groupStack(activeJob.stack).map((group) => (
                      <div key={group.category}>
                        <h3 className="text-[11px] text-[var(--muted)] font-mono mb-2 uppercase">{tDash(`categories.${group.category}`)}</h3>
                        <ul className="flex flex-wrap gap-2">{group.items.map((t) => <li key={t.label}><TT label={t.label} category={group.category} /></li>)}</ul>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-[var(--muted)] text-xs font-mono">{tDash("dependenciesEmpty")}</p>}
              </motion.div>
            </AnimatePresence>
          </div>
          {activeJob ? <SvcMap archType={activeJob.archType} reduced={reduced} /> : null}
        </aside>
      </main>
    </div>
  );
}

function TimelineItem({ job, active, onSelect, reduced, period, status, archLabel }: { job: CareerMetric; active: boolean; onSelect: () => void; reduced: boolean | null; period: PeriodParts; status: string; archLabel: string }) {
  const arch = ARCH_STYLE[job.archType];
  return (
    <motion.li whileHover={reduced ? undefined : { x: 3 }} className="relative">
      <article className={`rounded border-l-2 p-3 md:p-4 transition-colors ${active ? "bg-hover border border-[var(--border)] border-l-[var(--accent-2)]" : "border border-transparent border-l-[var(--border)] hover:bg-hover"}`}>
        <div className="flex flex-wrap justify-between items-center gap-2 mb-1">
          <span className="font-mono text-green-500 light:text-[var(--accent-2)] text-xs">
            [<time dateTime={period.start.iso}>{period.start.label}</time>
            {period.presentLabel ? <> – {period.presentLabel}</> : period.end ? <> – <time dateTime={period.end.iso}>{period.end.label}</time></> : null}]
            {period.duration ? <span className="ml-2 text-[var(--muted)]">{period.duration}</span> : null}
          </span>
          <span className="flex items-center gap-2">
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${arch.chip}`}>{archLabel.toUpperCase()}</span>
            <StatusBadge current={job.current} label={status} />
          </span>
        </div>
        <h3 className="text-strong font-semibold leading-snug">{job.role} <span className="text-[var(--muted)] font-normal">@</span> {job.company}</h3>
        <p className="text-sm text-[var(--muted)] font-mono mt-1">{`> ${job.desc}`}</p>
        <p className="mt-2 text-[11px] font-mono text-[var(--muted)] opacity-80"><span className="sr-only">Stack: </span>{job.stack.join(" · ")}</p>
      </article>
      <button type="button" onClick={onSelect} aria-pressed={active} aria-label={`${job.role} @ ${job.company}`}
        className="absolute inset-0 rounded cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]" />
    </motion.li>
  );
}

function StatusBadge({ current, label }: { current: boolean; label: string }) {
  return current
    ? <span className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded border bg-green-500/10 text-green-400 light:text-green-700 border-green-500/30"><span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />{label}</span>
    : <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-hover text-[var(--muted)] border-[var(--border)]">{label}</span>;
}

function SB({ icon: I, label, href, color, status = "CONN", rel = "noreferrer" }: { icon: LucideIcon; label: string; href: string; color: string; status?: string; rel?: string }) {
  return <a href={href} target="_blank" rel={rel} className="group flex items-center gap-2 bg-surface-strong border border-[var(--border)] px-3 py-2 rounded hover:border-line-strong transition-all focus:ring-2 focus:ring-[var(--accent)]" aria-label={`${label} ${status}`}><I size={14} className={color} aria-hidden="true" /><span className="hidden md:inline text-[10px] font-mono text-[var(--muted)] group-hover:text-strong">{label}::{status}</span></a>;
}
function Kpi({ label, value, sub, c }: { label: string; value: string; sub: string; c: string }) {
  return <article className={`bg-surface backdrop-blur border ${c} rounded p-3 md:p-4 hover:bg-hover transition-colors`}><h2 className="text-[10px] text-[var(--muted)] font-mono uppercase mb-1">{label}</h2><p className="text-xl md:text-2xl font-bold text-strong mb-1">{value}</p><p className="text-[11px] text-[var(--muted)]">{sub}</p></article>;
}

const CATEGORY_CHIP: Record<string, string> = {
  languages: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20 light:bg-yellow-500/15 light:text-yellow-800 light:border-yellow-600/30",
  backend: "bg-orange-500/10 text-orange-400 border-orange-500/20 light:text-orange-800 light:border-orange-600/30",
  frontend: "bg-blue-500/10 text-blue-400 border-blue-500/20 light:text-blue-700 light:border-blue-600/30",
  data: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 light:text-emerald-800 light:border-emerald-600/30",
  integration: "bg-purple-500/10 text-purple-400 border-purple-500/20 light:text-purple-700 light:border-purple-600/30",
  infra: "bg-sky-500/10 text-sky-400 border-sky-500/20 light:text-sky-800 light:border-sky-600/30",
  other: "bg-hover text-[var(--muted)] border-[var(--border)]",
};
function TT({ label, category }: { label: string; category: string }) { return <span className={`inline-block text-xs font-mono px-2 py-1 rounded border ${CATEGORY_CHIP[category]}`}>{label}</span>; }

function SvcMap({ archType, reduced }: { archType: ArchType; reduced: boolean | null }) {
  const t = useTranslations("Dashboard");
  return (
    <div className="bg-surface backdrop-blur-md border border-[var(--border)] rounded-lg p-5 md:p-6">
      <h2 className="text-sm font-mono text-[var(--muted)] uppercase tracking-widest flex items-center gap-2"><Database size={16} aria-hidden="true" />{t("architectureViewLabel")}: <span className="text-strong">{t(`archNames.${archType}`)}</span></h2>
      <div className="flex items-center justify-around mt-6">
        <Node icon={Server} tone="orange" label={t("serviceMapNodeLabels.server")} />
        <Line tone="green" archType={archType} reduced={reduced} delay={0} />
        {archType === "microservices" || archType === "soa" ? <><Node icon={Code} tone="purple" size={18} label={t("serviceMapNodeLabels.gateway")} /><Line tone="purple" archType={archType} reduced={reduced} delay={0.4} /></> : null}
        <Node icon={Terminal} tone="blue" label={t("serviceMapNodeLabels.client")} />
      </div>
    </div>
  );
}

// Full class names spelled out so Tailwind's JIT can see them (template-built names were silently dropped).
const TONE = {
  orange: { node: "bg-orange-500/10 border-orange-500/50 text-orange-500 light:text-orange-700", line: "bg-orange-500", idle: "bg-orange-500/30" },
  purple: { node: "bg-purple-500/10 border-purple-500/50 text-purple-500 light:text-purple-700", line: "bg-purple-500", idle: "bg-purple-500/30" },
  blue: { node: "bg-blue-500/10 border-blue-500/50 text-blue-500 light:text-blue-700", line: "bg-blue-500", idle: "bg-blue-500/30" },
  green: { node: "bg-green-500/10 border-green-500/50 text-green-500 light:text-green-700", line: "bg-green-500", idle: "bg-green-500/30" },
} as const;
type Tone = keyof typeof TONE;

function Node({ icon: I, tone, label, size = 20 }: { icon: LucideIcon; tone: Tone; label: string; size?: number }) {
  return <div className="flex flex-col items-center gap-2"><div className={`w-12 h-12 rounded border flex items-center justify-center ${TONE[tone].node}`}><I size={size} aria-hidden="true" /></div><span className="text-[10px] font-mono text-[var(--muted)]">{label}</span></div>;
}
function Line({ tone, archType, reduced, delay }: { tone: Tone; archType: ArchType; reduced: boolean | null; delay: number }) {
  return <div className="flex-1 h-px bg-hover-strong relative mx-3 overflow-hidden" aria-hidden="true">
    {!reduced ? <motion.div className={`absolute -top-px left-0 w-8 h-[3px] ${TONE[tone].line} shadow-[0_0_10px]`} animate={{ x: ["0%", "400%"], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: archType === "monolith" ? 2 : 0.8, delay, ease: "linear" }} /> : <div className={`absolute -top-px left-0 w-full h-[3px] ${TONE[tone].idle}`} />}
  </div>;
}
