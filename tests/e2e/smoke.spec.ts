import { expect, test, type Page } from "@playwright/test";

async function dismissBoot(page: Page) {
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { name: "Murillo Soares" })).toBeVisible({ timeout: 15000 });
}

test.describe("portfolio smoke", () => {
  for (const locale of ["pt-br", "en", "es"]) {
    test(`loads dashboard for ${locale}`, async ({ page }) => {
      const pageErrors: Error[] = [];
      page.on("pageerror", (error) => pageErrors.push(error));

      await page.goto(`/${locale}`);
      await dismissBoot(page);

      await expect(page.getByText("GET_CV.pdf")).toBeVisible();
      await expect(page.getByRole("combobox")).toBeVisible();
      expect(pageErrors).toEqual([]);
    });
  }

  test("cv-print route responds without uncaught page errors", async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));

    await page.goto("/pt-br");
    await dismissBoot(page);

    const response = await page.goto("/pt-br/cv-print?lang=pt-br&theme=vscode-dark");
    expect(response?.ok()).toBeTruthy();
    await page.waitForTimeout(750);
    expect(pageErrors).toEqual([]);
  });

  test("keyboard skip is immediate", async ({ page }) => {
    await page.goto("/pt-br");
    await expect(page.getByRole("button", { name: /Pular boot/i })).toBeVisible();
    await page.waitForTimeout(100);

    const startedAt = Date.now();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("heading", { name: "Murillo Soares" })).toBeVisible();

    expect(Date.now() - startedAt).toBeLessThan(2000);
  });

  test("persona is a named modal dialog that restores focus", async ({ page }) => {
    await page.goto("/pt-br");
    await dismissBoot(page);

    const trigger = page.getByRole("button", { name: "PERSONA" });
    await trigger.focus();
    await trigger.click();

    const dialog = page.getByRole("dialog", { name: "M_SOARES_V" });
    await expect(dialog).toBeVisible();
    await expect(page.getByRole("button", { name: "Fechar" })).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(dialog).toContainText("CORE_STATS");
    expect(await page.evaluate(() => document.activeElement?.closest('[role="dialog"]') !== null)).toBe(true);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("reduced motion settles without infinite animations", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/pt-br");
    await expect(page.getByRole("heading", { name: "Murillo Soares" })).toBeVisible({ timeout: 3000 });

    await expect
      .poll(() =>
        page.evaluate(
          () =>
            document
              .getAnimations()
              .filter((animation) => animation.effect?.getTiming().iterations === Infinity).length,
        ),
      )
      .toBe(0);
  });

  test("persona remains usable on a mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/pt-br");
    await dismissBoot(page);

    await page.getByRole("button", { name: "PERSONA" }).click();
    await expect(page.getByRole("dialog", { name: "M_SOARES_V" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Fechar" })).toBeVisible();

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});
