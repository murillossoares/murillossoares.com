import { describe, expect, it } from "vitest";

import { calculateScoreboardMetrics, type CareerMetric } from "./metrics";

describe("calculateScoreboardMetrics", () => {
  it("derives factual career metrics without percentages", () => {
    const events: CareerMetric[] = [
      { id: "a", year: "2020", role: "A", company: "A", type: "INFO", desc: "", stack: [" React ", "Node.js"], archType: "monolith" },
      { id: "b", year: "2022", role: "B", company: "B", type: "INFO", desc: "", stack: ["react", "TypeScript"], archType: "microservices" },
      { id: "c", year: "2021", role: "C", company: "C", type: "INFO", desc: "", stack: [" NODE.JS ", ""], archType: "monolith" },
    ];

    const { metrics } = calculateScoreboardMetrics(events, (key) => key);

    expect(metrics).toEqual([
      { id: "experience", label: "metrics.experience.label", value: "3", description: "metrics.experience.description" },
      { id: "engagements", label: "metrics.engagements.label", value: "3", description: "metrics.engagements.description" },
      { id: "technologies", label: "metrics.technologies.label", value: "3", description: "metrics.technologies.description" },
      { id: "architectures", label: "metrics.architectures.label", value: "2", description: "metrics.architectures.description" },
    ]);
    expect(metrics.every((metric) => !("percent" in metric))).toBe(true);
  });
});
