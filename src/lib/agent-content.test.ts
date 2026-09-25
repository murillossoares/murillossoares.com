import { describe, expect, it } from "vitest";

import { isoDate, jsonResume, llmsFullTxt, llmsTxt, personJsonLd } from "./agent-content";
import { careerFile } from "@/services/careerData";

const now = new Date("2026-09-01");

describe("machine-readable content", () => {
  it("publishes a ProfilePage/Person JSON-LD with every position", () => {
    const ld = personJsonLd("en", careerFile, now);
    expect(ld["@type"]).toBe("ProfilePage");
    expect(ld.mainEntity).toMatchObject({ "@type": "Person", name: "Murillo Soares", sameAs: expect.arrayContaining(["https://www.linkedin.com/in/murillossoares/"]) });
    const roles = [...ld.mainEntity.worksFor, ...ld.mainEntity.alumniOf];
    expect(roles).toHaveLength(careerFile.positions.length);
    // Role pattern: the wrapped property repeats inside each OrganizationRole, never a bare worksFor on a Role.
    expect(ld.mainEntity.worksFor.every((r) => r["@type"] === "OrganizationRole" && "worksFor" in r)).toBe(true);
    expect(ld.mainEntity.alumniOf.every((r) => r["@type"] === "OrganizationRole" && "alumniOf" in r && !("worksFor" in r))).toBe(true);
    expect(JSON.stringify(ld)).not.toContain("hasOccupation");
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
