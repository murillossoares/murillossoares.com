import { inferArchType, normalizeCareerItem, parseCareerHistory, pickStackTechnologies } from "./dashboard-data";
import { describe, expect, it } from "vitest";

describe("dashboard-data", () => {
  it("infers microservices from stack and description hints", () => {
    expect(
      inferArchType({
        desc: "Spring Cloud services with Kafka integration",
        stack: ["Docker", "React"],
      }),
    ).toBe("microservices");
  });

  it("normalizes invalid entries with safe defaults", () => {
    expect(
      normalizeCareerItem(
        {
          year: 2025,
          type: "NOT_REAL",
          stack: ["Java 21", 7, null],
        },
        3,
      ),
    ).toEqual({
      id: "job_3",
      year: "",
      role: "",
      company: "",
      type: "INFO",
      desc: "",
      stack: ["Java 21"],
      archType: "hybrid",
    });
  });

  it("sorts career history descending by year and keeps deterministic order", () => {
    const history = parseCareerHistory([
      { id: "b", year: "2022", role: "Role B", company: "Company B", type: "INFO", desc: "", stack: [] },
      { id: "a", year: "2024", role: "Role A", company: "Company A", type: "WARN", desc: "", stack: [] },
      { id: "c", year: "2024", role: "Role C", company: "Company C", type: "INFO", desc: "", stack: [] },
    ]);

    expect(history.map((item) => item.id)).toEqual(["a", "c", "b"]);
  });

  it("parses partial entries, preserves explicit architecture, and drops malformed records", () => {
    const history = parseCareerHistory([
      {
        id: "service-api",
        year: "2023",
        role: "API Engineer",
        company: "Acme",
        type: "SUCCESS",
        desc: "Maintained service contracts.",
        stack: ["Node.js", "React", 9],
        archType: "soa",
      },
      null,
      {
        company: "Fallback Co",
        stack: ["HTML/CSS", false],
      },
      "broken",
    ]);

    expect(history).toEqual([
      {
        id: "service-api",
        year: "2023",
        role: "API Engineer",
        company: "Acme",
        type: "SUCCESS",
        desc: "Maintained service contracts.",
        stack: ["Node.js", "React"],
        archType: "soa",
      },
      {
        id: "job_2",
        year: "",
        role: "",
        company: "Fallback Co",
        type: "INFO",
        desc: "",
        stack: ["HTML/CSS"],
        archType: "hybrid",
      },
    ]);
  });

  it("returns an empty history when the dashboard content is malformed", () => {
    expect(parseCareerHistory(undefined)).toEqual([]);
    expect(parseCareerHistory({ careerHistory: [] })).toEqual([]);
  });

  it("filters stack technologies by backend and frontend groups across edge cases", () => {
    const stack = ["Java 21", "Node.js", "PostgreSQL", "React", "HTML/CSS", "Next.js", "GraphQL"];

    expect(pickStackTechnologies(stack, "backend")).toEqual(["Java 21", "Node.js", "PostgreSQL"]);
    expect(pickStackTechnologies(stack, "frontend")).toEqual(["React", "HTML/CSS", "Next.js"]);
  });
});
