import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

// A portfolio wants to be found: search engines and AI crawlers/assistants are explicitly welcome.
const AI_AGENTS = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot", "anthropic-ai",
  "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "CCBot", "Meta-ExternalAgent", "Amazonbot", "DuckAssistBot", "MistralAI-User",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: AI_AGENTS, allow: "/" },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
