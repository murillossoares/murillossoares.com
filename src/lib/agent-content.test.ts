import { describe, expect, it } from "vitest";

import { isoDate, jsonResume, llmsFullTxt, llmsTxt, personJsonLd } from "./agent-content";
import { careerFile } from "@/services/careerData";

const now = new Date("2026-09-01");

describe("machine-readable content", () => {
  it("publishes a ProfilePage/Person JSON-LD with every position", () => {
    const ld = personJsonLd("en", careerFile, now);
    expect(ld["@type"]).toBe("ProfilePage");
    expect(ld.mainEntity).toMatchObject({ "@type": "Person", name: "Murillo Soares", sameAs: expect.arrayContaining(["https://www.linkedin.com/in/murillossoares/"]) });
    const employed = ld.mainEntity.worksFor;
    const former = ld.mainEntity.alumniOf.filter((a) => a["@type"] === "OrganizationRole");
    expect(employed.length + former.length).toBe(careerFile.positions.length);
    // Nothing past may read as current: every worksFor role is current or has an endDate...
    for (const r of employed) {
      const p = careerFile.positions.find((x) => x.i18n.en.role === r.roleName && x.company === r.worksFor.name)!;
      expect(p.current || typeof r.endDate === "string", r.worksFor.name).toBe(true);
    }
    // ...and past roles without a recorded end are former memberships with no dates at all.
    for (const r of former) expect(r).not.toHaveProperty("startDate");
    expect(JSON.stringify(ld)).not.toContain("hasOccupation");
  });

  it("ties every name people search for to one person, with education", () => {
    const person = personJsonLd("pt-br", careerFile, now).mainEntity;
    expect(person.name).toBe("Murillo Soares");
    expect(person.alternateName).toEqual(expect.arrayContaining(["Murillo Henrique Silva Soares", "Murillo Henrique"]));
    expect(person).toMatchObject({ givenName: "Murillo", additionalName: "Henrique", familyName: "Silva Soares" });
    const schools = person.alumniOf.filter((a) => a["@type"] === "CollegeOrUniversity");
    expect(schools).toEqual([expect.objectContaining({ alternateName: "IFMT" })]);
    expect(JSON.stringify(person)).not.toContain("M_SOARES_V");
    expect(llmsFullTxt(careerFile, now)).toContain("Murillo Henrique Silva Soares");
    expect(jsonResume("en", careerFile, now).education[0]).toMatchObject({ area: "Computer Engineering" });
  });

  it("never shows a past role as Present in resume.json", () => {
    const work = jsonResume("en", careerFile, now).work;
    for (const w of work) {
      const p = careerFile.positions.find((x) => x.company === w.name)!;
      if (!p.current) expect(w.endDate, w.name).toMatch(/^\d{4}(-\d{2})?$/);
      if (!p.current && !p.end) expect(w.highlights.join(" ")).toMatch(/estimated/);
    }
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
