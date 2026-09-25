// Pure LinkedIn → career.json logic. No network, no filesystem: everything here is unit-tested.
// Runs under Node's built-in type stripping, hence the explicit ".ts" import and erasable-only TypeScript.
import { catalogueTerms, resolveTech } from "../../src/lib/tech.ts";

const LOCALES = ["pt-br", "en", "es"];

/** The only LinkedIn fields that ever reach the (public) repository. */
export interface LinkedInPosition {
  company: string;
  title: string;
  description: string;
  location: string;
  start: string | null;
  end: string | null;
}

export interface CareerPositionJson {
  id: string;
  company: string;
  start: string;
  end: string | null;
  current: boolean;
  kind: string;
  location?: string;
  archType?: string;
  stack: string[];
  i18n: Record<string, { role: string; summary: string }>;
  linkedin?: { company: string; title: string };
  needsReview?: boolean;
  [key: string]: unknown;
}

export interface CareerJson {
  person: Record<string, unknown>;
  sync: { source: string; syncedAt: string | null };
  positions: CareerPositionJson[];
}

export interface SyncReport {
  status: "updated" | "unchanged" | "skipped";
  reason?: string;
  updated: { id: string; changes: string[] }[];
  added: string[];
  notOnLinkedIn: string[];
  titleDiffs: { id: string; site: string; linkedin: string }[];
}

// ---------------------------------------------------------------------------------------------- parsing

/** RFC 4180 CSV (quoted fields, escaped quotes, embedded newlines) → array of records keyed by header. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((c) => c !== "")) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((c) => c !== "")) rows.push(row);
  const [header, ...body] = rows;
  if (!header) return [];
  return body.map((cells) => Object.fromEntries(header.map((h, i) => [h.trim(), (cells[i] ?? "").trim()])));
}

const MONTHS: Record<string, string> = {
  jan: "01", feb: "02", fev: "02", mar: "03", apr: "04", abr: "04", may: "05", mai: "05", jun: "06", jul: "07",
  aug: "08", ago: "08", sep: "09", set: "09", oct: "10", out: "10", nov: "11", dec: "12", dez: "12",
};

/** "Jan 2023" | "2023-01" | "01/2023" | "2023" → "YYYY-MM" or "YYYY"; anything else → null. */
export function parseLinkedInDate(value: unknown): string | null {
  const s = String(value ?? "").trim().toLowerCase();
  if (!s) return null;
  let m = s.match(/^([a-zç]{3})[a-zç]*\.?\s+(\d{4})$/);
  if (m && MONTHS[m[1]]) return `${m[2]}-${MONTHS[m[1]]}`;
  m = s.match(/^(\d{4})-(\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}`;
  m = s.match(/^(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[2]}-${m[1].padStart(2, "0")}`;
  m = s.match(/^(\d{4})$/);
  return m ? m[1] : null;
}

function pick(record: Record<string, unknown>, ...keys: string[]): string {
  const lower = new Map(Object.entries(record).map(([k, v]) => [k.toLowerCase().replace(/[\s_]/g, ""), v]));
  for (const key of keys) {
    const v = lower.get(key.toLowerCase().replace(/[\s_]/g, ""));
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

/** Whitelists fields from export CSV rows or API snapshot records. Everything else is dropped on the floor. */
export function normalizePositions(records: Record<string, unknown>[]): LinkedInPosition[] {
  return records
    .map((r) => ({
      company: pick(r, "Company Name", "companyName", "company"),
      title: pick(r, "Title", "title"),
      description: pick(r, "Description", "description"),
      location: pick(r, "Location", "location"),
      start: parseLinkedInDate(pick(r, "Started On", "startedOn", "startDate")),
      end: parseLinkedInDate(pick(r, "Finished On", "finishedOn", "endDate")),
    }))
    .filter((p) => p.company && p.start);
}

// ---------------------------------------------------------------------------------------------- matching

const STOPWORDS = new Set(["ltda", "lda", "sa", "s/a", "inc", "llc", "ltd", "the", "de", "da", "do", "e", "and", "group", "grupo", "software", "sistemas", "informatica", "tecnologia", "consultoria", "gestao", "participacoes", "mobile"]);

export function companyTokens(name: string): string[] {
  return name
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

const yearOf = (d: string | null | undefined) => Number(String(d ?? "").slice(0, 4)) || 0;

function matches(site: CareerPositionJson, li: LinkedInPosition): boolean {
  const a = new Set(companyTokens(site.company));
  const shared = companyTokens(li.company).some((t) => a.has(t));
  return shared && Math.abs(yearOf(site.start) - yearOf(li.start)) <= 1;
}

// ---------------------------------------------------------------------------------------------- merge

function slug(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32);
}

export function inferStack(text: string): string[] {
  const found: string[] = [];
  const hay = ` ${text.toLowerCase()} `;
  for (const term of catalogueTerms()) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9#]|$)`).test(hay)) {
      const label = resolveTech(term)[0]?.canonical ?? term;
      if (!found.some((f) => f.toLowerCase() === label.toLowerCase())) found.push(label);
    }
  }
  // Prefer the most specific term ("Spring Boot" over "Spring").
  return found.filter((f) => !found.some((o) => o !== f && o.toLowerCase().startsWith(`${f.toLowerCase()} `)));
}

function firstSentence(text: string, max = 220): string {
  const clean = text.replace(/\s+/g, " ").trim();
  const cut = clean.match(/^(.{20,}?[.!?])\s/)?.[1] ?? clean;
  return cut.length > max ? `${cut.slice(0, max - 1).trimEnd()}…` : cut;
}

export interface MergeOptions {
  now?: Date;
  /** Refuse results that look partial: fewer than this share of the site's positions matched. */
  minMatchRatio?: number;
  source: string;
}

/**
 * LinkedIn is the source of truth for *facts* (dates, current flag, new positions); the site stays the source of
 * truth for *presentation* (curated translated text, stack, architecture). Positions missing from LinkedIn are
 * kept — they may be hidden there on purpose — and only reported.
 */
export function mergeCareer(career: CareerJson, incoming: LinkedInPosition[], opts: MergeOptions): { career: CareerJson; report: SyncReport } {
  const report: SyncReport = { status: "unchanged", updated: [], added: [], notOnLinkedIn: [], titleDiffs: [] };
  if (incoming.length === 0) {
    return { career, report: { ...report, status: "skipped", reason: "LinkedIn returned no positions (profile deactivated, private or unavailable). Nothing was changed." } };
  }

  const next: CareerJson = structuredClone(career);
  const used = new Set<number>();

  for (const position of next.positions) {
    const idx = incoming.findIndex((li, i) => !used.has(i) && matches(position, li));
    if (idx === -1) { report.notOnLinkedIn.push(position.id); continue; }
    used.add(idx);
    const li = incoming[idx];
    const changes: string[] = [];
    const set = <K extends keyof CareerPositionJson>(key: K, value: CareerPositionJson[K]) => {
      if (JSON.stringify(position[key] ?? null) !== JSON.stringify(value ?? null)) {
        changes.push(`${String(key)}: ${JSON.stringify(position[key] ?? null)} → ${JSON.stringify(value ?? null)}`);
        position[key] = value;
      }
    };
    if (li.start) set("start", li.start);
    set("end", li.end);
    set("current", !li.end);
    if (li.location) set("location", li.location);
    set("linkedin", { company: li.company, title: li.title });
    if (changes.length) report.updated.push({ id: position.id, changes });
    const siteRole = position.i18n["pt-br"]?.role ?? position.i18n.en?.role ?? "";
    if (li.title && siteRole && companyTokens(li.title).join(" ") !== companyTokens(siteRole).join(" ")) {
      report.titleDiffs.push({ id: position.id, site: siteRole, linkedin: li.title });
    }
  }

  const matched = next.positions.length - report.notOnLinkedIn.length;
  const ratio = next.positions.length ? matched / next.positions.length : 1;
  if (next.positions.length >= 4 && ratio < (opts.minMatchRatio ?? 0.5)) {
    return {
      career,
      report: { ...report, status: "skipped", reason: `Only ${matched} of ${next.positions.length} positions matched LinkedIn — the response looks partial, so nothing was changed. Re-run with --force to accept it.` },
    };
  }

  incoming.forEach((li, i) => {
    if (used.has(i)) return;
    const base = `${slug(li.company)}-${yearOf(li.start)}`;
    let id = base;
    for (let n = 2; next.positions.some((p) => p.id === id); n++) id = `${base}-${n}`;
    const summary = firstSentence(li.description) || li.title;
    next.positions.push({
      id,
      company: li.company,
      start: li.start!,
      end: li.end,
      current: !li.end,
      kind: /estagi|intern|trainee|pasant/i.test(li.title) ? "internship" : "employment",
      ...(li.location ? { location: li.location } : {}),
      stack: inferStack(`${li.title} ${li.description}`),
      i18n: Object.fromEntries(LOCALES.map((l) => [l, { role: li.title, summary }])),
      linkedin: { company: li.company, title: li.title },
      needsReview: true,
    });
    report.added.push(id);
  });

  const changed = report.updated.length > 0 || report.added.length > 0;
  if (changed) next.sync = { source: opts.source, syncedAt: (opts.now ?? new Date()).toISOString() };
  return { career: changed ? next : career, report: { ...report, status: changed ? "updated" : "unchanged" } };
}

export function renderReport(report: SyncReport): string {
  const lines = [`## LinkedIn sync: ${report.status}`];
  if (report.reason) lines.push("", `> ${report.reason}`);
  if (report.updated.length) lines.push("", "### Updated", ...report.updated.map((u) => `- **${u.id}**: ${u.changes.join("; ")}`));
  if (report.added.length) lines.push("", "### Added (translations and stack need review — `needsReview: true`)", ...report.added.map((id) => `- ${id}`));
  if (report.titleDiffs.length) lines.push("", "### Title differs from the site (site text kept)", ...report.titleDiffs.map((d) => `- **${d.id}**: site “${d.site}” · LinkedIn “${d.linkedin}”`));
  if (report.notOnLinkedIn.length) lines.push("", "### On the site but not on LinkedIn (kept)", ...report.notOnLinkedIn.map((id) => `- ${id}`));
  return `${lines.join("\n")}\n`;
}
