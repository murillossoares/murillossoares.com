import type { MetadataRoute } from "next";

import { careerFile } from "@/services/careerData";
import { absoluteUrl, LOCALES, localeAlternates } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = careerFile.sync.syncedAt ? new Date(careerFile.sync.syncedAt) : new Date();
  const pages = [
    { path: "", priority: 1 },
    { path: "/scoreboard", priority: 0.6 },
  ];
  return pages.flatMap(({ path, priority }) =>
    LOCALES.map((locale) => ({
      url: absoluteUrl(`/${locale}${path}`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority,
      alternates: { languages: localeAlternates(path) },
    })),
  );
}
