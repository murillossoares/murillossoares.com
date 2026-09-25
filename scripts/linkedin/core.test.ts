import { describe, expect, it } from "vitest";

import { inferStack, mergeCareer, normalizePositions, normalizePositionsWithIssues, renderReport, parseCsv, parseLinkedInDate, type CareerJson, type CareerPositionJson, type LinkedInPosition } from "./core.ts";

// A fixed fixture, not src/data/career.json: the sync workflow runs these tests right after rewriting that file.
const position = (id: string, company: string, start: string, extra: Partial<CareerPositionJson> = {}): CareerPositionJson => ({
  id, company, start, end: null, current: false, kind: "employment", archType: "soa", stack: ["Java 8"],
  i18n: { "pt-br": { role: `Dev ${id}`, summary: "Texto curado." }, en: { role: `Dev ${id}`, summary: "Curated text." }, es: { role: `Dev ${id}`, summary: "Texto curado." } },
  ...extra,
});
const site: CareerJson = {
  person: { name: "Test" },
  sync: { source: "manual", syncedAt: null },
  positions: [
    position("iefp", "Conkord | IEFP", "2025", { current: true }),
    position("ytech", "YTech | CGI", "2023"),
    position("accurate", "Accurate Software", "2022"),
    position("nbs", "NBS Informática", "2020"),
    position("ufmt", "UFMT", "2017", { kind: "internship" }),
  ],
};
const now = new Date("2026-09-01T00:00:00Z");
const li = (company: string, start: string, end: string | null, title = "Engineer", description = ""): LinkedInPosition =>
  ({ company, title, description, location: "", start, end });

// A LinkedIn mirror of the current site data, with real month precision.
const mirror = (): LinkedInPosition[] => site.positions.map((p) => li(p.company.split("|")[0].trim(), `${p.start}-03`, p.current ? null : `${p.start}-11`, p.i18n["pt-br"].role));

describe("LinkedIn parsing", () => {
  it("parses the export CSV, including quoted multi-line descriptions", () => {
    const csv = 'Company Name,Title,Description,Location,Started On,Finished On\n"Conkord","Full Stack Senior","Line one,\nline ""two""","Lisbon","Jan 2025",\n';
    expect(parseCsv(csv)).toEqual([{ "Company Name": "Conkord", Title: "Full Stack Senior", Description: 'Line one,\nline "two"', Location: "Lisbon", "Started On": "Jan 2025", "Finished On": "" }]);
  });

  it("normalises dates from export and API formats", () => {
    expect(parseLinkedInDate("Jan 2023")).toBe("2023-01");
    expect(parseLinkedInDate("Set 2021")).toBe("2021-09");
    expect(parseLinkedInDate("2019-7-01")).toBe("2019-07");
    expect(parseLinkedInDate("2018")).toBe("2018");
    expect(parseLinkedInDate("")).toBeNull();
  });

  it("reads Spanish and Portuguese month names, with or without 'de'", () => {
    expect(parseLinkedInDate("dic 2022")).toBe("2022-12");
    expect(parseLinkedInDate("ene. de 2020")).toBe("2020-01");
    expect(parseLinkedInDate("dez. de 2021")).toBe("2021-12");
    expect(parseLinkedInDate("março de 2019")).toBe("2019-03");
  });

  it("rejects a record whose end date is present but unreadable instead of marking it current", () => {
    const { positions, rejected } = normalizePositionsWithIssues([
      { "Company Name": "Old Job", "Started On": "Jan 2020", "Finished On": "??? 2022" },
      { "Company Name": "Now", "Started On": "Jan 2024", "Finished On": "" },
    ]);
    expect(positions.map((p) => p.company)).toEqual(["Now"]);
    expect(rejected[0]).toMatch(/Old Job/);
  });

  it("keeps only whitelisted fields", () => {
    const [p] = normalizePositions([{ "Company Name": "X", Title: "Dev", "Started On": "2020", Email: "secret@example.com", Salary: "1" }]);
    expect(Object.keys(p).sort()).toEqual(["company", "description", "end", "location", "start", "title"]);
    expect(JSON.stringify(p)).not.toContain("secret");
  });

  it("infers a stack from free text using the catalogue", () => {
    expect(inferStack("Built Spring Boot services on Kubernetes with PostgreSQL and React")).toEqual(expect.arrayContaining(["Spring Boot", "Kubernetes", "PostgreSQL", "React"]));
    expect(inferStack("Built Spring Boot services")).not.toContain("Spring");
  });

  it("does not turn ordinary words into technologies", () => {
    expect(inferStack("Worked with the rest of the team to react quickly, in spring.")).toEqual([]);
    expect(inferStack("Exposed REST APIs consumed by a React app")).toEqual(expect.arrayContaining(["REST", "React"]));
  });
});

describe("mergeCareer — never breaks the site", () => {
  it("skips and changes nothing when LinkedIn returns no positions (profile deactivated)", () => {
    const { career: out, report } = mergeCareer(site, [], { source: "linkedin-api", now });
    expect(report.status).toBe("skipped");
    expect(out).toBe(site);
  });

  it("refuses a partial response instead of trusting it", () => {
    const { career: out, report } = mergeCareer(site, mirror().slice(0, 2), { source: "linkedin-api", now });
    expect(report.status).toBe("skipped");
    expect(report.reason).toMatch(/partial/);
    expect(out).toBe(site);
  });

  it("is idempotent: a second sync with the same data changes nothing", () => {
    const first = mergeCareer(site, mirror(), { source: "linkedin-api", now });
    expect(first.report.status).toBe("updated");
    const second = mergeCareer(first.career, mirror(), { source: "linkedin-api", now: new Date("2026-10-01") });
    expect(second.report.status).toBe("unchanged");
    expect(second.career).toBe(first.career);
  });

  it("updates facts but keeps curated text, stack and architecture", () => {
    const { career: out } = mergeCareer(site, mirror(), { source: "linkedin-api", now });
    const before = site.positions.find((p) => p.id === "ytech")!;
    const after = out.positions.find((p) => p.id === "ytech")!;
    expect(after.start).toBe("2023-03");
    expect(after.end).toBe("2023-11");
    expect(after.i18n).toEqual(before.i18n);
    expect(after.stack).toEqual(before.stack);
    expect(after.archType).toBe(before.archType);
    expect(out.sync).toEqual({ source: "linkedin-api", syncedAt: now.toISOString() });
  });

  it("does not list changes in the report when a partial response is refused", () => {
    const { report } = mergeCareer(site, mirror().slice(0, 2), { source: "linkedin-api", now });
    expect(report.updated).toEqual([]);
    expect(renderReport(report)).not.toContain("### Updated");
  });

  it("pairs repeated stints at the same company by closest start, not list order", () => {
    const stints: CareerJson = { ...site, positions: [...site.positions, position("cgi-2024", "CGI", "2024", { stack: [] })].map((p) => (p.id === "ytech" ? { ...p, company: "CGI" } : p)) };
    const incoming = [...mirror().filter((p) => !p.company.startsWith("YTech")), li("CGI", "2024-06", null), li("CGI", "2023-02", "2024-05")];
    const { career: out } = mergeCareer(stints, incoming, { source: "linkedin-api", now });
    expect(out.positions.find((p) => p.id === "ytech")).toMatchObject({ start: "2023-02", end: "2024-05", current: false });
    expect(out.positions.find((p) => p.id === "cgi-2024")).toMatchObject({ start: "2024-06", current: true });
  });

  it("in updates-only mode (site build) reports new positions instead of publishing them", () => {
    const { career: out, report } = mergeCareer(site, [...mirror(), li("Acme", "2026-01", null)], { source: "linkedin-repo", now, updatesOnly: true });
    expect(out.positions.some((p) => p.company === "Acme")).toBe(false);
    expect(report.pendingAdditions).toEqual(["Acme"]);
  });

  it("never downgrades a precise curated date to a vaguer LinkedIn one", () => {
    const precise: CareerJson = { ...site, positions: site.positions.map((p) => (p.id === "nbs" ? { ...p, start: "2020-01", end: "2020-07" } : p)) };
    const incoming = mirror().map((p) => (p.company.startsWith("NBS") ? { ...p, start: "2020", end: "2020" } : p));
    const { career: out } = mergeCareer(precise, incoming, { source: "linkedin-api", now });
    expect(out.positions.find((p) => p.id === "nbs")).toMatchObject({ start: "2020-01", end: "2020-07" });
  });

  it("adds new LinkedIn positions flagged for review and keeps ones missing from LinkedIn", () => {
    const incoming = [...mirror().filter((p) => !p.company.startsWith("UFMT")), li("Acme Cloud", "2026-05", null, "Staff Engineer", "Leading Java 21 and Kafka platform work. More text.")];
    const { career: out, report } = mergeCareer(site, incoming, { source: "linkedin-api", now });
    const added = out.positions.find((p) => p.id === "acme-cloud-2026")!;
    expect(added).toMatchObject({ current: true, needsReview: true, stack: expect.arrayContaining(["Java", "Kafka"]) });
    expect(added.i18n.en.summary).toBe("Leading Java 21 and Kafka platform work.");
    expect(report.notOnLinkedIn).toEqual(["ufmt"]);
    expect(out.positions.some((p) => p.id === "ufmt")).toBe(true);
  });
});
