import { test, expect } from "@playwright/test";

/**
 * Map panel regression tests (desktop + mobile).
 * Covers northern-marker panel visibility and outdoor pool filter.
 */

test.describe("Map facility panel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/map");
    await page.waitForSelector(".leaflet-container", { timeout: 20000 });
    await page.waitForSelector("path.leaflet-interactive", { timeout: 20000 });
  });

  test("desktop: panel stays visible after selecting a marker", async ({ page }) => {
    test.skip(
      (await page.viewportSize()?.width ?? 0) < 768,
      "Desktop-only panel positioning test"
    );

    const markers = page.locator("path.leaflet-interactive");
    const count = await markers.count();
    expect(count).toBeGreaterThan(0);

    // Click a marker in the upper portion of the map (northern pools)
    const mapBox = await page.locator(".leaflet-container").boundingBox();
    expect(mapBox).not.toBeNull();

    let clicked = false;
    for (let i = 0; i < Math.min(count, 12); i++) {
      const box = await markers.nth(i).boundingBox();
      if (!box || !mapBox) continue;
      const relY = (box.y + box.height / 2 - mapBox.y) / mapBox.height;
      if (relY < 0.45) {
        await markers.nth(i).click({ force: true });
        clicked = true;
        break;
      }
    }

    if (!clicked) {
      await markers.first().click({ force: true });
    }

    const panel = page.getByTestId("facility-panel");
    await expect(panel).toBeVisible({ timeout: 5000 });

    const panelBox = await panel.boundingBox();
    const containerBox = await page.locator(".leaflet-container").boundingBox();
    expect(panelBox).not.toBeNull();
    expect(containerBox).not.toBeNull();

    if (panelBox && containerBox) {
      expect(panelBox.y).toBeGreaterThanOrEqual(containerBox.y);
      expect(panelBox.y + panelBox.height).toBeLessThanOrEqual(
        containerBox.y + containerBox.height + 2
      );
      expect(panelBox.width).toBeGreaterThan(200);
    }
  });

  test("pool type filter requests outdoor from API", async ({ page }) => {
    let poolTypeParam = "";
    page.on("request", (req) => {
      if (req.url().includes("/facilities") && req.method() === "GET") {
        const url = new URL(req.url());
        const pt = url.searchParams.get("pool_type");
        if (pt) poolTypeParam = pt;
      }
    });

    const filter = page.getByTestId("map-pool-type-filter");
    await expect(filter).toBeVisible();

    await page.getByTestId("pool-type-outdoor").click();
    await page.waitForTimeout(2000);

    expect(poolTypeParam).toBe("outdoor");
    await expect(page.getByTestId("pool-type-outdoor")).toHaveClass(/bg-amber/);
  });
});
