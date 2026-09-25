// Writes the Google Search Console HTML verification file (e.g. public/google1a2b3c.html) when the
// GOOGLE_SITE_VERIFICATION_FILE environment variable names one. Runs before every build; never fails it.
// The file is served with 200 at the site root, so it verifies even though "/" itself answers with a redirect.
import { writeFileSync } from "node:fs";

const PUBLIC = new URL("../public/", import.meta.url);

// Surface a misconfigured meta-tag variable in the deploy log instead of silently emitting nothing.
const metaVar = (process.env.GOOGLE_SITE_VERIFICATION ?? "").trim();
if (metaVar) {
  const tokens = [...metaVar.matchAll(/content\s*=\s*["']?([^"'\s>]+)/gi)].map((m) => m[1]);
  const ok = (tokens.length ? tokens : metaVar.split(/[\s,]+/)).filter((t) => /^[A-Za-z0-9_-]{10,100}$/.test(t));
  console.log(ok.length
    ? `Search Console meta verification: ${ok.length} token(s) configured.`
    : "::warning title=Search Console::GOOGLE_SITE_VERIFICATION is set but contains no valid token; no meta tag will be emitted.");
}
const name = (process.env.GOOGLE_SITE_VERIFICATION_FILE ?? "").trim();

// Only ever writes: a googleXXXX.html committed to public/ by hand (Google's other suggested route) must survive.
if (!name) process.exit(0);
if (!/^google[a-z0-9]{8,64}\.html$/i.test(name)) {
  console.log(`::warning title=Search Console::GOOGLE_SITE_VERIFICATION_FILE "${name.slice(0, 80)}" is not a Google verification file name (googleXXXX.html); ignored.`);
  process.exit(0);
}
try {
  writeFileSync(new URL(name, PUBLIC), `google-site-verification: ${name}`);
  console.log(`Search Console verification file written: /${name}`);
} catch (error) {
  console.log(`::warning title=Search Console::could not write /${name}: ${error.message}`);
}
