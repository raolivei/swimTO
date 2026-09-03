import { test, expect } from "@playwright/test";

const MOCK_FACILITIES = [
  {
    facility_id: "mock-1",
    name: "North York Pool",
    address: "100 Mock St",
    postal_code: "M2N 1A1",
    district: "North York",
    latitude: 43.762,
    longitude: -79.413,
    is_indoor: true,
    has_indoor: true,
    has_outdoor: false,
    phone: null,
    website: null,
    is_free_entry: false,
    source: "toronto",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    facility_id: "mock-2",
    name: "Scarborough Pool",
    address: "200 Mock Ave",
    postal_code: "M1P 1B2",
    district: "Scarborough",
    latitude: 43.773,
    longitude: -79.258,
    is_indoor: false,
    has_indoor: false,
    has_outdoor: true,
    phone: null,
    website: null,
    is_free_entry: false,
    source: "toronto",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    facility_id: "mock-3",
    name: "Downtown Pool",
    address: "300 Mock Blvd",
    postal_code: "M5V 1C3",
    district: "Downtown",
    latitude: 43.645,
    longitude: -79.387,
    is_indoor: true,
    has_indoor: true,
    has_outdoor: true,
    phone: null,
    website: null,
    is_free_entry: true,
    source: "toronto",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
];

/**
 * Map panel regression tests (desktop + mobile).
 * Covers northern-marker panel visibility and outdoor pool filter.
 */

test.describe("Map facility panel", () => {
  test.beforeEach(async ({ page }) => {
    // Intercept /api/facilities so tests don't depend on the live production API.
    await page.route("**/facilities*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_FACILITIES),
      })
    );

    await page.goto("/map");
    await page.waitForSelector(".leaflet-container", { timeout: 20000 });
    // Leaflet renders ``path.leaflet-interactive`` elements with
    // ``d="M0 0"`` before the initial fitBounds completes. Playwright's
    // visibility check then fails (zero-size = not visible) and on a
    // narrow mobile viewport in CI the fitBounds animation can run
    // longer than 20s. Wait for the *first non-zero* path instead so
    // we're guarded against that race rather than racing against it.
    await page.waitForFunction(
      () =>
        Array.from(
          document.querySelectorAll<SVGPathElement>("path.leaflet-interactive")
        ).some((p) => {
          const d = p.getAttribute("d") || "";
          return d.length > 0 && d !== "M0 0";
        }),
      undefined,
      { timeout: 30000 }
    );
  });

  test("desktop: panel stays visible after selecting a marker", async ({ page }) => {
    test.skip(
      (await page.viewportSize()?.width ?? 0) < 768,
      "Desktop-only panel positioning test"
    );

    const markers = page.locator(
      'path.leaflet-interactive:not([d="M0 0"])'
    );
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

    const panel = page.getByTestId("facility-panel-desktop");
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

  test("mobile: panel visible after selecting a marker", async ({ page }) => {
    test.skip(
      (await page.viewportSize()?.width ?? 0) >= 768,
      "Mobile-only panel test"
    );

    const markers = page.locator(
      'path.leaflet-interactive:not([d="M0 0"])'
    );
    const count = await markers.count();
    expect(count).toBeGreaterThan(0);

    const mapBox = await page.locator(".leaflet-container").boundingBox();
    expect(mapBox).not.toBeNull();

    // Avoid the top search bar and bottom-left filter stack — ``first()``
    // often lands under those overlays on narrow viewports.
    let clicked = false;
    for (let i = 0; i < Math.min(count, 24); i++) {
      const box = await markers.nth(i).boundingBox();
      if (!box || !mapBox) continue;
      const relY = (box.y + box.height / 2 - mapBox.y) / mapBox.height;
      const relX = (box.x + box.width / 2 - mapBox.x) / mapBox.width;
      if (relY > 0.28 && relY < 0.62 && relX > 0.12 && relX < 0.88) {
        await markers.nth(i).click({ force: true });
        clicked = true;
        break;
      }
    }

    if (!clicked) {
      await markers.nth(Math.floor(count / 2)).click({ force: true });
    }

    const panel = page.getByTestId("facility-panel-mobile");
    await expect(panel).toBeVisible({ timeout: 10000 });
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

  test("swim type filter requests recreational from API", async ({ page }) => {
    let swimTypeParam = "";
    page.on("request", (req) => {
      if (req.url().includes("/facilities") && req.method() === "GET") {
        const url = new URL(req.url());
        const st = url.searchParams.get("swim_type");
        if (st) swimTypeParam = st;
      }
    });

    const filter = page.getByTestId("map-swim-type-filter");
    await expect(filter).toBeVisible();

    await page.getByTestId("swim-type-recreational").click();
    await page.waitForTimeout(2000);

    expect(swimTypeParam).toBe("RECREATIONAL");
  });
});
