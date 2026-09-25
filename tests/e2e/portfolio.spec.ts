import { readFile } from "node:fs/promises";

import { expect, test, type Page } from "@playwright/test";

import career from "../../src/data/career.json";

async function skipBoot(page: Page) {
  await page.keyboard.press("Escape");
  await expect(page.locator("#boot-overlay")).toBeHidden({ timeout: 10_000 });
}

test.describe("crawlers and agents", () => {
  test("static HTML carries content and metadata without JavaScript", async ({ request }) => {
    const html = await (await request.get("/pt-br")).text();
    expect(html.match(/<html/g)).toHaveLength(1);
    expect(html).toMatch(/<html[^>]+lang="pt-BR"/);
    expect(html).toMatch(/<title>Murillo Soares — Engenheiro Full Stack Sênior/);
    expect(html).toMatch(/<meta name="description" content="[^"]{80,}"/);
    expect(html).toMatch(/<link rel="canonical" href="[^"]+\/pt-br"/);
    for (const lang of ["pt-BR", "en", "es", "x-default"]) expect(html).toContain(`hrefLang="${lang}"`);
    expect(html).toContain('property="og:image"');
    for (const p of career.positions) expect(html).toContain(p.company.replace("&", "&amp;"));
    // Visible text only: strip scripts and meta tags, which also carry these names.
    const visible = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<meta[^>]*>/g, "");
    expect(visible).toContain(career.person.fullName);
    expect(visible).toContain("IFMT");

    const ld = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)![1]);
    expect(ld.mainEntity.name).toBe("Murillo Soares");
    const former = ld.mainEntity.alumniOf.filter((a: { "@type": string }) => a["@type"] === "OrganizationRole");
    expect(ld.mainEntity.worksFor.length + former.length).toBe(career.positions.length);
  });

  test("robots, sitemap, llms.txt and resume.json are served", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Sitemap:");
    expect(robots).toMatch(/User-Agent: \*\s+Allow: \//);
    expect(robots).not.toMatch(/Disallow: \/\s*$/m);

    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap.match(/<loc>/g)).toHaveLength(6);
    expect(sitemap).toContain('hreflang="x-default"');

    expect(await (await request.get("/llms.txt")).text()).toMatch(/^# Murillo Soares/);
    const resume = await (await request.get("/resume.json")).json();
    expect(resume.work).toHaveLength(career.positions.length);
  });

  test("renders readable content with JavaScript disabled", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/en");
    await expect(page.locator("#boot-overlay")).toBeHidden();
    await expect(page.getByRole("heading", { level: 1, name: "Murillo Soares" })).toBeVisible();
    await expect(page.getByText("YTech | CGI").first()).toBeVisible();
    await context.close();
  });
});

test.describe("boot overlay", () => {
  test("never hides the content and only plays once per session", async ({ page }) => {
    await page.goto("/pt-br");
    await expect(page.locator("#boot-overlay")).toBeVisible();
    // The dashboard is already in the DOM underneath the overlay.
    await expect(page.getByRole("heading", { level: 1, name: "Murillo Soares" })).toBeAttached();
    await expect(page.locator("#boot-overlay")).toBeHidden({ timeout: 8_000 });

    await page.reload();
    await expect(page.locator("#boot-overlay")).toBeHidden();
    await expect(page.getByRole("heading", { level: 1, name: "Murillo Soares" })).toBeVisible();
  });

  test("can be dismissed by tapping anywhere", async ({ page }) => {
    await page.goto("/pt-br");
    await page.locator("#boot-overlay").click({ position: { x: 40, y: 200 } });
    await expect(page.locator("#boot-overlay")).toBeHidden({ timeout: 3_000 });
  });
});

test.describe("career data is shown truthfully", () => {
  test("lists every position with honest status badges", async ({ page }) => {
    await page.goto("/pt-br");
    await skipBoot(page);
    const items = page.locator("#main-content ol > li");
    await expect(items).toHaveCount(career.positions.length);
    await expect(items.first()).toContainText("EM EXECUÇÃO");
    await expect(page.locator("#main-content")).not.toContainText("WARN");
  });

  test("shows the whole stack of the selected position, grouped by category", async ({ page }) => {
    await page.goto("/en");
    await skipBoot(page);
    const aside = page.locator("aside");
    for (const tech of ["Java 8", "Spring Web", "Jersey", "SOAP", "REST", "Gradle"]) {
      await expect(aside.getByText(tech, { exact: true })).toBeVisible();
    }
    await page.getByRole("button", { name: /@ Accurate Software/ }).click();
    for (const tech of ["AWS Lambda", "Jenkins", "Docker", "React"]) {
      await expect(aside.getByText(tech, { exact: true })).toBeVisible();
    }
  });

  test("KPIs are verifiable facts, not adjectives", async ({ page }) => {
    await page.goto("/pt-br");
    await skipBoot(page);
    const kpis = page.getByRole("region", { name: "KPIs" });
    const since = Math.min(...career.positions.map((p) => Number(p.start.slice(0, 4))));
    const companies = new Set(career.positions.map((p) => p.company.toLowerCase())).size;
    await expect(kpis).toContainText(`DESDE ${since}`);
    await expect(kpis).toContainText(`em ${companies} empresas`);
    await expect(kpis).not.toContainText(/Completo|Sólida|Solida/);
  });

  test("scoreboard chart heights follow the values", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/pt-br/scoreboard");
    const bars = page.getByTestId("scoreboard-scene").locator("li");
    const data = await bars.evaluateAll((lis) => lis.map((li) => ({
      value: Number(li.querySelector("span")?.textContent),
      height: (li.querySelectorAll("span")[1] as HTMLElement).getBoundingClientRect().height,
    })));
    expect(data.length).toBeGreaterThan(5);
    const sorted = [...data].sort((a, b) => a.value - b.value);
    for (let i = 1; i < sorted.length; i++) expect(sorted[i].height).toBeGreaterThanOrEqual(sorted[i - 1].height - 0.5);
    expect(sorted.at(-1)!.height).toBeGreaterThan(sorted[0].height);
  });
});

test.describe("CV PDF", () => {
  for (const locale of ["pt-br", "en"]) {
    test(`downloads a valid PDF (${locale})`, async ({ page }) => {
      await page.goto(`/${locale}`);
      await skipBoot(page);
      const [download] = await Promise.all([
        page.waitForEvent("download", { timeout: 30_000 }),
        page.getByRole("button", { name: "GET_CV.pdf" }).click(),
      ]);
      expect(download.suggestedFilename()).toBe(`cv-murillo-${locale}-vscode-dark.pdf`);
      const bytes = await readFile((await download.path())!);
      expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
      expect(bytes.length).toBeGreaterThan(5_000);
    });
  }
});

test.describe("layout", () => {
  test("no horizontal scroll and the floating button never covers the end of the page", async ({ page }) => {
    await page.goto("/pt-br");
    await skipBoot(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const button = await page.getByRole("button", { name: "PERSONA" }).boundingBox();
    const lastCard = await page.locator("main > *").last().boundingBox();
    expect(button && lastCard).toBeTruthy();
    expect(lastCard!.y + lastCard!.height).toBeLessThanOrEqual(button!.y + 1);
  });

  test("selecting a position in the timeline updates the details panel", async ({ page }) => {
    await page.goto("/en");
    await skipBoot(page);
    await page.getByRole("button", { name: /@ NBS Informática/ }).click();
    await expect(page.locator("aside")).toContainText("NBS Informática");
    await expect(page.locator("aside")).toContainText("Netflix Eureka");
  });
});
