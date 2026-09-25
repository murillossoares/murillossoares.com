import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import career from "@/data/career.json";
import { LOCALES } from "@/lib/site";
import { ogFingerprint, ogInputs } from "./og";

describe("Open Graph images", () => {
  const manifest = JSON.parse(readFileSync("scripts/og/manifest.json", "utf8")) as Record<string, string>;

  it.each(LOCALES)("public/og/%s.png is a 1200×630 PNG rendered from the current data", async (locale) => {
    const png = readFileSync(`public/og/${locale}.png`);
    expect(png.subarray(1, 4).toString()).toBe("PNG");
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
    const messages = (await import(`@/messages/${locale}.json`)).default;
    // Stale image: run `npm run og` and commit public/og and scripts/og/manifest.json.
    expect(manifest[locale]).toBe(ogFingerprint(ogInputs(career, messages, locale)));
  });
});
