// Writes the Google Search Console HTML verification file (e.g. public/google1a2b3c.html) when the
// GOOGLE_SITE_VERIFICATION_FILE environment variable names one. Runs before every build; never fails it.
// The file is served with 200 at the site root, so it verifies even though "/" itself answers with a redirect.
import { writeFileSync } from "node:fs";

const PUBLIC = new URL("../public/", import.meta.url);
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
