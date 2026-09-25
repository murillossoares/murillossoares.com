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
    name: string;
    alias: string;
    location: { city: string; country: string };
    links: Record<string, string>;
    headline: Record<string, string>;
    tagline: string;
  };
  sync: { source: string; syncedAt: string | null };
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

/** "2019 — 2021", "2025 — present", or just "2019" when the end is unknown. */
export function formatPeriod(event: Pick<CareerMetric, "start" | "end" | "current">, presentLabel: string): string {
  const fmt = (d: string) => (d.length >= 7 ? `${d.slice(5, 7)}/${d.slice(0, 4)}` : d.slice(0, 4));
  if (event.current) return `${fmt(event.start)} — ${presentLabel}`;
  if (event.end && event.end !== event.start) return `${fmt(event.start)} — ${fmt(event.end)}`;
  return fmt(event.start);
}
