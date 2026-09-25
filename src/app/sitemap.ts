import { execFileSync } from "node:child_process";

import type { MetadataRoute } from "next";

import { careerFile } from "@/services/careerData";
import { absoluteUrl, LOCALES, localeAlternates } from "@/lib/site";

export const dynamic = "force-static";

/**
 * When the visible content last changed: the newest of the last LinkedIn sync and the last commit touching the career
 * data or the page texts. Without either, lastmod is left out rather than claiming every deploy changed every page.
 */
function contentLastModified(): Date | undefined {
  const dates: number[] = [];
  if (careerFile.sync.syncedAt) dates.push(Date.parse(careerFile.sync.syncedAt));
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%cI", "--", "src/data", "src/messages"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    if (out) dates.push(Date.parse(out));
  } catch {
    // No git metadata (e.g. a source tarball): fall through.
  }
  const valid = dates.filter(Number.isFinite);
  return valid.length ? new Date(Math.max(...valid)) : undefined;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = contentLastModified();
  const pages = [
    { path: "", priority: 1 },
    { path: "/scoreboard", priority: 0.6 },
  ];
  return pages.flatMap(({ path, priority }) =>
    LOCALES.map((locale) => ({
      url: absoluteUrl(`/${locale}${path}`),
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: "monthly" as const,
      priority,
      alternates: { languages: localeAlternates(path) },
    })),
  );
}
