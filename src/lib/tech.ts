export type TechCategory = "languages" | "backend" | "frontend" | "data" | "integration" | "infra" | "other";

export const TECH_CATEGORIES: TechCategory[] = ["languages", "backend", "frontend", "data", "integration", "infra", "other"];

export interface TechRef {
  /** Label shown as written in the career data, e.g. "Java 17". */
  label: string;
  /** Version-less identity used for counting, e.g. "Java". */
  canonical: string;
  category: TechCategory;
}

// Explicit catalogue instead of regex guessing: every item in career.json must resolve here
// (enforced by tech.test.ts), so the UI never silently drops a technology again.
const ENTRIES: Record<TechCategory, string[]> = {
  languages: ["Java", "Groovy", "Dart", "C#", "PHP", "JavaScript", "TypeScript", "Kotlin", "Python"],
  backend: ["Spring Boot", "Spring Web", "Spring Cloud", "Spring", "Jersey", "Netflix Eureka", "Node.js", "JasperReports", "Servlet", "JSP", "Hibernate"],
  frontend: ["Angular", "React", "Redux", "Flutter", "HTML/CSS", "Joomla", "Next.js"],
  data: ["Oracle", "PostgreSQL", "SQL Server", "PL/SQL", "SAP HANA", "Flyway", "MySQL", "MongoDB", "Redis"],
  integration: ["REST", "SOAP", "BPEL", "Swagger", "Kafka", "RabbitMQ"],
  infra: ["Docker", "Kubernetes", "AWS Lambda", "AWS", "Jenkins", "Gradle", "Maven", "Linux", "Git"],
  other: [],
};

const CATALOGUE = new Map<string, { name: string; category: TechCategory }>(
  (Object.entries(ENTRIES) as [TechCategory, string[]][]).flatMap(([category, names]) => names.map((name) => [name.toLowerCase(), { name, category }] as const)),
);

const VERSION_SUFFIX = /\s+v?\d+(?:\.\d+)*$/i;

/** Expands composite labels ("SOAP/REST") and resolves each part against the catalogue. */
export function resolveTech(label: string): TechRef[] {
  const trimmed = label.trim();
  if (!trimmed) return [];
  const key = trimmed.toLowerCase();
  if (!CATALOGUE.has(key) && key.includes("/") && !CATALOGUE.has(key.replace(VERSION_SUFFIX, ""))) {
    const parts = trimmed.split("/").map((part) => part.trim()).filter(Boolean);
    if (parts.every((part) => lookup(part))) return parts.map((part) => toRef(part, part));
  }
  return [toRef(trimmed, trimmed)];
}

function lookup(label: string) {
  const key = label.toLowerCase();
  return CATALOGUE.get(key) ?? CATALOGUE.get(key.replace(VERSION_SUFFIX, ""));
}

function toRef(label: string, source: string): TechRef {
  const entry = lookup(source);
  return { label, canonical: entry?.name ?? source, category: entry?.category ?? "other" };
}

export function isKnownTech(label: string): boolean {
  return resolveTech(label).every((ref) => ref.category !== "other");
}

export function groupStack(stack: string[]): { category: TechCategory; items: TechRef[] }[] {
  const refs = stack.flatMap(resolveTech);
  return TECH_CATEGORIES.map((category) => ({ category, items: refs.filter((ref) => ref.category === category) }))
    .filter((group) => group.items.length > 0);
}

export function distinctTechnologies(stacks: string[][]): string[] {
  const seen = new Map<string, string>();
  for (const ref of stacks.flat().flatMap(resolveTech)) {
    const key = ref.canonical.toLowerCase();
    if (!seen.has(key)) seen.set(key, ref.canonical);
  }
  return [...seen.values()];
}

/** Display names the LinkedIn sync looks for when inferring a stack from free-text descriptions. */
export function catalogueNames(): string[] {
  return [...CATALOGUE.values()].map((entry) => entry.name);
}
