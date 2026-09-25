import { expect, test, type Page } from "@playwright/test";

/** WCAG contrast of each element's text against the first opaque background behind it. */
async function contrasts(page: Page, selector: string) {
  return page.locator(selector).evaluateAll((els) => {
    const rgb = (c: string) => (c.match(/[\d.]+/g) ?? []).map(Number);
    const lum = ([r, g, b]: number[]) => {
      const ch = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
    };
    const blend = (fg: number[], bg: number[]) => { const a = fg[3] ?? 1; return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a)); };
    const background = (el: Element): number[] => {
      const layers: number[][] = [];
      for (let n: Element | null = el; n; n = n.parentElement) {
        const c = rgb(getComputedStyle(n).backgroundColor);
        if ((c[3] ?? 1) > 0) layers.push(c);
        if ((c[3] ?? 1) >= 1) break;
      }
      let base = rgb(getComputedStyle(document.body).backgroundColor);
      for (const layer of layers.reverse()) base = blend(layer, base);
      return base;
    };
    return els.filter((el) => (el as HTMLElement).offsetParent !== null && el.textContent?.trim()).map((el) => {
      const bg = background(el);
      const fg = blend(rgb(getComputedStyle(el).color), bg);
      const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
      return { text: el.textContent!.trim().slice(0, 40), ratio: Math.round(((a + 0.05) / (b + 0.05)) * 100) / 100 };
    });
  });
}

test.describe("Bluloco Light theme", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en");
    await page.keyboard.press("Escape");
    await expect(page.locator("#boot-overlay")).toBeHidden({ timeout: 10_000 });
    await page.getByRole("combobox", { name: "Theme" }).selectOption("bluloco-light");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "bluloco-light");
  });

  test("switches the page to a light surface and remembers it", async ({ page }) => {
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe("rgb(249, 249, 249)");
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe("light");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "bluloco-light");
  });

  test("text keeps at least 4.5:1 contrast", async ({ page }) => {
    await page.getByRole("button", { name: /@ YTech/ }).click();
    const selectors = ["h1", "h2", "h3", "#main-content p", "#main-content time", "#main-content li span", "aside h3", "header span", "section[aria-label='KPIs'] p"];
    const failing = [];
    let checked = 0;
    for (const s of selectors) {
      const results = await contrasts(page, s);
      checked += results.length;
      failing.push(...results.filter((r) => r.ratio < 4.5).map((r) => ({ selector: s, ...r })));
    }
    expect(checked).toBeGreaterThan(40); // the check really measured the page
    expect(failing).toEqual([]);
  });

  test("scoreboard and CV follow the theme", async ({ page }) => {
    await page.goto("/en/scoreboard");
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(249, 249, 249)");
    const low = (await contrasts(page, "h1, h2, dt, dd, p")).filter((r) => r.ratio < 4.5);
    expect(low).toEqual([]);
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 30_000 }),
      page.getByRole("button", { name: "Download CV" }).click(),
    ]);
    expect(download.suggestedFilename()).toBe("cv-murillo-en-bluloco-light.pdf");
  });
});
