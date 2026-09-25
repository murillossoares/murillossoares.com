import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { normalizePositionsWithIssues, parseCsv, POSITIONS_COLUMNS } from "./core.ts";

// The repository is public: the committed LinkedIn export must stay limited to public profile positions.
const DIR = "data/linkedin";
const FILE = `${DIR}/Positions.csv`;
const TEMPLATE = `${DIR}/Positions.template.csv`;

describe("committed LinkedIn export", () => {
  it("contains only Positions.csv, its template and the README", () => {
    const tracked = execFileSync("git", ["ls-files", DIR], { encoding: "utf8" }).split("\n").filter(Boolean);
    expect(tracked.filter((f) => ![FILE, TEMPLATE, `${DIR}/README.md`].includes(f))).toEqual([]);
  });

  it("keeps the template unusable as data until its MMM placeholders are filled in", () => {
    const rows = parseCsv(readFileSync(TEMPLATE, "utf8"));
    expect(Object.keys(rows[0])).toEqual(POSITIONS_COLUMNS);
    const { positions, rejected } = normalizePositionsWithIssues(rows);
    expect(positions).toEqual([]);
    expect(rejected).toHaveLength(rows.length);
  });

  it.runIf(existsSync(FILE))("Positions.csv has only the expected columns and no contact data", () => {
    const csv = readFileSync(FILE, "utf8");
    const rows = parseCsv(csv);
    expect(Object.keys(rows[0] ?? {}).every((c) => POSITIONS_COLUMNS.includes(c))).toBe(true);
    expect(rows.length).toBeLessThan(100);
    expect(csv).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/); // e-mail addresses
    expect(csv).not.toMatch(/\+?\d[\d\s().-]{9,}\d/); // phone numbers
    // Every row must be usable: a half-filled template (MMM left in place) is caught here, not silently skipped.
    expect(normalizePositionsWithIssues(rows).rejected).toEqual([]);
  });
});
