import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

// A portfolio wants to be found: every crawler, search engine or otherwise, is welcome. A single wildcard group
// covers them all; naming individual bots would not change what they may fetch.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
