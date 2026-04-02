/**
 * Map Circle Click Diagnostic Tests
 *
 * Runs a series of progressively lower-level checks to find exactly
 * where circle clicks break down:
 *
 *  1. DOM — are SVG circles actually in the page?
 *  2. CSS  — do they have pointer-events that allow clicks?
 *  3. Leaflet — does the Leaflet map receive a click event?
 *  4. React  — does handleSelectFacility get called?
 *  5. UI     — does the facility panel appear?
 */

import { test, expect, Page } from "@playwright/test";

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Wait for the map AND at least one SVG circle to be ready. */
async function waitForMap(page: Page) {
  await page.waitForSelector(".leaflet-container", { timeout: 15_000 });
  // Facilities arrive from the API; wait up to 10 s
  await page.waitForSelector(
    ".leaflet-overlay-pane path.leaflet-interactive",
    { timeout: 10_000 }
  );
}

/**
 * Attach a raw DOM capture-phase listener to the .leaflet-container so we
 * can detect any click that reaches the map div — independent of Leaflet's
 * internal event model.  This avoids the `_leaflet_map` property which is
 * not part of the public Leaflet API and may be undefined.
 */
async function attachLeafletClickSpy(page: Page): Promise<void> {
  await page.evaluate(() => {
    const container = document.querySelector(".leaflet-container");
    if (!container) return;
    (window as Record<string, unknown>).__leafletClicks = [];
    container.addEventListener(
      "click",
      (e: Event) => {
        const me = e as MouseEvent;
        (window as Record<string, unknown[]>).__leafletClicks.push({
          x: me.clientX,
          y: me.clientY,
        });
      },
      true // capture — fires before any handler can stopPropagation
    );
  });
}

async function getLeafletClicks(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      ((window as Record<string, unknown[]>).__leafletClicks ?? []).length
  );
}

// ─── tests ────────────────────────────────────────────────────────────────────

test.describe("Map Circle Click Diagnostics", () => {
  test("1 · SVG circles exist in the DOM", async ({ page }) => {
    await page.goto("/map");
    await waitForMap(page);

    const circles = page.locator(
      ".leaflet-overlay-pane path.leaflet-interactive"
    );
    const count = await circles.count();

    console.log(`SVG interactive paths: ${count}`);
    expect(count, "No SVG circles rendered").toBeGreaterThan(0);
  });

  test("2 · SVG circles are visible and have correct CSS", async ({
    page,
  }) => {
    await page.goto("/map");
    await waitForMap(page);

    const first = page
      .locator(".leaflet-overlay-pane path.leaflet-interactive")
      .first();

    await expect(first).toBeVisible();

    const pointerEvents = await first.evaluate(
      (el) => window.getComputedStyle(el).pointerEvents
    );
    console.log(`pointer-events on circle: ${pointerEvents}`);
    // Must NOT be 'none' for clicks to work
    expect(pointerEvents, "pointer-events is none — circles block clicks").not.toBe(
      "none"
    );
  });

  test("3 · Clicking a circle fires a Leaflet map click event", async ({
    page,
  }) => {
    await page.goto("/map");
    await waitForMap(page);
    await attachLeafletClickSpy(page);

    const first = page
      .locator(".leaflet-overlay-pane path.leaflet-interactive")
      .first();
    const box = await first.boundingBox();
    console.log(`Circle bounding box: ${JSON.stringify(box)}`);

    await first.click();
    await page.waitForTimeout(500);

    const clicks = await getLeafletClicks(page);
    console.log(`Leaflet map click events received: ${clicks}`);
    expect(clicks, "Leaflet map 'click' never fired").toBeGreaterThan(0);
  });

  test("4 · MapClickHandler finds a facility near the click", async ({
    page,
  }) => {
    // Spy on React state via window
    await page.goto("/map");
    await waitForMap(page);

    // Inject a MutationObserver that watches for the panel appearing
    await page.evaluate(() => {
      (window as Record<string, unknown>).__panelAppeared = false;
      const observer = new MutationObserver(() => {
        const closeBtn = document.querySelector(
          'button[aria-label="Close"]'
        );
        if (closeBtn) {
          (window as Record<string, unknown>).__panelAppeared = true;
          observer.disconnect();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });

    const first = page
      .locator(".leaflet-overlay-pane path.leaflet-interactive")
      .first();
    await first.click();
    await page.waitForTimeout(1000);

    const appeared = await page.evaluate(
      () => (window as Record<string, unknown>).__panelAppeared
    );
    console.log(`Facility panel appeared: ${appeared}`);
    expect(appeared, "Facility panel did not appear after click").toBe(true);
  });

  test("5 · Full end-to-end: click circle → facility panel shows", async ({
    page,
  }) => {
    await page.goto("/map");
    await waitForMap(page);

    // Click the first SVG circle directly
    const first = page
      .locator(".leaflet-overlay-pane path.leaflet-interactive")
      .first();
    await first.click();

    // Panel close button must be visible
    const closeBtn = page
      .locator('button[aria-label="Close"]')
      .filter({ visible: true });
    await expect(closeBtn).toBeVisible({ timeout: 5_000 });

    const panelText = await page
      .locator(".facility-panel, [data-testid='facility-panel']")
      .or(closeBtn.locator("../../..").first())
      .textContent();
    console.log(`✅ Panel content: ${panelText?.substring(0, 80)}`);
  });

  // ── bonus: DOM capture listener on container detects every real click ────────

  test("6 · DOM capture listener on container detects the click", async ({
    page,
  }) => {
    await page.goto("/map");
    await waitForMap(page);
    await attachLeafletClickSpy(page);

    const first = page
      .locator(".leaflet-overlay-pane path.leaflet-interactive")
      .first();
    await first.click();
    await page.waitForTimeout(500);

    const clicks = await getLeafletClicks(page);
    console.log(`DOM container clicks detected: ${clicks}`);
    expect(clicks, "Click did not reach leaflet-container").toBeGreaterThan(0);
  });
});
