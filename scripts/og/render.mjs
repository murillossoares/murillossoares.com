// Renders the Open Graph image for each locale (public/og/<locale>.png, 1200×630) from the same data the page shows.
//   npm run og        (needs a Chromium; PLAYWRIGHT_CHROMIUM_EXECUTABLE picks a preinstalled one)
// A unit test compares scripts/og/manifest.json with the current data and fails when the images are stale.
import { readFileSync, writeFileSync } from "node:fs";

import { chromium } from "@playwright/test";

import { ogFingerprint, ogInputs } from "../../src/lib/og.ts";

const LOCALES = ["pt-br", "en", "es"];
const career = JSON.parse(readFileSync("src/data/career.json", "utf8"));
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function html(i) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;box-sizing:border-box}
  body{width:1200px;height:630px;background:#0d1117;color:#fff;font-family:"DejaVu Sans Mono",monospace;overflow:hidden;
    background:radial-gradient(circle at 12% 30%,rgba(34,197,94,.13),transparent 40%),radial-gradient(circle at 88% 8%,rgba(56,130,246,.14),transparent 35%),#0d1117}
  .bar{height:44px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;align-items:center;gap:10px;padding:0 20px;background:#15181e;color:#8b949e;font-size:16px}
  .dot{width:12px;height:12px;border-radius:50%}
  main{padding:72px 80px 0}
  .status{color:#22c55e;font-size:22px;letter-spacing:.3em;display:flex;align-items:center;gap:18px;text-transform:uppercase}
  .status i{width:13px;height:13px;border-radius:50%;background:#22c55e;display:block}
  h1{font-family:"DejaVu Sans",sans-serif;font-weight:700;font-size:96px;letter-spacing:-1px;margin-top:22px}
  .headline{color:#22c55e;font-size:32px;margin-top:14px}
  .stack{color:#b7bdc6;font-size:25px;margin-top:40px}
  .chips{display:flex;gap:12px;margin-top:22px}
  .chip{border:1px solid rgba(255,255,255,.14);border-radius:4px;padding:8px 14px;font-size:20px;background:rgba(255,255,255,.02)}
  svg{position:absolute;right:50px;bottom:70px}
  </style></head><body>
  <div class="bar"><span class="dot" style="background:#ff5f57"></span><span class="dot" style="background:#febc2e"></span><span class="dot" style="background:#28c840"></span><span style="margin-left:14px">~/murillo-soares/portfolio — career.json</span></div>
  <main>
    <div class="status"><i></i>${esc(i.status)}</div>
    <h1>${esc(i.name)}</h1>
    <div class="headline">${esc(i.headline)}</div>
    <div class="stack">&gt; ${i.stack.map(esc).join(" · ")}</div>
    <div class="chips">${i.chips.map((c) => `<span class="chip" style="color:${c.color}">${esc(c.label)}</span>`).join("")}</div>
  </main>
  <svg width="340" height="140" viewBox="0 0 340 140"><g stroke="rgba(255,255,255,.18)"><line x1="10" y1="120" x2="100" y2="50"/><line x1="100" y1="50" x2="180" y2="100"/><line x1="100" y1="50" x2="270" y2="30"/><line x1="180" y1="100" x2="270" y2="30"/><line x1="180" y1="100" x2="310" y2="90"/></g>
  <circle cx="10" cy="120" r="10" fill="#f97316"/><circle cx="100" cy="50" r="14" fill="#a855f7"/><circle cx="180" cy="100" r="12" fill="#22c55e"/><circle cx="270" cy="30" r="26" fill="none" stroke="#22c55e" stroke-opacity=".5"/><circle cx="270" cy="30" r="16" fill="#22c55e"/><circle cx="310" cy="90" r="11" fill="#38bdf8"/></svg>
  </body></html>`;
}

const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
const manifest = {};
for (const locale of LOCALES) {
  const messages = JSON.parse(readFileSync(`src/messages/${locale}.json`, "utf8"));
  const inputs = ogInputs(career, messages, locale);
  await page.setContent(html(inputs));
  await page.screenshot({ path: `public/og/${locale}.png` });
  manifest[locale] = ogFingerprint(inputs);
  console.log(`og: public/og/${locale}.png`);
}
writeFileSync("scripts/og/manifest.json", `${JSON.stringify(manifest, null, 2)}\n`);
await browser.close();
