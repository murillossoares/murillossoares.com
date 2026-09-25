import { describe, expect, it } from "vitest";

import { calculateScoreboardMetrics, careerFacts, effectiveEndYear, formatYears, sortCareerEvents, technologiesPerYear, type CareerMetric } from "./metrics";

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
    // "2020" has no month, so the count is a guaranteed minimum: Dec 2020 → Jun 2026 is 5 full years.
    expect(metrics.map((m) => [m.id, m.value])).toEqual([
      ["experience", "5+"],
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

  it("assumes an unknown end lasts until the next position starts", () => {
    const [a] = events;
    expect(effectiveEndYear(a, events, now)).toBe(2021);
    expect(effectiveEndYear(events[2], events, now)).toBe(2026);
  });

  it("never overstates experience from year-only dates", () => {
    const yearOnly: CareerMetric[] = [{ ...base, id: "q", company: "Q", start: "2017", current: true, stack: [], archType: "soa" }];
    // 2017 could be December: Dec 2017 → Jun 2026 guarantees 8 full years, not the 9 of a plain year difference.
    expect(careerFacts(yearOnly, now)).toMatchObject({ years: 8, yearsExact: false });
    expect(formatYears(careerFacts(yearOnly, now))).toBe("8+");
  });

  it("counts completed years from months when every position has them", () => {
    const monthly: CareerMetric[] = [
      { ...base, id: "x", company: "X", start: "2017-11", end: "2019-06", stack: [], archType: "monolith" },
      { ...base, id: "y", company: "Y", start: "2019-07", current: true, stack: [], archType: "soa" },
    ];
    // Nov 2017 → Jun 2026 is 8 years and 8 months, not the 9 a plain year difference would claim.
    expect(careerFacts(monthly, now)).toMatchObject({ years: 8, yearsExact: true });
    // One year-only position makes the count a minimum instead of guessing upwards.
    expect(careerFacts([...monthly, { ...base, id: "z", company: "Z", start: "2018", stack: [], archType: "hybrid" }], now)).toMatchObject({ years: 8, yearsExact: false });
  });

  it("counts technologies in use per year", () => {
    expect(technologiesPerYear(events, now)).toEqual([
      { year: 2020, count: 2 },
      { year: 2021, count: 2 },
      { year: 2022, count: 2 },
      { year: 2023, count: 2 },
      { year: 2024, count: 1 },
      { year: 2025, count: 1 },
      { year: 2026, count: 1 },
    ]);
  });
});
