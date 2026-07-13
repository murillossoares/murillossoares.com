"use client";
import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Terminal, Server, Code, Database, Github, Linkedin, Send, BarChart3 } from "lucide-react";
import { useMessages, useTranslations } from "next-intl";
import Link from "next/link";
import DownloadCVButton from "./DownloadCVButton";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeSwitcher from "./ThemeSwitcher";
import type { CareerMetric, ArchType } from "@/models/metrics";
import { parseCareerHistory, filterStackByCategory } from "@/services/careerData";

export default function Dashboard({ locale }: { locale: string }) {
  const tDash = useTranslations("Dashboard");
  const tApp = useTranslations("App");
  const messages = useMessages() as Record<string, unknown>;
  const reduced = useReducedMotion();
  const careerHistory = useMemo(() => Array.isArray(messages?.careerHistory) ? parseCareerHistory(messages.careerHistory as unknown[]) : [], [messages]);
  const [activeJob, setActiveJob] = useState<CareerMetric | null>(careerHistory[0] ?? null);
  useEffect(() => { if (careerHistory.length > 0) setActiveJob((p) => (!p || !careerHistory.some((j) => j.id === p.id)) ? careerHistory[0] : p); }, [careerHistory]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-4 md:p-8 font-sans bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,0.08),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.06),transparent_40%)] bg-fixed">
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/10 to-green-900/10 pointer-events-none" />
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-[var(--border)] pb-6 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="relative"><div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" /><div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20" /></div>
            <span className="font-mono text-xs text-green-500 tracking-widest uppercase">{tDash("systemOnline")}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{tApp("title")}</h1>
          <p className="text-[var(--muted)] font-mono text-sm mt-1">{tDash("headline")}</p>
        </div>
        <nav aria-label="Controls" className="flex flex-wrap gap-3">
          <SB icon={Linkedin} label="LINKEDIN" href="https://linkedin.com/in/murillossoares" color="text-blue-400" />
          <SB icon={Github} label="GITHUB" href="https://github.com/mhsscel" color="text-purple-400" />
          <SB icon={Send} label="TELEGRAM" href="https://t.me/murillossoares" color="text-sky-400" status="ENCRYPTED" />
          <ThemeSwitcher /><LanguageSwitcher currentLocale={locale} />
          <Link href={`/${locale}/scoreboard`} className="group flex items-center gap-2 bg-black/50 border border-[var(--border)] px-3 py-2 rounded hover:border-white/30 transition-all focus:ring-2 focus:ring-[var(--accent)]" aria-label="Scoreboard">
            <BarChart3 size={14} className="text-[var(--accent)]" /><span className="hidden md:inline text-[10px] font-mono text-[var(--muted)] group-hover:text-white">SCOREBOARD</span>
          </Link>
          <DownloadCVButton label="GET_CV.pdf" />
        </nav>
      </header>
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        <section className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Kpi label={tDash("kpis.uptimeLabel")} value={tDash("kpis.uptimeValue")} sub={tDash("kpis.uptimeSub")} c="border-green-500/30" />
            <Kpi label={tDash("kpis.stackLabel")} value={tDash("kpis.stackValue")} sub={tDash("kpis.stackSub")} c="border-blue-500/30" />
            <Kpi label={tDash("kpis.archLabel")} value={tDash("kpis.archValue")} sub={tDash("kpis.archSub")} c="border-purple-500/30" />
          </div>
          <div className="bg-black/40 backdrop-blur-md border border-[var(--border)] rounded-lg p-6 relative overflow-hidden" aria-live="polite">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-mono text-[var(--muted)] uppercase tracking-widest flex items-center gap-2"><Terminal size={16} aria-hidden="true" />{tDash("eventHistoryTitle")}</h2>
              <span className="text-[10px] text-gray-600 font-mono">{tDash("eventHistoryHint")}</span>
            </div>
            {careerHistory.length === 0 ? <div className="text-[var(--muted)] text-xs font-mono">{tDash("eventHistoryEmpty")}</div> : (
              <ul className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {careerHistory.map((job) => (
                  <motion.li key={job.id} whileHover={reduced ? {} : { x: 4 }}>
                    <button type="button" onClick={() => setActiveJob(job)} aria-expanded={activeJob?.id === job.id}
                      className={`w-full cursor-pointer p-4 rounded border-l-2 transition-all focus:ring-2 focus:ring-[var(--accent)] outline-none text-left ${activeJob?.id === job.id ? "bg-white/5 border-l-green-500 border border-white/10" : "hover:bg-white/5 border-l-gray-700 border-transparent"}`}>
                      <div className="flex justify-between items-start mb-1"><span className="font-mono text-green-500 text-xs">[{job.year}]</span><Badge type={job.type} /></div>
                      <h3 className="text-white font-bold">{job.role} @ {job.company}</h3>
                      <p className="text-sm text-[var(--muted)] font-mono mt-1">{`> ${job.desc}`}</p>
                    </button>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>
          {activeJob ? <SvcMap archType={activeJob.archType} reduced={reduced} /> : null}
        </section>
        <aside className="space-y-6">
          <div className="bg-black/40 backdrop-blur-md border border-[var(--border)] rounded-lg p-6 h-full min-h-[300px]">
            <h2 className="text-sm font-mono text-[var(--muted)] uppercase tracking-widest mb-6 flex items-center gap-2"><Server size={16} aria-hidden="true" />{tDash("dependenciesTitle")}</h2>
            <AnimatePresence mode="wait">
              <motion.div key={activeJob?.id ?? "empty"} initial={reduced ? {} : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? {} : { opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                {activeJob ? (
                  <div className="space-y-6">
                    <div><h3 className="text-xs text-gray-500 font-mono mb-3 uppercase">{tDash("dependenciesGroups.backend")}</h3><div className="flex flex-wrap gap-2">{filterStackByCategory(activeJob.stack, "backend").map((t) => <TT key={t} label={t} c="bg-orange-500/10 text-orange-400 border-orange-500/20" />)}</div></div>
                    <div><h3 className="text-xs text-gray-500 font-mono mb-3 uppercase">{tDash("dependenciesGroups.frontend")}</h3><div className="flex flex-wrap gap-2">{filterStackByCategory(activeJob.stack, "frontend").map((t) => <TT key={t} label={t} c="bg-blue-500/10 text-blue-400 border-blue-500/20" />)}</div></div>
                  </div>
                ) : <div className="text-[var(--muted)] text-xs font-mono">{tDash("dependenciesEmpty")}</div>}
              </motion.div>
            </AnimatePresence>
          </div>
        </aside>
      </main>
    </div>
  );
}

function SB({ icon: I, label, href, color, status = "CONN" }: { icon: React.ElementType; label: string; href: string; color: string; status?: string }) {
  return <a href={href} target="_blank" rel="noreferrer" className="group flex items-center gap-2 bg-black/50 border border-[var(--border)] px-3 py-2 rounded hover:border-white/30 transition-all focus:ring-2 focus:ring-[var(--accent)]" aria-label={`${label} ${status}`}><I size={14} className={color} aria-hidden="true" /><span className="hidden md:inline text-[10px] font-mono text-[var(--muted)] group-hover:text-white">{label}::{status}</span></a>;
}
function Kpi({ label, value, sub, c }: { label: string; value: string; sub: string; c: string }) {
  return <article className={`bg-black/40 backdrop-blur border ${c} rounded p-3 md:p-4 hover:bg-white/5 transition-colors`} aria-label={`${label}: ${value}`}><div className="text-[10px] text-gray-500 font-mono uppercase mb-1">{label}</div><div className="text-xl md:text-2xl font-bold text-white mb-1">{value}</div><div className="text-[10px] text-gray-600">{sub}</div></article>;
}
function Badge({ type }: { type: string }) {
  const s: Record<string, string> = { INFO: "bg-blue-500/20 text-blue-400 border-blue-500/30", WARN: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30", ERROR: "bg-red-500/10 text-red-400 border-red-500/30", SUCCESS: "bg-green-500/10 text-green-400 border-green-500/30" };
  return <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${s[type] ?? s.INFO}`}>{type}</span>;
}
function TT({ label, c }: { label: string; c: string }) { return <span className={`text-xs font-mono px-2 py-1 rounded border ${c}`}>{label}</span>; }
function SvcMap({ archType, reduced }: { archType: ArchType; reduced: boolean | null }) {
  const t = useTranslations("Dashboard");
  return (
    <div className="bg-black/40 backdrop-blur-md border border-[var(--border)] rounded-lg p-6 min-h-[180px] flex flex-col justify-center relative overflow-hidden">
      <h2 className="absolute top-4 left-6 text-sm font-mono text-[var(--muted)] uppercase tracking-widest flex items-center gap-2"><Database size={16} aria-hidden="true" />{t("architectureViewLabel")}: <span className="text-white">{archType}</span></h2>
      <div className="flex items-center justify-around mt-6 relative z-10">
        <Node icon={Server} color="orange" label={t("serviceMapNodeLabels.server")} />
        <Line color="green" archType={archType} reduced={reduced} delay={0} />
        {archType === "microservices" && <><Node icon={Code} color="purple" size={18} label={t("serviceMapNodeLabels.gateway")} /><Line color="purple" archType={archType} reduced={reduced} delay={0.4} /></>}
        <Node icon={Terminal} color="blue" label={t("serviceMapNodeLabels.client")} />
      </div>
    </div>
  );
}
function Node({ icon: I, color, label, size = 20 }: { icon: React.ElementType; color: string; label: string; size?: number }) {
  return <div className="flex flex-col items-center gap-2"><div className={`w-12 h-12 rounded bg-${color}-500/10 border border-${color}-500/50 flex items-center justify-center text-${color}-500`}><I size={size} aria-hidden="true" /></div><span className="text-[10px] font-mono text-gray-500">{label}</span></div>;
}
function Line({ color, archType, reduced, delay }: { color: string; archType: ArchType; reduced: boolean | null; delay: number }) {
  return <div className="flex-1 h-[1px] bg-gray-800 relative mx-4">
    {!reduced ? <motion.div className={`absolute top-[-1px] left-0 w-8 h-[3px] bg-${color}-500 shadow-[0_0_10px]`} animate={{ x: ["0%", "400%"], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: archType === "monolith" ? 2 : 0.8, delay, ease: "linear" }} /> : <div className={`absolute top-[-1px] left-0 w-full h-[3px] bg-${color}-500/30`} />}
  </div>;
}
