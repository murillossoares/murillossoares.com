// Machine-readable views of the career data, shared by the static routes (/llms.txt, /resume.json, JSON-LD)
// and the MCP function so every consumer — Google, LLM crawlers, agents — reads the same facts.
// Relative imports only: this module is also bundled by Netlify Functions, which do not know the "@/" alias.
import { careerFacts, formatYears, type CareerMetric } from "../models/metrics";
import { hasMonth } from "./period";
import { careerFile, getCareerHistory, getHeadline, type CareerFile } from "../services/careerData";
import { formatPeriod } from "./period";
import { distinctTechnologies, groupStack } from "./tech";
import { absoluteUrl, LOCALES, LOCALE_TAGS } from "./site";

const ARCH_NAMES: Record<string, string> = { microservices: "Microservices", monolith: "Monolith", soa: "SOA", hybrid: "Hybrid" };
const CATEGORY_NAMES: Record<string, string> = {
  languages: "Languages", backend: "Backend", frontend: "Frontend & Mobile", data: "Data", integration: "Integration", infra: "Infra & DevOps", other: "Other",
};

/** ISO 8601 reduced precision only ("2019-03" or "2019"): what schema.org, JSON Resume and <time> accept. Never a day. */
export function isoDate(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (hasMonth(value)) return value;
  return /^\d{4}/.test(value) ? value.slice(0, 4) : undefined;
}

const SUMMARY: Record<string, (v: { name: string; headline: string; city: string; years: string; since: number; companies: number; technologies: number }) => string> = {
  en: (v) => `${v.name} is a ${v.headline.toLowerCase()} based in ${v.city}, with ${v.years} years of experience (since ${v.since}) across ${v.companies} companies, working with ${v.technologies} distinct technologies — mainly Java, Spring Boot, microservices, SOA, React and Angular.`,
  "pt-br": (v) => `${v.name} é ${v.headline.toLowerCase()} em ${v.city}, com ${v.years} anos de experiência (desde ${v.since}) em ${v.companies} empresas e ${v.technologies} tecnologias distintas — principalmente Java, Spring Boot, microsserviços, SOA, React e Angular.`,
  es: (v) => `${v.name} es ${v.headline.toLowerCase()} en ${v.city}, con ${v.years} años de experiencia (desde ${v.since}) en ${v.companies} empresas y ${v.technologies} tecnologías distintas — principalmente Java, Spring Boot, microservicios, SOA, React y Angular.`,
};

export function summary(locale = "en", file: CareerFile = careerFile, now = new Date()): string {
  const facts = careerFacts(getCareerHistory(locale, file), now);
  const render = SUMMARY[locale] ?? SUMMARY.en;
  return render({ name: file.person.name, headline: getHeadline(locale, file), city: file.person.location.city, ...facts, years: formatYears(facts) });
}

export function skills(file: CareerFile = careerFile): { category: string; items: string[] }[] {
  const all = distinctTechnologies(file.positions.map((p) => p.stack));
  return groupStack(all).map((g) => ({ category: CATEGORY_NAMES[g.category], items: g.items.map((i) => i.canonical) }));
}

function organizationRole(e: CareerMetric) {
  return {
    "@type": "OrganizationRole",
    roleName: e.role,
    startDate: isoDate(e.start),
    endDate: e.current ? undefined : isoDate(e.end),
    description: e.desc,
    worksFor: { "@type": "Organization", name: e.company },
  };
}

export function personJsonLd(locale: string, file: CareerFile = careerFile, now = new Date()) {
  const history = getCareerHistory(locale, file);
  const person = file.person;
  const pageUrl = absoluteUrl(`/${locale}`);
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
      alternateName: person.alternateNames,
      givenName: person.givenName,
      additionalName: person.additionalName,
      familyName: person.familyName,
      jobTitle: getHeadline(locale, file),
      description: summary(locale, file, now),
      url: pageUrl,
      address: { "@type": "PostalAddress", addressLocality: person.location.city, addressCountry: person.location.country },
      sameAs: Object.values(person.links),
      knowsAbout: distinctTechnologies(file.positions.map((p) => p.stack)),
      // schema.org Role pattern: the wrapped property (worksFor) repeats inside each OrganizationRole, and the role's
      // start/end dates say when that employment held, so past jobs carry an endDate. alumniOf would be wrong here: its
      // role dates mean "alumnus since". A bare worksFor inside a hasOccupation Role is invalid (validator warning).
      worksFor: history.map(organizationRole),
      alumniOf: person.education.map((e) => ({
        "@type": "CollegeOrUniversity",
        name: e.institution,
        alternateName: e.shortName,
        url: e.url,
      })),
    },
  };
}

function positionMarkdown(e: CareerMetric, locale: string, now: Date): string {
  const stack = groupStack(e.stack).map((g) => `${CATEGORY_NAMES[g.category]}: ${g.items.map((i) => i.label).join(", ")}`).join("; ");
  return [
    `### ${e.role} — ${e.company} (${formatPeriod(e, locale, now)})`,
    e.desc,
    `- Architecture: ${ARCH_NAMES[e.archType]}`,
    `- Stack: ${stack}`,
    e.kind === "internship" ? "- Type: internship" : "",
  ].filter(Boolean).join("\n");
}

export function careerMarkdown(locale = "en", file: CareerFile = careerFile, now = new Date()): string {
  return getCareerHistory(locale, file).map((e) => positionMarkdown(e, locale, now)).join("\n\n");
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

- Full name: ${file.person.fullName} (also known as ${file.person.alternateNames.filter((n) => n !== file.person.fullName).concat(file.person.name).join(", ")})
- Education: ${file.person.education.map((e) => `${e.institution} (${e.shortName}), ${e.area.en}`).join("; ")}
- Location: ${file.person.location.city}, ${file.person.location.country}
- Experience: ${formatYears(facts)} years since ${facts.since} (${facts.internships} internships included), ${facts.positions} positions, ${facts.companies} companies
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
    education: person.education.map((e) => ({ institution: e.institution, url: e.url, area: e.area[locale] ?? e.area.en })),
    skills: skills(file).map((g) => ({ name: g.category, keywords: g.items })),
    meta: { canonical: absoluteUrl("/resume.json"), lastModified: file.sync.syncedAt ?? undefined },
  };
}
