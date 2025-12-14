"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Server, Code, Database, Github, Linkedin, Send, Download } from "lucide-react";
import { useLocale, useMessages, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import Link from "next/link";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeSwitcher from "./ThemeSwitcher";

type JobData = {
  id: string;
  year: string;
  role: string;
  company: string;
  type: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  desc: string;
  stack: string[];
  archType: 'microservices' | 'monolith' | 'soa' | 'hybrid';
};

function inferArchType(job: Pick<JobData, "desc" | "stack">): NonNullable<JobData["archType"]> {
  const haystack = `${job.desc} ${(job.stack ?? []).join(" ")}`.toLowerCase();
  if (/(eureka|zuul|spring cloud|docker|kafka|micro)/.test(haystack)) return "microservices";
  if (/(soap|axis|mulesoft|bpel|soa)/.test(haystack)) return "soa";
  if (/(erp|jsp|servlet|monolith|pl\/sql|jasper)/.test(haystack)) return "monolith";
  return "hybrid";
}

function normalizeCareerItem(input: unknown, index: number): JobData | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;

  const id = typeof raw.id === "string" ? raw.id : `job_${index}`;
  const year = typeof raw.year === "string" ? raw.year : "";
  const role = typeof raw.role === "string" ? raw.role : "";
  const company = typeof raw.company === "string" ? raw.company : "";
  const type = (typeof raw.type === "string" ? raw.type : "INFO") as JobData["type"];
  const desc = typeof raw.desc === "string" ? raw.desc : "";
  const stack = Array.isArray(raw.stack) ? (raw.stack.filter((s) => typeof s === "string") as string[]) : [];
  const archType =
    raw.archType === "microservices" || raw.archType === "monolith" || raw.archType === "soa" || raw.archType === "hybrid"
      ? raw.archType
      : inferArchType({ desc, stack });

  return { id, year, role, company, type, desc, stack, archType };
}

export default function Dashboard() {
  const tApp = useTranslations("App");
  const tDash = useTranslations("Dashboard");
  const messages = useMessages() as Record<string, unknown>;
  const careerHistory = useMemo(() => {
    const raw = messages?.careerHistory;
    if (!Array.isArray(raw)) return [];
    const normalized = raw.map((item, idx) => normalizeCareerItem(item, idx)).filter(Boolean) as JobData[];
    return normalized.sort((a, b) => {
      const ay = Number(a.year) || 0;
      const by = Number(b.year) || 0;
      if (by !== ay) return by - ay;
      return a.id.localeCompare(b.id);
    });
  }, [messages]);
  const [activeJob, setActiveJob] = useState<JobData | null>(careerHistory[0] ?? null);
  const { theme } = useTheme();
  const locale = useLocale();

  useEffect(() => {
    if (careerHistory.length > 0) {
      setActiveJob((prev) => {
        if (!prev) return careerHistory[0];
        return careerHistory.some((j) => j.id === prev.id) ? prev : careerHistory[0];
      });
    }
  }, [careerHistory]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-4 md:p-8 font-sans bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,0.08),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.06),transparent_40%)] bg-fixed">      
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/10 to-green-900/10 pointer-events-none" />
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-[var(--border)] pb-6 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="relative">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-20" />
            </div>
            <span className="font-mono text-xs text-green-500 tracking-widest uppercase">{tDash("systemOnline")}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            {tApp("title")}
          </h1>
          <p className="text-[var(--muted)] font-mono text-sm mt-1">
            {tDash("headline")}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <SocialBadge icon={Linkedin} label="LINKEDIN" href="https://www.linkedin.com/in/murillossoares" color="text-blue-400" />
          <SocialBadge icon={Github} label="GITHUB" href="https://github.com/mhsscel" color="text-purple-400" />
          <SocialBadge icon={Send} label="TELEGRAM" href="http://t.me/murillossoares" color="text-sky-400" status="ENCRYPTED" />
          <ThemeSwitcher />
          <LanguageSwitcher />
          <Link href={`/${locale}/cv-print?lang=${locale}&theme=${theme}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/20 px-4 py-2 rounded text-xs font-mono transition-all text-white">
            <Download size={14} />
            <span>GET_CV.pdf</span>
          </Link>
        </div>
      </header>
      
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
                
        <section className="lg:col-span-2 space-y-6">
                    
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <KpiCard label={tDash("kpis.uptimeLabel")} value={tDash("kpis.uptimeValue")} sub={tDash("kpis.uptimeSub")} color="border-green-500/30" />
            <KpiCard label={tDash("kpis.stackLabel")} value={tDash("kpis.stackValue")} sub={tDash("kpis.stackSub")} color="border-blue-500/30" />
            <KpiCard label={tDash("kpis.archLabel")} value={tDash("kpis.archValue")} sub={tDash("kpis.archSub")} color="border-purple-500/30" />
          </div>
          
          <div className="bg-black/40 backdrop-blur-md border border-[var(--border)] rounded-lg p-6 relative overflow-hidden group">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-mono text-[var(--muted)] uppercase tracking-widest flex items-center gap-2">
                <Terminal size={16} /> {tDash("eventHistoryTitle")}
              </h2>
              <span className="text-[10px] text-gray-600 font-mono">{tDash("eventHistoryHint")}</span>
            </div>

            {careerHistory.length === 0 ? (
              <div className="text-[color:var(--muted)] text-xs font-mono">{tDash("eventHistoryEmpty")}</div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {careerHistory.map((job) => (
                  <motion.div
                    key={job.id}
                    onClick={() => setActiveJob(job)}
                    whileHover={{ x: 4 }}
                    className={`
                      cursor-pointer p-4 rounded border-l-2 transition-all duration-300
                      ${activeJob?.id === job.id 
                        ? 'bg-white/5 border-l-green-500 border-t border-r border-b border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.5)]' 
                        : 'hover:bg-white/5 border-l-gray-700 border-transparent'}
                    `}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-mono text-green-500 text-xs">[{job.year}]</span>
                      <Badge type={job.type} />
                    </div>
                    <h3 className="text-white font-bold">{job.role} @ {job.company}</h3>
                    <p className="text-sm text-[var(--muted)] font-mono mt-1 leading-relaxed">
                      {`> ${job.desc}`}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          
          {activeJob ? <ServiceMap archType={activeJob.archType} /> : null}

        </section>
        
        <section className="space-y-6">
                    
          <div className="bg-black/40 backdrop-blur-md border border-[var(--border)] rounded-lg p-6 h-full min-h-[300px]">
            <h2 className="text-sm font-mono text-[var(--muted)] uppercase tracking-widest mb-6 flex items-center gap-2">
              <Server size={16} /> {tDash("dependenciesTitle")}
            </h2>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeJob?.id ?? "empty"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeJob ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xs text-gray-500 font-mono mb-3 uppercase">{tDash("dependenciesGroups.backend")}</h3>
                      <div className="flex flex-wrap gap-2">
                        {activeJob.stack
                          .filter((t) => /Java|Spring|Docker|Oracle|SQL|Postgre/.test(t))
                          .map((tech) => (
                            <TechTag key={tech} label={tech} color="bg-orange-500/10 text-orange-400 border-orange-500/20" />
                          ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs text-gray-500 font-mono mb-3 uppercase">{tDash("dependenciesGroups.frontend")}</h3>
                      <div className="flex flex-wrap gap-2">
                        {activeJob.stack
                          .filter((t) => /Angular|React|Flutter|JS|HTML/.test(t))
                          .map((tech) => (
                            <TechTag key={tech} label={tech} color="bg-blue-500/10 text-blue-400 border-blue-500/20" />
                          ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-[color:var(--muted)] text-xs font-mono">{tDash("dependenciesEmpty")}</div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

        </section>
      </main>
    </div>
  );
}

const SocialBadge = ({ icon: Icon, label, href, color, status = 'CONN' }: { icon: React.ElementType; label: string; href: string; color: string; status?: string }) => (
  <a href={href} target="_blank" rel="noreferrer" 
     className="group flex items-center gap-2 bg-black/50 border border-[var(--border)] px-3 py-2 rounded hover:border-white/30 transition-all">
    <Icon size={14} className={color} />
    <span className="hidden md:inline text-[10px] font-mono text-[var(--muted)] group-hover:text-white transition-colors">
      {label}::{status}
    </span>
  </a>
);

const KpiCard = ({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) => (
  <div className={`bg-black/40 backdrop-blur border ${color} rounded p-3 md:p-4 hover:bg-white/5 transition-colors`}>
    <div className="text-[10px] text-gray-500 font-mono uppercase mb-1">{label}</div>
    <div className="text-xl md:text-2xl font-bold text-white mb-1">{value}</div>
    <div className="text-[10px] text-gray-600">{sub}</div>
  </div>
);

const Badge = ({ type }: { type: string }) => {
  const styles = {
    INFO: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    WARN: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    ERROR: 'bg-red-500/10 text-red-400 border-red-500/30',
    SUCCESS: 'bg-green-500/10 text-green-400 border-green-500/30'
  };
  return (
    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${styles[type as keyof typeof styles]}`}>
      {type}
    </span>
  );
};

const TechTag = ({ label, color }: { label: string; color: string }) => (
  <span className={`text-xs font-mono px-2 py-1 rounded border ${color}`}>
    {label}
  </span>
);

const ServiceMap = ({ archType }: { archType: JobData["archType"] }) => {
  const t = useTranslations("Dashboard");
  return (
    <div className="bg-black/40 backdrop-blur-md border border-[var(--border)] rounded-lg p-6 min-h-[180px] flex flex-col justify-center relative overflow-hidden">
      <h2 className="absolute top-4 left-6 text-sm font-mono text-[var(--muted)] uppercase tracking-widest flex items-center gap-2">
         <Database size={16} /> {t("architectureViewLabel")}: <span className="text-white">{archType}</span>
      </h2>
      
      <div className="flex items-center justify-around mt-6 relative z-10">        
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded bg-orange-500/10 border border-orange-500/50 flex items-center justify-center text-orange-500">
            <Server size={20} />
          </div>
          <span className="text-[10px] font-mono text-gray-500">{t("serviceMapNodeLabels.server")}</span>
        </div>
        
        <div className="flex-1 h-[1px] bg-gray-800 relative mx-4">
          <motion.div 
            className="absolute top-[-1px] left-0 w-8 h-[3px] bg-green-500 shadow-[0_0_10px_#22c55e]"
            animate={{ x: ['0%', '400%'], opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: archType === 'monolith' ? 2 : 0.8, ease: "linear" }}
          />
        </div>
        
        {archType === 'microservices' && (
           <>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded bg-purple-500/10 border border-purple-500/50 flex items-center justify-center text-purple-500">
                <Code size={18} />
              </div>
              <span className="text-[10px] font-mono text-gray-500">{t("serviceMapNodeLabels.gateway")}</span>
            </div>
            <div className="flex-1 h-[1px] bg-gray-800 relative mx-4">
               <motion.div 
                className="absolute top-[-1px] left-0 w-8 h-[3px] bg-purple-500"
                animate={{ x: ['0%', '400%'], opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8, delay: 0.4, ease: "linear" }}
              />
            </div>
           </>
        )}
        
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded bg-blue-500/10 border border-blue-500/50 flex items-center justify-center text-blue-500">
            <Terminal size={20} />
          </div>
          <span className="text-[10px] font-mono text-gray-500">{t("serviceMapNodeLabels.client")}</span>
        </div>
      </div>
    </div>
  );
};
