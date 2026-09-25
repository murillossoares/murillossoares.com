import { describe, expect, it } from "vitest";

import { isoDate, jsonResume, llmsFullTxt, llmsTxt, personJsonLd } from "./agent-content";
import { careerFile } from "@/services/careerData";

const now = new Date("2026-09-01");

describe("machine-readable content", () => {
  it("publishes a ProfilePage/Person JSON-LD with every position", () => {
    const ld = personJsonLd("en", careerFile, now);
    expect(ld["@type"]).toBe("ProfilePage");
    expect(ld.mainEntity).toMatchObject({ "@type": "Person", name: "Murillo Soares", sameAs: expect.arrayContaining(["https://www.linkedin.com/in/murillossoares/"]) });
    const roles = ld.mainEntity.worksFor;
    expect(roles).toHaveLength(careerFile.positions.length);
    // Role pattern: worksFor repeats inside each OrganizationRole; past roles end, the current one does not.
    expect(roles.every((r) => r["@type"] === "OrganizationRole" && r.worksFor["@type"] === "Organization")).toBe(true);
    const current = careerFile.positions.filter((p) => p.current).length;
    expect(roles.filter((r) => r.endDate === undefined).length).toBeGreaterThanOrEqual(current);
    expect(JSON.stringify(ld)).not.toMatch(/hasOccupation|alumniOf/);
  });

  it("follows the llms.txt shape: H1, blockquote summary, link sections", () => {
    const txt = llmsTxt(careerFile, now);
    expect(txt).toMatch(/^# Murillo Soares\n\n> .+\n/);
    expect(txt).toContain("/llms-full.txt");
    expect(txt).toContain("/mcp");
  });

  it("includes every company in the full text and the JSON Resume", () => {
    const full = llmsFullTxt(careerFile, now);
    const resume = jsonResume("en", careerFile, now);
    for (const p of careerFile.positions) {
      expect(full).toContain(p.company);
      expect(resume.work.some((w) => w.name === p.company)).toBe(true);
    }
  });

  it("never leaks sync internals or anything that looks like a credential", () => {
    const blob = JSON.stringify([jsonResume("en", careerFile, now), personJsonLd("pt-br", careerFile, now)]) + llmsFullTxt(careerFile, now);
    expect(blob).not.toMatch(/Bearer\s+[A-Za-z0-9._-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|AQ[A-Za-z0-9_-]{40,}|[\w.+-]+@[\w-]+\.[a-z]{2,}/);
  });
});

describe("isoDate", () => {
  it("emits only YYYY-MM or YYYY, never a day or an invalid month", () => {
    expect(isoDate("2019-03")).toBe("2019-03");
    expect(isoDate("2019")).toBe("2019");
    expect(isoDate("2019-13")).toBe("2019");
    expect(isoDate("2019-3")).toBe("2019");
    expect(isoDate("2019-03-15")).toBe("2019");
    expect(isoDate(null)).toBeUndefined();
    expect(isoDate("present")).toBeUndefined();
  });
});
