import { describe, expect, it } from "vitest";

import { careerFile } from "@/services/careerData";
import { distinctTechnologies, groupStack, isKnownTech, resolveTech } from "./tech";

describe("tech catalogue", () => {
  it("categorises every technology listed in career.json", () => {
    const unknown = careerFile.positions.flatMap((p) => p.stack).filter((label) => !isKnownTech(label));
    expect(unknown).toEqual([]);
  });

  it("never drops a stack item when grouping", () => {
    for (const position of careerFile.positions) {
      const shown = groupStack(position.stack).flatMap((g) => g.items).length;
      const expected = position.stack.flatMap(resolveTech).length;
      expect(shown, position.id).toBe(expected);
    }
  });

  it("counts versions of the same technology once", () => {
    expect(distinctTechnologies([["Java 8"], ["Java 17", "java"], ["Spring Boot"]])).toEqual(["Java", "Spring Boot"]);
  });

  it("splits composite labels but keeps real slashes", () => {
    expect(resolveTech("SOAP/REST").map((r) => r.canonical)).toEqual(["SOAP", "REST"]);
    expect(resolveTech("PL/SQL").map((r) => r.canonical)).toEqual(["PL/SQL"]);
    expect(resolveTech("HTML/CSS")).toHaveLength(1);
  });
});
