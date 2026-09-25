import { describe, expect, it } from "vitest";

import { calculateScoreboardMetrics, careerFacts, sortCareerEvents, technologiesPerYear, type CareerMetric } from "./metrics";

const base = { role: "", desc: "", end: null, current: false, kind: "employment" as const };
const now = new Date("2026-06-01");

describe("career metrics", () => {
  const events: CareerMetric[] = [
    { ...base, id: "a", company: "A", start: "2020", stack: [" React ", "Node.js"], archType: "monolith", kind: "internship" },
    { ...base, id: "b", company: "B", start: "2022", end: "2023", stack: ["react", "Java 17"], archType: "microservices" },
    { ...base, id: "c", company: "A", start: "2024", current: true, stack: ["Java 8", ""], archType: "monolith" },
  ];

  it("derives factual metrics without percentages", () => {
    const { metrics } = calculateScoreboardMetrics(events, (key) => key, now);
    expect(metrics.map((m) => [m.id, m.value])).toEqual([
      ["experience", "6"],
      ["engagements", "3"],
      ["technologies", "3"],
      ["architectures", "2"],
    ]);
    expect(metrics.every((metric) => !("percent" in metric))).toBe(true);
  });

  it("reports internships and distinct companies", () => {
    expect(careerFacts(events, now)).toMatchObject({ since: 2020, internships: 1, companies: 2, positions: 3 });
  });

  it("puts current positions first", () => {
    expect(sortCareerEvents(events).map((e) => e.id)).toEqual(["c", "b", "a"]);
  });

  it("counts technologies in use per year", () => {
    expect(technologiesPerYear(events, now)).toEqual([
      { year: 2020, count: 2 },
      { year: 2021, count: 0 },
      { year: 2022, count: 2 },
      { year: 2023, count: 2 },
      { year: 2024, count: 1 },
      { year: 2025, count: 1 },
      { year: 2026, count: 1 },
    ]);
  });
});
