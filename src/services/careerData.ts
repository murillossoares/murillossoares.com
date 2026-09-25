import career from "../data/career.json";
import { inferArchType, sortCareerEvents, type ArchType, type CareerMetric, type PositionKind } from "../models/metrics";

export type LocaleText = { role: string; summary: string };

export interface CareerPosition {
  id: string;
  company: string;
  start: string;
  end: string | null;
  current: boolean;
  kind: PositionKind;
  location?: string;
  archType?: ArchType;
  stack: string[];
  i18n: Record<string, LocaleText>;
  linkedin?: Record<string, unknown>;
  needsReview?: boolean;
}

export interface CareerFile {
  person: {
    /** Brand name shown on the site. */
    name: string;
    fullName: string;
    /** Other names people search for (e.g. the LinkedIn display name). */
    alternateNames: string[];
    givenName: string;
    additionalName?: string;
    familyName: string;
    /** Playful persona handle used by the easter egg; not an identity. */
    alias: string;
    location: { city: string; country: string };
    links: Record<string, string>;
    headline: Record<string, string>;
    tagline: string;
    /** Most relevant first; the first entry is the one shown on the page and in the PDF. */
    education: {
      institution: string;
      shortName: string;
      url: string;
      degree: Record<string, string>;
      area: Record<string, string>;
      start: string;
      end: string;
    }[];
  };
  sync: { source: string; syncedAt: string | null; exportHash?: string };
  positions: CareerPosition[];
}

export const careerFile = career as CareerFile;
const FALLBACK_LOCALE = "en";

function localized(position: CareerPosition, locale: string): LocaleText {
  return position.i18n[locale] ?? position.i18n[FALLBACK_LOCALE] ?? Object.values(position.i18n)[0] ?? { role: "", summary: "" };
}

export function toCareerMetric(position: CareerPosition, locale: string): CareerMetric {
  const text = localized(position, locale);
  const stack = Array.isArray(position.stack) ? position.stack.filter((s): s is string => typeof s === "string") : [];
  return {
    id: position.id,
    company: position.company,
    role: text.role,
    desc: text.summary,
    start: String(position.start ?? ""),
    end: position.end ?? null,
    current: Boolean(position.current),
    kind: position.kind ?? "employment",
    location: position.location,
    stack,
    archType: position.archType ?? inferArchType(text.summary, stack),
  };
}

export function getCareerHistory(locale: string, file: CareerFile = careerFile): CareerMetric[] {
  return sortCareerEvents(file.positions.map((p) => toCareerMetric(p, locale)));
}

export function getHeadline(locale: string, file: CareerFile = careerFile): string {
  return file.person.headline[locale] ?? file.person.headline[FALLBACK_LOCALE] ?? "";
}

/** "IFMT — Bacharelado em Engenharia de Computação (2013–2020)": the main degree, for the page and the PDF. */
export function educationLabel(locale: string, file: CareerFile = careerFile): string {
  const e = file.person.education[0];
  if (!e) return "";
  const pick = (m: Record<string, string>) => m[locale] ?? m.en ?? Object.values(m)[0];
  const joiner = locale === "en" ? " in " : " em ";
  return `${e.shortName} — ${pick(e.degree)}${locale === "es" ? " en " : joiner}${pick(e.area)} (${e.start.slice(0, 4) === e.end.slice(0, 4) ? e.start.slice(0, 4) : `${e.start.slice(0, 4)}–${e.end.slice(0, 4)}`})`;
}
