import { CareerMetric, inferArchType, sortCareerEvents, ArchType, LogLevel } from "@/models/metrics";
export function parseCareerHistory(raw: unknown[]): CareerMetric[] {
  if (!Array.isArray(raw)) return [];
  const normalized = raw.map((item, idx) => {
    if (!item || typeof item !== "object") return null;
    const r = item as Record<string, unknown>;
    const id = typeof r.id === "string" ? r.id : `job_${idx}`;
    const year = typeof r.year === "string" ? r.year : "";
    const role = typeof r.role === "string" ? r.role : "";
    const company = typeof r.company === "string" ? r.company : "";
    const type = (typeof r.type === "string" ? r.type : "INFO") as LogLevel;
    const desc = typeof r.desc === "string" ? r.desc : "";
    const stack = Array.isArray(r.stack) ? r.stack.filter((s): s is string => typeof s === "string") : [];
    const archType: ArchType = ["microservices", "monolith", "soa", "hybrid"].includes(r.archType as string) ? (r.archType as ArchType) : inferArchType(desc, stack);
    return { id, year, role, company, type, desc, stack, archType };
  }).filter((x): x is CareerMetric => x !== null);
  return sortCareerEvents(normalized);
}
export function filterStackByCategory(stack: string[], category: "backend" | "frontend"): string[] {
  if (category === "backend") return stack.filter(t => /Java|Spring|Docker|Oracle|SQL|Postgre/.test(t));
  return stack.filter(t => /Angular|React|Flutter|JS|HTML/.test(t));
}
