// Netlify exposes the site's primary URL as `URL` at build time, so a custom domain is picked up automatically.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.URL || "https://murillossoares.netlify.app").replace(/\/$/, "");

export const LOCALES = ["pt-br", "en", "es"] as const;
export const DEFAULT_LOCALE = "pt-br";

/** BCP 47 tags for hreflang / og:locale. */
export const LOCALE_TAGS: Record<string, { hreflang: string; og: string; name: string }> = {
  "pt-br": { hreflang: "pt-BR", og: "pt_BR", name: "Português (Brasil)" },
  en: { hreflang: "en", og: "en_US", name: "English" },
  es: { hreflang: "es", og: "es_ES", name: "Español" },
};

export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function localeAlternates(path = "") {
  return {
    ...Object.fromEntries(LOCALES.map((l) => [LOCALE_TAGS[l].hreflang, absoluteUrl(`/${l}${path}`)])),
    "x-default": absoluteUrl(`/${DEFAULT_LOCALE}${path}`),
  };
}

/**
 * Google Search Console verification tokens (the `content` of <meta name="google-site-verification">), read at build
 * time from the GOOGLE_SITE_VERIFICATION environment variable (comma-separated for several owners). They are public
 * by design, but keeping them in the Netlify environment means changing owners needs no code change.
 */
export function googleVerificationTokens(env: Record<string, string | undefined> = process.env): string[] {
  return (env.GOOGLE_SITE_VERIFICATION ?? "")
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter((t) => /^[A-Za-z0-9_-]{10,100}$/.test(t));
}
