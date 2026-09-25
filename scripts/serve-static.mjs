// Serves the static export (out/) the way Netlify does for these routes: "/en" → en.html, "/en/" → en/index.html,
// unknown paths → 404.html with status 404. Used by the end-to-end tests so they exercise the production build.
// Like Netlify, it injects a comment wrapped in newlines after <meta charset> in every HTML page, so tests catch
// markup that only breaks once the host rewrites the page.
//   node scripts/serve-static.mjs [--dir out] [--host 127.0.0.1] [--port 3100]
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";

const opt = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const root = resolve(opt("dir", "out"));
const host = opt("host", "127.0.0.1");
const port = Number(opt("port", 3100));

if (!existsSync(join(root, "index.html"))) {
  console.error(`serve-static: ${root} has no index.html; run "npm run build" first.`);
  process.exit(1);
}

const TYPES = {
  ".html": "text/html; charset=utf-8", ".txt": "text/plain; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".woff2": "font/woff2", ".wasm": "application/wasm",
};

function resolveFile(pathname) {
  const clean = normalize(decodeURIComponent(pathname)).replace(/^(\.\.(\/|\\|$))+/, "");
  const base = join(root, clean);
  if (base !== root && !base.startsWith(root + sep)) return null;
  for (const candidate of [base, `${base}.html`, join(base, "index.html")]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

createServer((req, res) => {
  const { pathname } = new URL(req.url ?? "/", "http://localhost");
  const file = resolveFile(pathname);
  const status = file ? 200 : 404;
  const path = file ?? join(root, "404.html");
  res.writeHead(status, { "Content-Type": TYPES[extname(path)] ?? "application/octet-stream" });
  if (req.method === "HEAD") return res.end();
  if (extname(path) === ".html") {
    const html = readFileSync(path, "utf8").replace('<meta charSet="utf-8"/>', '<meta charSet="utf-8"/>\n<!-- injected by the host, as Netlify does -->\n');
    return res.end(html);
  }
  createReadStream(path).pipe(res);
}).listen(port, host, () => console.log(`serve-static: ${root} on http://${host}:${port}`));
