import { describe, expect, it } from "vitest";

import career from "../../src/data/career.json";
import { inferStack, mergeCareer, normalizePositions, parseCsv, parseLinkedInDate, type CareerJson, type LinkedInPosition } from "./core.ts";

const site = career as unknown as CareerJson;
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

  it("keeps only whitelisted fields", () => {
    const [p] = normalizePositions([{ "Company Name": "X", Title: "Dev", "Started On": "2020", Email: "secret@example.com", Salary: "1" }]);
    expect(Object.keys(p).sort()).toEqual(["company", "description", "end", "location", "start", "title"]);
    expect(JSON.stringify(p)).not.toContain("secret");
  });

  it("infers a stack from free text using the catalogue", () => {
    expect(inferStack("Built Spring Boot services on Kubernetes with PostgreSQL and React")).toEqual(expect.arrayContaining(["Spring Boot", "Kubernetes", "PostgreSQL", "React"]));
    expect(inferStack("Built Spring Boot services")).not.toContain("Spring");
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
