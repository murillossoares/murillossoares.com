import { yearOf } from "../lib/dates";
import { hasMonth, toMonth } from "../lib/period";
import { distinctTechnologies } from "../lib/tech";

export { yearOf };

export type ArchType = "microservices" | "monolith" | "soa" | "hybrid";
export type PositionKind = "employment" | "internship" | "freelance";

export interface CareerMetric {
  id: string;
  company: string;
  role: string;
  desc: string;
  /** "YYYY" or "YYYY-MM". */
  start: string;
  /** "YYYY" or "YYYY-MM"; null when unknown or current. */
  end: string | null;
  current: boolean;
  kind: PositionKind;
  location?: string;
  stack: string[];
  archType: ArchType;
}

export type ScoreboardMetricId = "experience" | "engagements" | "technologies" | "architectures";
export interface ScoreboardMetric { id: ScoreboardMetricId; label: string; value: string; description: string; }
export interface ScoreboardData { metrics: ScoreboardMetric[]; }

const PATTERNS: Record<Exclude<ArchType, "hybrid">, RegExp> = {
  microservices: /(eureka|zuul|spring cloud|docker|kafka|micro)/,
  soa: /(soap|axis|mulesoft|bpel|soa)/,
  monolith: /(erp|jsp|servlet|monolith|pl\/sql|jasper)/,
};

export function inferArchType(desc: string, stack: string[]): ArchType {
  const h = `${desc} ${stack.join(" ")}`.toLowerCase();
  if (PATTERNS.microservices.test(h)) return "microservices";
  if (PATTERNS.soa.test(h)) return "soa";
  if (PATTERNS.monolith.test(h)) return "monolith";
  return "hybrid";
}

/** Newest first; current positions win ties, then later start month, then id for stability. */
export function sortCareerEvents(events: CareerMetric[]): CareerMetric[] {
  return [...events].sort((a, b) => {
    if (a.current !== b.current) return a.current ? -1 : 1;
    if (a.start !== b.start) return b.start.localeCompare(a.start);
    return a.id.localeCompare(b.id);
  });
}

/**
 * Last calendar year a position was active. Current → `now`; known end → its year; unknown end → the year before the
 * next position starts (never before its own start). The scoreboard states this assumption next to the chart.
 */
export function effectiveEndYear(event: CareerMetric, events: CareerMetric[], now: Date): number {
  const start = yearOf(event.start);
  if (event.current) return now.getUTCFullYear();
  if (event.end) return Math.max(start, yearOf(event.end));
  const laterStarts = events.map((e) => yearOf(e.start)).filter((y) => y > start);
  return laterStarts.length ? Math.max(start, Math.min(...laterStarts) - 1) : start;
}

export function careerSpan(events: CareerMetric[], now = new Date()): { from: number; to: number; years: number; exact: boolean } {
  const starts = events.map((e) => yearOf(e.start)).filter(Boolean);
  if (starts.length === 0) return { from: 0, to: 0, years: 0, exact: true };
  const ends = events.map((e) => effectiveEndYear(e, events, now)).filter(Boolean);
  return { from: Math.min(...starts), to: Math.max(...ends), ...experienceYears(events, now) };
}

/**
 * Whole years from the first start to the last end, counted in months. A year-only date is read at its least
 * favourable month (start → December, end → January), so the result is a guaranteed minimum; `exact` is false
 * then, and the UI shows "8+". Once every date has a month the count is exact. Never rounds up.
 */
function experienceYears(events: CareerMetric[], now: Date): { years: number; exact: boolean } {
  // Positions without a readable start are ignored here, as careerSpan does (one bad row must not zero the count).
  const dated = events.filter((e) => yearOf(e.start) > 0);
  if (dated.length === 0) return { years: 0, exact: true };
  const startBound = (d: string) => (hasMonth(d) ? d : `${d.slice(0, 4)}-12`);
  const endBound = (e: CareerMetric) => {
    if (e.current) return toMonth(now);
    if (hasMonth(e.end)) return e.end!;
    return `${effectiveEndYear(e, dated, now)}-01`;
  };
  const first = dated.map((e) => startBound(e.start)).sort()[0];
  const last = dated.map(endBound).sort().at(-1)!;
  // Completed months only (no inclusive +1): a count that must never overstate cannot credit the current month.
  const months = Math.max(0, monthIndex(last) - monthIndex(first));
  const exact = dated.length === events.length && dated.every((e) => hasMonth(e.start) && (e.current || hasMonth(e.end)));
  return { years: Math.floor(months / 12), exact };
}

const monthIndex = (d: string) => Number(d.slice(0, 4)) * 12 + Number(d.slice(5, 7)) - 1;

export interface CareerFacts {
  since: number;
  /** Whole years of experience; a minimum when `yearsExact` is false (some dates lack the month). */
  years: number;
  yearsExact: boolean;
  internships: number;
  positions: number;
  companies: number;
  technologies: number;
  architectures: number;
}

export function careerFacts(events: CareerMetric[], now = new Date()): CareerFacts {
  const span = careerSpan(events, now);
  return {
    since: span.from,
    years: span.years,
    yearsExact: span.exact,
    internships: events.filter((e) => e.kind === "internship").length,
    positions: events.length,
    companies: new Set(events.map((e) => e.company.trim().toLowerCase())).size,
    technologies: distinctTechnologies(events.map((e) => e.stack)).length,
    architectures: new Set(events.map((e) => e.archType)).size,
  };
}

/** "9" when exact, "8+" when the count is a guaranteed minimum. */
export function formatYears(facts: Pick<CareerFacts, "years" | "yearsExact">): string {
  return facts.yearsExact ? String(facts.years) : `${facts.years}+`;
}

export function calculateScoreboardMetrics(events: CareerMetric[], t: (key: string, values?: Record<string, string | number>) => string, now = new Date()): ScoreboardData {
  const facts = careerFacts(events, now);
  return {
    metrics: [
      { id: "experience", label: t("metrics.experience.label"), value: formatYears(facts), description: t("metrics.experience.description", { since: facts.since, internships: facts.internships }) },
      { id: "engagements", label: t("metrics.engagements.label"), value: String(facts.positions), description: t("metrics.engagements.description", { companies: facts.companies }) },
      { id: "technologies", label: t("metrics.technologies.label"), value: String(facts.technologies), description: t("metrics.technologies.description") },
      { id: "architectures", label: t("metrics.architectures.label"), value: String(facts.architectures), description: t("metrics.architectures.description") },
    ],
  };
}

/** Distinct technologies per calendar year, for the scoreboard's single-unit 3D chart. */
export function technologiesPerYear(events: CareerMetric[], now = new Date()): { year: number; count: number }[] {
  const span = careerSpan(events, now);
  if (!span.from) return [];
  const rows: { year: number; count: number }[] = [];
  for (let year = span.from; year <= span.to; year++) {
    const active = events.filter((e) => {
      return yearOf(e.start) <= year && year <= effectiveEndYear(e, events, now);
    });
    rows.push({ year, count: distinctTechnologies(active.map((e) => e.stack)).length });
  }
  return rows;
}
