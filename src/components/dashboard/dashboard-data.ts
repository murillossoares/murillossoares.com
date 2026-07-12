import { archTypes, jobTypes, type ArchType, type JobData, type JobType } from "./types";

const backendTechPatterns = [
  /(^|\b)Java\b/i,
  /Spring/i,
  /Docker/i,
  /Oracle/i,
  /SQL/i,
  /Postgre/i,
  /Node\.?js/i,
  /AWS Lambda/i,
  /PHP/i,
  /C#/i,
] as const;

const frontendTechPatterns = [
  /Angular/i,
  /React/i,
  /Flutter/i,
  /Dart/i,
  /Redux/i,
  /HTML/i,
  /CSS/i,
  /Next\.?js/i,
  /TypeScript/i,
  /JavaScript/i,
] as const;

function isJobType(value: unknown): value is JobType {
  return typeof value === "string" && (jobTypes as readonly string[]).includes(value);
}

function isArchType(value: unknown): value is ArchType {
  return typeof value === "string" && (archTypes as readonly string[]).includes(value);
}

export function inferArchType(job: Pick<JobData, "desc" | "stack">): ArchType {
  const haystack = `${job.desc} ${(job.stack ?? []).join(" ")}`.toLowerCase();
  if (/(eureka|zuul|spring cloud|docker|kafka|micro)/.test(haystack)) return "microservices";
  if (/(soap|axis|mulesoft|bpel|soa)/.test(haystack)) return "soa";
  if (/(erp|jsp|servlet|monolith|pl\/sql|jasper)/.test(haystack)) return "monolith";
  return "hybrid";
}

export function normalizeCareerItem(input: unknown, index: number): JobData | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;

  const id = typeof raw.id === "string" ? raw.id : `job_${index}`;
  const year = typeof raw.year === "string" ? raw.year : "";
  const role = typeof raw.role === "string" ? raw.role : "";
  const company = typeof raw.company === "string" ? raw.company : "";
  const type = isJobType(raw.type) ? raw.type : "INFO";
  const desc = typeof raw.desc === "string" ? raw.desc : "";
  const stack = Array.isArray(raw.stack) ? raw.stack.filter((item): item is string => typeof item === "string") : [];
  const archType = isArchType(raw.archType) ? raw.archType : inferArchType({ desc, stack });

  return { id, year, role, company, type, desc, stack, archType };
}

export function parseCareerHistory(input: unknown): JobData[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item, index) => normalizeCareerItem(item, index))
    .filter((item): item is JobData => item !== null)
    .sort((left, right) => {
      const leftYear = Number(left.year) || 0;
      const rightYear = Number(right.year) || 0;
      if (rightYear !== leftYear) return rightYear - leftYear;
      return left.id.localeCompare(right.id);
    });
}

export function pickStackTechnologies(stack: string[], group: "backend" | "frontend"): string[] {
  const patterns = group === "backend" ? backendTechPatterns : frontendTechPatterns;
  return stack.filter((tech) => patterns.some((pattern) => pattern.test(tech)));
}
