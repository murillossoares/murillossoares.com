import { describe, expect, it } from "vitest";

import { jsonResume, llmsFullTxt, llmsTxt, personJsonLd } from "./agent-content";
import { careerFile } from "@/services/careerData";

const now = new Date("2026-09-01");

describe("machine-readable content", () => {
  it("publishes a ProfilePage/Person JSON-LD with every position", () => {
    const ld = personJsonLd("en", careerFile, now);
    expect(ld["@type"]).toBe("ProfilePage");
    expect(ld.mainEntity).toMatchObject({ "@type": "Person", name: "Murillo Soares", sameAs: expect.arrayContaining(["https://www.linkedin.com/in/murillossoares/"]) });
    expect(ld.mainEntity.hasOccupation).toHaveLength(careerFile.positions.length);
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
