export type ArchType = "microservices" | "monolith" | "soa" | "hybrid";
export type LogLevel = "INFO" | "WARN" | "ERROR" | "SUCCESS";
export interface CareerMetric {
  id: string; year: string; role: string; company: string;
  type: LogLevel; desc: string; stack: string[]; archType: ArchType;
}
export interface ScoreboardMetric { label: string; value: string; sub: string; percent: number; }
export interface ScoreboardData {
  uptime: ScoreboardMetric; stackDepth: ScoreboardMetric; architecture: ScoreboardMetric; projects: ScoreboardMetric; careerEvents: CareerMetric[];
}
const PATTERNS: Record<ArchType, RegExp> = {
  microservices: /(eureka|zuul|spring cloud|docker|kafka|micro)/,
  soa: /(soap|axis|mulesoft|bpel|soa)/,
  monolith: /(erp|jsp|servlet|monolith|pl\/sql|jasper)/,
  hybrid: /(?:)/,
};
export function inferArchType(desc: string, stack: string[]): ArchType {
  const h = `${desc} ${stack.join(" ")}`.toLowerCase();
  if (PATTERNS.microservices.test(h)) return "microservices";
  if (PATTERNS.soa.test(h)) return "soa";
  if (PATTERNS.monolith.test(h)) return "monolith";
  return "hybrid";
}
export function sortCareerEvents(events: CareerMetric[]): CareerMetric[] {
  return [...events].sort((a, b) => { const ya = Number(a.year) || 0, yb = Number(b.year) || 0; return yb !== ya ? yb - ya : a.id.localeCompare(b.id); });
}
export function calculateScoreboardMetrics(events: CareerMetric[], t: (key: string) => string): ScoreboardData {
  return {
    uptime: { label: t("Dashboard.kpis.uptimeLabel"), value: t("Dashboard.kpis.uptimeValue"), sub: t("Dashboard.kpis.uptimeSub"), percent: 90 },
    stackDepth: { label: t("Dashboard.kpis.stackLabel"), value: t("Dashboard.kpis.stackValue"), sub: t("Dashboard.kpis.stackSub"), percent: 80 },
    architecture: { label: t("Dashboard.kpis.archLabel"), value: t("Dashboard.kpis.archValue"), sub: t("Dashboard.kpis.archSub"), percent: 70 },
    projects: { label: t("Scoreboard.metrics.projects.label"), value: String(events.length), sub: t("Scoreboard.metrics.projects.description"), percent: 65 },
    careerEvents: events,
  };
}
