export type ArchType = "microservices" | "monolith" | "soa" | "hybrid";
export type LogLevel = "INFO" | "WARN" | "ERROR" | "SUCCESS";
export interface CareerMetric {
  id: string; year: string; role: string; company: string;
  type: LogLevel; desc: string; stack: string[]; archType: ArchType;
}
export type ScoreboardMetricId = "experience" | "engagements" | "technologies" | "architectures";
export interface ScoreboardMetric { id: ScoreboardMetricId; label: string; value: string; description: string; }
export interface ScoreboardData { metrics: ScoreboardMetric[]; }
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
  const years = events.map((event) => Number(event.year)).filter((year) => Number.isFinite(year) && year > 0);
  const experience = years.length > 0 ? Math.max(...years) - Math.min(...years) + 1 : 0;
  const technologies = new Set(
    events.flatMap((event) => event.stack).map((item) => item.trim().toLowerCase()).filter(Boolean),
  ).size;
  const architectures = new Set(events.map((event) => event.archType)).size;

  return {
    metrics: [
      { id: "experience", label: t("metrics.experience.label"), value: String(experience), description: t("metrics.experience.description") },
      { id: "engagements", label: t("metrics.engagements.label"), value: String(events.length), description: t("metrics.engagements.description") },
      { id: "technologies", label: t("metrics.technologies.label"), value: String(technologies), description: t("metrics.technologies.description") },
      { id: "architectures", label: t("metrics.architectures.label"), value: String(architectures), description: t("metrics.architectures.description") },
    ],
  };
}
