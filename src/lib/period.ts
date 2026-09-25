// Month/year presentation for career dates. Days are intentionally never stored or shown.
// Month names come from fixed tables rather than Intl.DateTimeFormat: the page is rendered by Node at build time
// and re-rendered by the browser, and ICU data differs between them ("fev. de 2025" vs "fev de 2025"), which would
// break hydration. Dependency-free so the LinkedIn sync script can import it under Node type stripping.

const MONTHS: Record<string, string[]> = {
  "pt-br": ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  es: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
};

const PRESENT: Record<string, string> = { "pt-br": "atual", en: "present", es: "actual" };

export interface PeriodInput {
  /** "YYYY" or "YYYY-MM". */
  start: string;
  /** "YYYY" or "YYYY-MM"; null when unknown or current. */
  end: string | null;
  current: boolean;
}

export function hasMonth(date: string | null | undefined): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(String(date ?? ""));
}

/** "2025-02" → "fev. 2025" / "Feb 2025" / "feb 2025"; "2025" → "2025". */
export function formatMonthYear(date: string, locale: string): string {
  if (!hasMonth(date)) return date.slice(0, 4);
  const months = MONTHS[locale] ?? MONTHS.en;
  return `${months[Number(date.slice(5, 7)) - 1]} ${date.slice(0, 4)}`;
}

/** Whole months from start to end, counting both months (LinkedIn convention: Feb–Mar is 2 months). */
export function monthsBetween(start: string, end: string): number | null {
  if (!hasMonth(start) || !hasMonth(end)) return null;
  const index = (d: string) => Number(d.slice(0, 4)) * 12 + Number(d.slice(5, 7)) - 1;
  const months = index(end) - index(start) + 1;
  return months > 0 ? months : null;
}

/** "YYYY-MM" of a date in UTC, so the server build and every visitor agree. */
export function toMonth(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function formatDuration(months: number, locale: string): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts: string[] = [];
  if (locale === "en") {
    if (y) parts.push(`${y} yr${y > 1 ? "s" : ""}`);
    if (m) parts.push(`${m} mo${m > 1 ? "s" : ""}`);
    return parts.join(" ");
  }
  const [year, years, month, months_, and] = locale === "es" ? ["año", "años", "mes", "meses", "y"] : ["ano", "anos", "mês", "meses", "e"];
  if (y) parts.push(`${y} ${y > 1 ? years : year}`);
  if (m) parts.push(`${m} ${m > 1 ? months_ : month}`);
  return parts.join(` ${and} `);
}

export interface PeriodParts {
  start: { iso: string; label: string };
  end: { iso: string; label: string } | null;
  presentLabel: string | null;
  /** Only when both ends are month-precise (a current role ends at `asOf`). */
  duration: string | null;
}

export function periodParts(event: PeriodInput, locale: string, asOf: Date): PeriodParts {
  const start = { iso: event.start, label: formatMonthYear(event.start, locale) };
  const endIso = event.current ? null : event.end && event.end !== event.start ? event.end : null;
  const end = endIso ? { iso: endIso, label: formatMonthYear(endIso, locale) } : null;
  const months = monthsBetween(event.start, event.current ? toMonth(asOf) : event.end ?? "");
  return {
    start,
    end,
    presentLabel: event.current ? PRESENT[locale] ?? PRESENT.en : null,
    duration: months ? formatDuration(months, locale) : null,
  };
}

/** "fev. 2025 – atual · 1 ano e 8 meses", "mar. 2023 – dez. 2024 · 1 ano e 10 meses", or "2019" when only the year is known. */
export function formatPeriod(event: PeriodInput, locale: string, asOf: Date, { withDuration = true } = {}): string {
  const p = periodParts(event, locale, asOf);
  const range = p.presentLabel ? `${p.start.label} – ${p.presentLabel}` : p.end ? `${p.start.label} – ${p.end.label}` : p.start.label;
  return withDuration && p.duration ? `${range} · ${p.duration}` : range;
}
