// Builds the site icons from scripts/icon/logo.svg (the MS monogram):
//   src/app/icon.svg       — browsers that take SVG favicons
//   src/app/favicon.ico    — 16/32/48 px; without it Netlify answers /favicon.ico with its own logo
//   src/app/apple-icon.png — 180 px home-screen icon
// Small sizes need a heavier stroke and a light tile so the mark stays readable on dark browser tabs.
//   node scripts/icon/render.mjs   (PLAYWRIGHT_CHROMIUM_EXECUTABLE picks a preinstalled Chromium)
import { readFileSync, writeFileSync } from "node:fs";

import { chromium } from "@playwright/test";

const logo = readFileSync("scripts/icon/logo.svg", "utf8");
const inner = logo.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

/** The monogram on a rounded white tile, cropped to the frame, with a stroke suited to small sizes. */
const tile = (stroke, radius = 170) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="40 37 935 938">` +
  `<rect x="40" y="37" width="935" height="938" rx="${radius}" fill="#ffffff"/>` +
  `<g fill="none" stroke="#1b3068" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${inner.replace(/\s+/g, " ").trim()}</g></svg>`;

writeFileSync("src/app/icon.svg", `${tile(40)}\n`);

const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {});
const page = await browser.newPage();
async function png(size, stroke, radius) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<body style="margin:0;background:transparent">${tile(stroke, radius).replace("<svg ", `<svg width="${size}" height="${size}" `)}</body>`);
  return page.screenshot({ omitBackground: true });
}

// ICO container holding PNG images (supported by every current browser).
const images = [[16, 64], [32, 52], [48, 44]];
const pngs = [];
for (const [size, stroke] of images) pngs.push(await png(size, stroke));
const header = Buffer.alloc(6 + 16 * pngs.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(pngs.length, 4);
let offset = header.length;
pngs.forEach((data, i) => {
  const size = images[i][0];
  const at = 6 + 16 * i;
  header.writeUInt8(size, at);
  header.writeUInt8(size, at + 1);
  header.writeUInt16LE(1, at + 4); // colour planes
  header.writeUInt16LE(32, at + 6); // bits per pixel
  header.writeUInt32LE(data.length, at + 8);
  header.writeUInt32LE(offset, at + 12);
  offset += data.length;
});
writeFileSync("src/app/favicon.ico", Buffer.concat([header, ...pngs]));
writeFileSync("src/app/apple-icon.png", await png(180, 36, 0)); // iOS rounds the corners itself and turns transparency black
await browser.close();
console.log("icons: src/app/icon.svg, src/app/favicon.ico, src/app/apple-icon.png");
