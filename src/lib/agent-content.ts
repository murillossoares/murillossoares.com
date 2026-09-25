// Machine-readable views of the career data, shared by the static routes (/llms.txt, /resume.json, JSON-LD)
// and the MCP function so every consumer — Google, LLM crawlers, agents — reads the same facts.
// Relative imports only: this module is also bundled by Netlify Functions, which do not know the "@/" alias.
import { careerFacts, type CareerMetric } from "../models/metrics";
import { careerFile, formatPeriod, getCareerHistory, getHeadline, type CareerFile } from "../services/careerData";
import { distinctTechnologies, groupStack } from "./tech";
import { absoluteUrl, LOCALES, LOCALE_TAGS } from "./site";

const ARCH_NAMES: Record<string, string> = { microservices: "Microservices", monolith: "Monolith", soa: "SOA", hybrid: "Hybrid" };
const CATEGORY_NAMES: Record<string, string> = {
  languages: "Languages", backend: "Backend", frontend: "Frontend & Mobile", data: "Data", integration: "Integration", infra: "Infra & DevOps", other: "Other",
};

function isoDate(value: string | null): string | undefined {
  if (!value) return undefined;
  return value.length >= 7 ? value.slice(0, 7) : value.slice(0, 4);
}

export function summary(locale = "en", file: CareerFile = careerFile, now = new Date()): string {
  const facts = careerFacts(getCareerHistory(locale, file), now);
  const { name, location } = file.person;
  return `${name} is a ${getHeadline("en", file).toLowerCase()} based in ${location.city}, with ${facts.years} years of experience (since ${facts.since}) across ${facts.companies} companies, working with ${facts.technologies} distinct technologies — mainly Java, Spring Boot, microservices, SOA, React and Angular.`;
}

export function skills(file: CareerFile = careerFile): { category: string; items: string[] }[] {
  const all = distinctTechnologies(file.positions.map((p) => p.stack));
  return groupStack(all).map((g) => ({ category: CATEGORY_NAMES[g.category], items: g.items.map((i) => i.canonical) }));
}

export function personJsonLd(locale: string, file: CareerFile = careerFile, now = new Date()) {
  const history = getCareerHistory(locale, file);
  const person = file.person;
  const pageUrl = absoluteUrl(`/${locale}`);
  const current = history.find((e) => e.current);
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${pageUrl}#page`,
    url: pageUrl,
    inLanguage: LOCALE_TAGS[locale]?.hreflang ?? locale,
    dateModified: file.sync.syncedAt ?? undefined,
    mainEntity: {
      "@type": "Person",
      "@id": `${absoluteUrl("/")}#person`,
      name: person.name,
      alternateName: person.alias,
      jobTitle: getHeadline(locale, file),
      description: summary(locale, file, now),
      url: pageUrl,
      address: { "@type": "PostalAddress", addressLocality: person.location.city, addressCountry: person.location.country },
      sameAs: Object.values(person.links),
      knowsAbout: distinctTechnologies(file.positions.map((p) => p.stack)),
      worksFor: current ? { "@type": "Organization", name: current.company } : undefined,
      hasOccupation: history.map((e) => ({
        "@type": "Role",
        roleName: e.role,
        startDate: isoDate(e.start),
        endDate: e.current ? undefined : isoDate(e.end),
        description: e.desc,
        worksFor: { "@type": "Organization", name: e.company },
      })),
    },
  };
}

function positionMarkdown(e: CareerMetric, present: string): string {
  const stack = groupStack(e.stack).map((g) => `${CATEGORY_NAMES[g.category]}: ${g.items.map((i) => i.label).join(", ")}`).join("; ");
  return [
    `### ${e.role} — ${e.company} (${formatPeriod(e, present)})`,
    e.desc,
    `- Architecture: ${ARCH_NAMES[e.archType]}`,
    `- Stack: ${stack}`,
    e.kind === "internship" ? "- Type: internship" : "",
  ].filter(Boolean).join("\n");
}

export function careerMarkdown(locale = "en", file: CareerFile = careerFile, now = new Date()): string {
  const present = locale === "en" ? "present" : locale === "es" ? "actual" : "atual";
  const history = getCareerHistory(locale, file);
  return history.map((e) => positionMarkdown(e, present)).join("\n\n");
}

export function llmsTxt(file: CareerFile = careerFile, now = new Date()): string {
  const { name, links } = file.person;
  return `# ${name}

> ${summary("en", file, now)}

This site is a static portfolio. Everything a human sees is also available as plain data below; prefer these over scraping the HTML.

## Data
- [Full profile as Markdown](${absoluteUrl("/llms-full.txt")}): complete career history in English and Portuguese, one section per position
- [JSON Resume](${absoluteUrl("/resume.json")}): the same data in the jsonresume.org schema (English)
- [MCP server](${absoluteUrl("/mcp")}): Streamable HTTP endpoint with tools \`get_profile\`, \`list_experience\` and \`find_experience_by_technology\`

## Pages
${LOCALES.map((l) => `- [Portfolio (${LOCALE_TAGS[l].name})](${absoluteUrl(`/${l}`)})`).join("\n")}
${LOCALES.map((l) => `- [Career scoreboard (${LOCALE_TAGS[l].name})](${absoluteUrl(`/${l}/scoreboard`)})`).join("\n")}

## Contact
${Object.entries(links).map(([k, v]) => `- [${k[0].toUpperCase()}${k.slice(1)}](${v})`).join("\n")}
`;
}

export function llmsFullTxt(file: CareerFile = careerFile, now = new Date()): string {
  const facts = careerFacts(getCareerHistory("en", file), now);
  return `# ${file.person.name} — ${getHeadline("en", file)}

> ${summary("en", file, now)}

- Location: ${file.person.location.city}, ${file.person.location.country}
- Experience: ${facts.years} years since ${facts.since} (${facts.internships} internships included), ${facts.positions} positions, ${facts.companies} companies
- Architecture models worked with: ${facts.architectures}
- Links: ${Object.values(file.person.links).join(", ")}
- Data last synced: ${file.sync.syncedAt ?? "manually maintained"}

## Skills
${skills(file).map((g) => `- ${g.category}: ${g.items.join(", ")}`).join("\n")}

## Experience (English)

${careerMarkdown("en", file, now)}

## Experiência (Português)

${careerMarkdown("pt-br", file, now)}
`;
}

/** https://jsonresume.org/schema */
export function jsonResume(locale = "en", file: CareerFile = careerFile, now = new Date()) {
  const person = file.person;
  return {
    $schema: "https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json",
    basics: {
      name: person.name,
      label: getHeadline(locale, file),
      url: absoluteUrl(`/${locale}`),
      summary: summary(locale, file, now),
      location: { city: person.location.city, countryCode: person.location.country },
      profiles: Object.entries(person.links).map(([network, url]) => ({ network, url, username: url.replace(/\/$/, "").split("/").pop() })),
    },
    work: getCareerHistory(locale, file).map((e) => ({
      name: e.company,
      position: e.role,
      startDate: isoDate(e.start),
      endDate: e.current ? undefined : isoDate(e.end),
      summary: e.desc,
      highlights: [`Architecture: ${ARCH_NAMES[e.archType]}`],
      keywords: e.stack,
    })),
    skills: skills(file).map((g) => ({ name: g.category, keywords: g.items })),
    meta: { canonical: absoluteUrl("/resume.json"), lastModified: file.sync.syncedAt ?? undefined },
  };
}
