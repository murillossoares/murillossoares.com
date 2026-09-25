import { describe, expect, it } from "vitest";

import { formatDuration, formatMonthYear, formatPeriod, monthsBetween, periodParts, toMonth } from "./period";

const asOf = new Date("2026-09-25T00:00:00Z");

describe("month/year periods (no days)", () => {
  it("formats month and year per locale from fixed tables", () => {
    expect(formatMonthYear("2025-02", "pt-br")).toBe("fev. 2025");
    expect(formatMonthYear("2025-02", "en")).toBe("Feb 2025");
    expect(formatMonthYear("2025-12", "es")).toBe("dic 2025");
    expect(formatMonthYear("2025", "pt-br")).toBe("2025");
  });

  it("never prints a day, whatever the input", () => {
    for (const l of ["pt-br", "en", "es"]) {
      const text = formatPeriod({ start: "2023-03", end: "2024-12", current: false }, l, asOf);
      expect(text).not.toMatch(/\b\d{1,2}\/\d{1,2}\b|\b\d{4}-\d{2}-\d{2}\b/);
    }
  });

  it("counts months inclusively, like LinkedIn", () => {
    expect(monthsBetween("2023-03", "2024-12")).toBe(22);
    expect(monthsBetween("2025-02", "2025-02")).toBe(1);
    expect(monthsBetween("2023", "2024-12")).toBeNull();
    expect(monthsBetween("2024-12", "2023-03")).toBeNull();
  });

  it("formats durations in each language", () => {
    expect(formatDuration(22, "pt-br")).toBe("1 ano e 10 meses");
    expect(formatDuration(1, "pt-br")).toBe("1 mês");
    expect(formatDuration(24, "es")).toBe("2 años");
    expect(formatDuration(20, "en")).toBe("1 yr 8 mos");
  });

  it("builds ranges for past, current and year-only positions", () => {
    expect(formatPeriod({ start: "2023-03", end: "2024-12", current: false }, "pt-br", asOf)).toBe("mar. 2023 – dez. 2024 · 1 ano e 10 meses");
    expect(formatPeriod({ start: "2025-02", end: null, current: true }, "en", asOf)).toBe("Feb 2025 – present · 1 yr 8 mos");
    expect(formatPeriod({ start: "2019", end: null, current: false }, "es", asOf)).toBe("2019");
    expect(formatPeriod({ start: "2019", end: "2020", current: false }, "es", asOf)).toBe("2019 – 2020");
    expect(formatPeriod({ start: "2019-01", end: "2019-03", current: false }, "en", asOf, { withDuration: false })).toBe("Jan 2019 – Mar 2019");
  });

  it("exposes ISO month strings for <time datetime>", () => {
    const p = periodParts({ start: "2023-03", end: "2024-12", current: false }, "pt-br", asOf);
    expect(p.start.iso).toBe("2023-03");
    expect(p.end?.iso).toBe("2024-12");
  });

  it("uses UTC for the reference month", () => {
    expect(toMonth(new Date("2026-12-31T23:30:00Z"))).toBe("2026-12");
    expect(toMonth(new Date("2027-01-01T00:30:00+01:00"))).toBe("2026-12");
  });
});
