import { defineConfig, devices } from "@playwright/test";

const host = process.env.PLAYWRIGHT_HOST ?? "127.0.0.1";
const port = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://${host}:${port}`;

const webServerEnv = Object.fromEntries(
  Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
);
delete webServerEnv.NO_COLOR;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  workers: process.env.CI ? 1 : undefined,
  outputDir: "test-results/playwright",
  reporter: process.env.CI ? [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    // Lets sandboxes with a preinstalled browser run the suite (e.g. PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium).
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {},
    // Post-deploy runs: PLAYWRIGHT_BASE_URL=https://murillossoares.netlify.app npm run test:e2e
    // (PLAYWRIGHT_PROXY / PLAYWRIGHT_IGNORE_HTTPS_ERRORS=1 for networks behind an intercepting proxy).
    ...(process.env.PLAYWRIGHT_PROXY ? { proxy: { server: process.env.PLAYWRIGHT_PROXY } } : {}),
    ignoreHTTPSErrors: process.env.PLAYWRIGHT_IGNORE_HTTPS_ERRORS === "1",
  },
  // Tests run against the production static export (run "npm run build" first), the same files Netlify serves.
  // PLAYWRIGHT_DEV=1 uses the Next.js dev server instead, for quick local iteration.
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: process.env.PLAYWRIGHT_DEV
      ? `npm exec next dev -- --hostname ${host} -p ${port}`
      : `node scripts/serve-static.mjs --dir out --host ${host} --port ${port}`,
    env: webServerEnv,
    url: `${baseURL}/pt-br`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    gracefulShutdown: { signal: "SIGTERM", timeout: 5_000 },
  },
  // Every spec runs on desktop and on two phone profiles. The iPhone profile keeps its viewport, touch and
  // user agent but runs on Chromium, the only engine CI installs.
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-android", use: { ...devices["Pixel 7"] } },
    { name: "mobile-iphone", use: { ...devices["iPhone 14"], browserName: "chromium" } },
  ],
});
