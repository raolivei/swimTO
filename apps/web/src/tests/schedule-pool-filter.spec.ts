import { test, expect } from "@playwright/test";

/**
 * Schedule pool type filter (indoor / outdoor / all).
 * Client-side filter on /schedule — parity with map page control.
 */

test.describe("Schedule pool type filter", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/schedule");
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("schedule-pool-type-filter")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByTestId("schedule-swim-type-filter")).toBeVisible();
  });

  test("outdoor filter highlights and reduces visible facilities", async ({
    page,
  }) => {
    // Switch to list view on desktop so facility cards are visible
    const listBtn = page.getByRole("button", { name: /List View/i });
    if (await listBtn.isVisible()) {
      await listBtn.click();
    }

    await page.waitForTimeout(1500);

    const facilityCards = page.locator(
      '[class*="rounded-xl"][class*="border-gray"]'
    );
    const allCount = await facilityCards.count();

    await page.getByTestId("pool-type-outdoor").click();
    await expect(page.getByTestId("pool-type-outdoor")).toHaveClass(/bg-amber/);

    await page.waitForTimeout(500);

    const outdoorCount = await facilityCards.count();

    // Outdoor filter should show outdoor pool type badges
    const outdoorBadges = page.getByText("Outdoor", { exact: true });
    if ((await outdoorBadges.count()) > 0) {
      await expect(outdoorBadges.first()).toBeVisible();
    }

    // Filter should not increase result count
    if (allCount > 0) {
      expect(outdoorCount).toBeLessThanOrEqual(allCount);
    }
  });

  test("indoor filter highlights and indoor-only sites hide outdoor badges", async ({
    page,
  }) => {
    await page.getByTestId("pool-type-indoor").click();
    await expect(page.getByTestId("pool-type-indoor")).toHaveClass(/bg-primary/);

    // Pure outdoor-only badges should not appear when indoor filter is active
    const outdoorOnlyBadges = page.locator(
      'span:has-text("Outdoor"):not(:has-text("Indoor"))'
    );
    await expect(outdoorOnlyBadges).toHaveCount(0);
  });

  test("all filter restores full schedule", async ({ page }) => {
    await page.getByTestId("pool-type-outdoor").click();
    await page.waitForTimeout(300);

    const outdoorCount = await page
      .locator('[class*="rounded-xl"][class*="border-gray"]')
      .count();

    await page.getByTestId("pool-type-all").click();
    await expect(page.getByTestId("pool-type-all")).toHaveClass(/bg-primary/);
    await page.waitForTimeout(300);

    const allCount = await page
      .locator('[class*="rounded-xl"][class*="border-gray"]')
      .count();

    if (outdoorCount > 0) {
      expect(allCount).toBeGreaterThanOrEqual(outdoorCount);
    }
  });

  test("recreational swim type filter highlights chip", async ({ page }) => {
    await page.getByTestId("swim-type-recreational").click();
    await expect(page.getByTestId("swim-type-recreational")).toHaveClass(
      /bg-gradient|bg-primary/
    );
  });

  test("outdoor pool type auto-switches swim type to all", async ({
    page,
  }) => {
    await page.getByTestId("swim-type-lane_swim").click();
    await expect(page.getByTestId("swim-type-lane_swim")).toHaveClass(
      /bg-gradient|bg-primary/
    );

    await page.getByTestId("pool-type-outdoor").click();
    await expect(page.getByTestId("swim-type-all")).toHaveClass(
      /bg-gradient|bg-primary/
    );
  });
});
