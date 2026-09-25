// Pure LinkedIn → career.json logic. No network, no filesystem: everything here is unit-tested.
// Runs under Node's built-in type stripping, hence the explicit ".ts" import and erasable-only TypeScript.
import { precision, yearOf } from "../../src/lib/dates.ts";
import { LOCALES } from "../../src/lib/site.ts";
import { catalogueNames } from "../../src/lib/tech.ts";

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
  sync: { source: string; syncedAt: string | null; exportHash?: string };
  positions: CareerPositionJson[];
}

export interface SyncReport {
  status: "updated" | "unchanged" | "skipped";
  reason?: string;
  updated: { id: string; changes: string[] }[];
  added: string[];
  notOnLinkedIn: string[];
  titleDiffs: { id: string; site: string; linkedin: string }[];
  /** New positions seen but not added because of `updatesOnly`. */
  pendingAdditions: string[];
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

// English, Portuguese and Spanish month abbreviations, as LinkedIn writes them in each interface language.
const MONTHS: Record<string, string> = {
  jan: "01", ene: "01", feb: "02", fev: "02", mar: "03", apr: "04", abr: "04", may: "05", mai: "05", jun: "06",
  jul: "07", aug: "08", ago: "08", sep: "09", set: "09", oct: "10", out: "10", nov: "11", dec: "12", dez: "12", dic: "12",
};

/** "Jan 2023" | "2023-01" | "01/2023" | "2023" → "YYYY-MM" or "YYYY"; anything else → null. */
export function parseLinkedInDate(value: unknown): string | null {
  const s = String(value ?? "").trim().toLowerCase();
  if (!s) return null;
  let m = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(/^([a-z]{3})[a-z]*\.?\s+(?:de\s+)?(\d{4})$/);
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

/**
 * Whitelists fields from export CSV rows or API snapshot records; everything else is dropped on the floor.
 * A date that is present but unreadable rejects the record: an unreadable end date must never read as "current".
 */
export function normalizePositionsWithIssues(records: Record<string, unknown>[]): { positions: LinkedInPosition[]; rejected: string[] } {
  const positions: LinkedInPosition[] = [];
  const rejected: string[] = [];
  for (const r of records) {
    const company = pick(r, "Company Name", "companyName", "company");
    const rawStart = pick(r, "Started On", "startedOn", "startDate");
    const rawEnd = pick(r, "Finished On", "finishedOn", "endDate");
    const start = parseLinkedInDate(rawStart);
    const end = parseLinkedInDate(rawEnd);
    if (!company) continue;
    if (!start || (rawEnd && !end)) { rejected.push(`${company} (unreadable date: "${!start ? rawStart : rawEnd}")`); continue; }
    positions.push({ company, title: pick(r, "Title", "title"), description: pick(r, "Description", "description"), location: pick(r, "Location", "location"), start, end });
  }
  return { positions, rejected };
}

export function normalizePositions(records: Record<string, unknown>[]): LinkedInPosition[] {
  return normalizePositionsWithIssues(records).positions;
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

/** Distance between a site position and a LinkedIn record, or null when they cannot be the same job. */
function distance(site: CareerPositionJson, li: LinkedInPosition): number | null {
  const a = new Set(companyTokens(site.company));
  if (!companyTokens(li.company).some((t) => a.has(t))) return null;
  const years = Math.abs(yearOf(site.start) - yearOf(li.start));
  if (years > 1) return null;
  // Same year beats adjacent year; within a year, a matching month (when both have one) wins.
  const monthGap = site.start.length >= 7 && li.start && li.start.length >= 7 ? Math.abs(Number(site.start.slice(5, 7)) - Number(li.start.slice(5, 7))) / 100 : 0.5 / 100;
  return years + monthGap;
}

/** Closest pairs first, so repeated stints at one company never swap dates. Returns site index → incoming index. */
function assign(site: CareerPositionJson[], incoming: LinkedInPosition[]): Map<number, number> {
  const pairs: { i: number; j: number; d: number }[] = [];
  site.forEach((p, i) => incoming.forEach((li, j) => { const d = distance(p, li); if (d !== null) pairs.push({ i, j, d }); }));
  pairs.sort((x, y) => x.d - y.d || x.i - y.i || x.j - y.j);
  const bySite = new Map<number, number>();
  const taken = new Set<number>();
  for (const { i, j } of pairs) if (!bySite.has(i) && !taken.has(j)) { bySite.set(i, j); taken.add(j); }
  return bySite;
}

// ---------------------------------------------------------------------------------------------- merge

function slug(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32);
}

/**
 * Single-word names ("React", "REST", "Git", "Spring") are matched case-sensitively so ordinary prose such as
 * "the rest of the team" or "react quickly" does not invent technologies; multi-word names match in any case.
 */
export function inferStack(text: string): string[] {
  const found: string[] = [];
  for (const name of catalogueNames()) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const flags = /\s/.test(name) ? "i" : "";
    if (new RegExp(`(^|[^A-Za-z0-9])${escaped}(?![A-Za-z0-9#+])`, flags).test(text) && !found.includes(name)) found.push(name);
  }
  // Prefer the most specific term ("Spring Boot" over "Spring", "AWS Lambda" over "AWS").
  return found.filter((f) => !found.some((o) => o !== f && o.startsWith(`${f} `)));
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
  /** Update known positions only; new ones are left for a reviewed pull request (used by the site build). */
  updatesOnly?: boolean;
}

/**
 * LinkedIn is the source of truth for *facts* (dates, current flag, new positions); the site stays the source of
 * truth for *presentation* (curated translated text, stack, architecture). Positions missing from LinkedIn are
 * kept — they may be hidden there on purpose — and only reported.
 */
export function mergeCareer(career: CareerJson, incoming: LinkedInPosition[], opts: MergeOptions): { career: CareerJson; report: SyncReport } {
  const report: SyncReport = { status: "unchanged", updated: [], added: [], notOnLinkedIn: [], titleDiffs: [], pendingAdditions: [] };
  if (incoming.length === 0) {
    return { career, report: { ...report, status: "skipped", reason: "LinkedIn returned no positions (profile deactivated, private or unavailable). Nothing was changed." } };
  }

  const next: CareerJson = structuredClone(career);
  const used = new Set<number>();

  const assignment = assign(next.positions, incoming);
  for (const [siteIndex, position] of next.positions.entries()) {
    const idx = assignment.get(siteIndex) ?? -1;
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
    // Never trade a more precise curated date ("2019-03") for a vaguer LinkedIn one ("2019") of the same year.
    const keepPrecise = (current: string | null, incoming: string | null) =>
      current && incoming && yearOf(current) === yearOf(incoming) && precision(current) > precision(incoming) ? current : incoming;
    if (li.start) set("start", keepPrecise(position.start, li.start) ?? position.start);
    set("end", keepPrecise(position.end, li.end));
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
      report: { ...report, updated: [], titleDiffs: [], status: "skipped", reason: `Only ${matched} of ${next.positions.length} positions matched LinkedIn — the response looks partial, so nothing was changed. Re-run with --force to accept it.` },
    };
  }

  incoming.forEach((li, i) => {
    if (used.has(i)) return;
    if (opts.updatesOnly) { report.pendingAdditions.push(li.company); return; }
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
  if (changed) next.sync = { ...next.sync, source: opts.source, syncedAt: (opts.now ?? new Date()).toISOString() };
  return { career: changed ? next : career, report: { ...report, status: changed ? "updated" : "unchanged" } };
}

/** Columns LinkedIn puts in Positions.csv. The committed file may contain nothing else (enforced by tests). */
export const POSITIONS_COLUMNS = ["Company Name", "Title", "Description", "Location", "Started On", "Finished On"];

export function renderReport(report: SyncReport, heading = "LinkedIn sync"): string {
  const lines = [`## ${heading}: ${report.status}`];
  if (report.reason) lines.push("", `> ${report.reason}`);
  if (report.updated.length) lines.push("", "### Updated", ...report.updated.map((u) => `- **${u.id}**: ${u.changes.join("; ")}`));
  if (report.added.length) lines.push("", "### Added (translations and stack need review — `needsReview: true`)", ...report.added.map((id) => `- ${id}`));
  if (report.titleDiffs.length) lines.push("", "### Title differs from the site (site text kept)", ...report.titleDiffs.map((d) => `- **${d.id}**: site “${d.site}” · LinkedIn “${d.linkedin}”`));
  if (report.pendingAdditions.length) lines.push("", "### New on LinkedIn, waiting for the sync pull request (not published by the build)", ...report.pendingAdditions.map((c) => `- ${c}`));
  if (report.notOnLinkedIn.length) lines.push("", "### On the site but not on LinkedIn (kept)", ...report.notOnLinkedIn.map((id) => `- ${id}`));
  return `${lines.join("\n")}\n`;
}
