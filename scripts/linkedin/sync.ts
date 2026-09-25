// LinkedIn → src/data/career.json
//
//   npm run linkedin:sync                       (CI; needs LINKEDIN_ACCESS_TOKEN)
//   npm run linkedin:import -- <export.zip | export folder | Positions.csv>
//
// Contract: this script never breaks the site. The site is built from the committed career.json, and any LinkedIn
// problem (profile temporarily deactivated, expired token, API down, partial data) ends in a warning, exit code 0
// and an untouched file — unless --strict is passed. The access token is only ever sent as a request header.
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { mergeCareer, normalizePositions, parseCsv, renderReport, type CareerJson, type LinkedInPosition, type SyncReport } from "./core.ts";

const CAREER_PATH = new URL("../../src/data/career.json", import.meta.url);
const API = "https://api.linkedin.com/rest/memberSnapshotData";

class Unavailable extends Error {}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}
const flag = (name: string) => process.argv.includes(`--${name}`);

/** Candidate API versions (YYYYMM): the configured one, then the last 12 months, newest first. */
function versions(now = new Date()): string[] {
  const out: string[] = [];
  const configured = process.env.LINKEDIN_API_VERSION?.trim();
  if (configured && /^\d{6}$/.test(configured)) out.push(configured);
  for (let back = 1; back <= 12; back++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1));
    const v = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    if (!out.includes(v)) out.push(v);
  }
  return out;
}

async function request(url: string, token: string, version: string): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, "Linkedin-Version": version, "X-Restli-Protocol-Version": "2.0.0" },
        signal: AbortSignal.timeout(20_000),
      });
      if (res.status !== 429 && res.status < 500) return res;
      lastError = new Unavailable(`LinkedIn answered HTTP ${res.status}`);
    } catch (error) {
      lastError = new Unavailable(`network error: ${(error as Error).name}`);
    }
    if (attempt < 2) await new Promise((r) => setTimeout(r, 2000 * 2 ** attempt));
  }
  throw lastError;
}

async function describe(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string; serviceErrorCode?: number };
    return `HTTP ${res.status}${body.message ? ` — ${body.message}` : ""}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

async function fromApi(): Promise<Record<string, unknown>[]> {
  const token = process.env.LINKEDIN_ACCESS_TOKEN?.trim();
  if (!token) throw new Unavailable("LINKEDIN_ACCESS_TOKEN is not configured");

  for (const version of versions()) {
    const records: Record<string, unknown>[] = [];
    let url: string | null = `${API}?q=criteria&domain=POSITIONS`;
    let versionRejected = false;
    for (let page = 0; url && page < 20; page++) {
      const res = await request(url, token, version);
      if (res.status === 426 || res.status === 400) {
        const detail = await describe(res);
        if (/version/i.test(detail) || res.status === 426) { versionRejected = true; break; }
        throw new Unavailable(detail);
      }
      if (res.status === 401) throw new Unavailable(`${await describe(res)}. The token is missing, expired (they last 60 days) or revoked — generate a new one.`);
      if (res.status === 403) throw new Unavailable(`${await describe(res)}. The app lacks the Member Data Portability product/scope, or the profile is deactivated.`);
      if (res.status === 404) return [];
      if (!res.ok) throw new Unavailable(await describe(res));
      const body = (await res.json().catch(() => {
        throw new Unavailable(`LinkedIn answered HTTP ${res.status} with a body that is not JSON`);
      })) as {
        elements?: { snapshotDomain?: string; snapshotData?: Record<string, unknown>[] }[];
        paging?: { links?: { rel?: string; href?: string }[] };
      };
      for (const el of body.elements ?? []) {
        if (!el.snapshotDomain || el.snapshotDomain === "POSITIONS") records.push(...(el.snapshotData ?? []));
      }
      const next = body.paging?.links?.find((l) => l.rel === "next")?.href;
      url = next ? new URL(next, "https://api.linkedin.com").toString() : null;
    }
    if (!versionRejected) {
      console.log(`LinkedIn API version ${version}: ${records.length} position record(s).`);
      return records;
    }
  }
  throw new Unavailable("no supported Linkedin-Version found in the last 12 months; set LINKEDIN_API_VERSION");
}

/** Reads ONLY Positions.csv. The export ZIP also holds messages, contacts and e-mails — never extract or commit it. */
function fromExport(path: string | undefined): Record<string, unknown>[] {
  if (!path || !existsSync(path)) throw new Error(`--path must point to the LinkedIn export ZIP, its folder, or Positions.csv (got ${path ?? "nothing"})`);
  let csv: string;
  if (statSync(path).isDirectory()) csv = readFileSync(join(path, "Positions.csv"), "utf8");
  else if (path.toLowerCase().endsWith(".zip")) csv = execFileSync("unzip", ["-p", path, "Positions.csv"], { encoding: "utf8", maxBuffer: 5 * 1024 * 1024 });
  else csv = readFileSync(path, "utf8");
  return parseCsv(csv);
}

function summary(markdown: string) {
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
  const reportPath = arg("report");
  if (reportPath) writeFileSync(reportPath, markdown);
}

function output(key: string, value: string) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
}

async function main() {
  const source = arg("source") ?? "api";
  const career = JSON.parse(readFileSync(CAREER_PATH, "utf8")) as CareerJson;
  let report: SyncReport;

  try {
    const raw = source === "export" ? fromExport(arg("path")) : await fromApi();
    const positions: LinkedInPosition[] = normalizePositions(raw);
    const result = mergeCareer(career, positions, { source: `linkedin-${source}`, minMatchRatio: flag("force") ? 0 : 0.5 });
    report = result.report;
    if (report.status === "updated" && !flag("dry-run")) writeFileSync(CAREER_PATH, `${JSON.stringify(result.career, null, 2)}\n`);
  } catch (error) {
    // Local export imports fail loudly (bad path is a user error). Anything that goes wrong while talking to the
    // API — expected or not — must not fail the scheduled job: the site keeps the last committed data.
    if (flag("strict") || (source === "export" && !(error instanceof Unavailable))) throw error;
    const detail = error instanceof Unavailable ? error.message : `unexpected ${(error as Error).name}`;
    report = { status: "skipped", reason: `LinkedIn unavailable: ${detail.replace(/\.$/, "")}. The site keeps the last synced data.`, updated: [], added: [], notOnLinkedIn: [], titleDiffs: [] };
  }

  const markdown = renderReport(report);
  console.log(markdown);
  summary(markdown);
  output("changed", String(report.status === "updated" && !flag("dry-run")));
  if (report.status === "skipped") console.log(`::warning title=LinkedIn sync skipped::${report.reason}`);
}

main().catch((error) => {
  // Only reached for local misuse (bad --path) or --strict; message never includes the token.
  console.error(`LinkedIn sync failed: ${(error as Error).message}`);
  process.exit(1);
});
