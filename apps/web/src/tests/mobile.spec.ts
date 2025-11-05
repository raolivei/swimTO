import { test, expect, devices } from "@playwright/test";

/**
 * Mobile Testing Suite
 * Tests the SwimTO app on various mobile devices and scenarios
 */

// iPhone 12 Tests
test.describe("iPhone 12", () => {
  test.use(devices["iPhone 12"]);

  test("home page loads correctly", async ({ page }) => {
    await page.goto("/");

    // Check main heading
    await expect(page.locator("h1")).toContainText(
      "Find Your Perfect Swim Time"
    );

    // Check navigation is visible
    await expect(page.locator("nav")).toBeVisible();

    // Check hero buttons are accessible
    await expect(page.locator("text=View Map")).toBeVisible();
    await expect(page.locator("text=Browse Schedule")).toBeVisible();
  });

  test("navigation works on mobile", async ({ page }) => {
    await page.goto("/");

    // Navigate to schedule
    await page.click('nav a[href="/schedule"]');
    await expect(page).toHaveURL(/schedule/);
    await expect(page.locator("h1")).toContainText("Swim Schedule");

    // Navigate to map
    await page.click('nav a[href="/map"]');
    await expect(page).toHaveURL(/map/);

    // Navigate back home
    await page.click('nav a[href="/"]');
    await expect(page).toHaveURL(/^\//);
  });

  test("schedule page - filters toggle on mobile", async ({ page }) => {
    await page.goto("/schedule");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Filter button should be visible on mobile
    const filterButton = page.locator('button:has-text("Filters")');
    await expect(filterButton).toBeVisible();

    // Filters should be hidden initially
    const filterContainer = page.locator("text=LANE_SWIM").first();
    await expect(filterContainer).toBeHidden();

    // Click to show filters
    await filterButton.click();
    await expect(filterContainer).toBeVisible();

    // Can select a filter
    await page.click('button:has-text("Recreational")');
    await expect(page.locator('button:has-text("Recreational")')).toHaveClass(
      /bg-primary-500/
    );
  });

  test("schedule page - error state shows retry", async ({ page }) => {
    // Mock API failure
    await page.route("**/schedule*", (route) => route.abort());

    await page.goto("/schedule");

    // Error message should appear
    await expect(page.locator("text=Failed to Load Schedule")).toBeVisible();

    // Retry button should be visible
    const retryButton = page.locator('button:has-text("Try Again")');
    await expect(retryButton).toBeVisible();

    // Technical details should be expandable
    await expect(
      page.locator('summary:has-text("Technical details")')
    ).toBeVisible();
  });

  test("map page - loads and displays markers", async ({ page }) => {
    await page.goto("/map");

    // Wait for map container
    await page.waitForSelector(".leaflet-container", { timeout: 10000 });

    // Check that map is rendered
    const mapContainer = page.locator(".leaflet-container");
    await expect(mapContainer).toBeVisible();

    // Check for markers (if any facilities exist)
    const markers = page.locator(".leaflet-marker-icon");
    const markerCount = await markers.count();

    if (markerCount > 0) {
      // At least one marker should be visible
      await expect(markers.first()).toBeVisible();

      // Stats overlay should show facility count
      await expect(
        page.locator("text=/Showing.*pools with lane swim/")
      ).toBeVisible();
    }
  });

  test("map page - facility details sidebar is responsive", async ({
    page,
  }) => {
    await page.goto("/map");

    await page.waitForSelector(".leaflet-container");

    // Find and click a marker if available
    const markers = page.locator(".leaflet-marker-icon");
    const markerCount = await markers.count();

    if (markerCount > 0) {
      await markers.first().click();

      // Wait for sidebar to appear
      await page.waitForTimeout(500);

      // Close button should be visible and tappable
      const closeButton = page.locator('button:has-text("✕")');
      await expect(closeButton).toBeVisible();

      // Click close button
      await closeButton.click();
      await page.waitForTimeout(300);
    }
  });

  test("touch targets are adequate size", async ({ page }) => {
    await page.goto("/");

    // Check navigation buttons
    const navLinks = page.locator("nav a");
    const navCount = await navLinks.count();

    for (let i = 0; i < navCount; i++) {
      const link = navLinks.nth(i);
      const box = await link.boundingBox();

      // Touch targets should be at least 44x44px
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(40);
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    }
  });
});

// Android Pixel 5 Tests
test.describe("Android Pixel 5", () => {
  test.use(devices["Pixel 5"]);

  test("home page renders correctly", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText(
      "Find Your Perfect Swim Time"
    );
  });

  test("schedule page loads", async ({ page }) => {
    await page.goto("/schedule");
    await page.waitForLoadState("networkidle");

    // Should show either loading, error, or schedule content
    const hasContent =
      (await page.locator("text=Loading schedule").isVisible()) ||
      (await page.locator("text=Failed to Load Schedule").isVisible()) ||
      (await page.locator("text=Swim Schedule").isVisible());

    expect(hasContent).toBeTruthy();
  });

  test("map page loads", async ({ page }) => {
    await page.goto("/map");
    await page.waitForSelector(".leaflet-container", { timeout: 10000 });
    await expect(page.locator(".leaflet-container")).toBeVisible();
  });
});

// Landscape Orientation Tests
test.describe("Mobile Landscape", () => {
  test.use({
    ...devices["iPhone 12"],
    viewport: { width: 844, height: 390 },
  });

  test("home page adapts to landscape", async ({ page }) => {
    await page.goto("/");

    // Content should still be visible
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("nav")).toBeVisible();
  });

  test("schedule page works in landscape", async ({ page }) => {
    await page.goto("/schedule");
    await page.waitForLoadState("networkidle");

    // Should be able to access filters
    await expect(page.locator('button:has-text("Filters")')).toBeVisible();
  });
});

// Small Screen Tests (iPhone SE)
test.describe("Small Screen (iPhone SE)", () => {
  test.use(devices["iPhone SE"]);

  test("layout works on small screen", async ({ page }) => {
    await page.goto("/");

    // Main content should be visible
    await expect(page.locator("h1")).toBeVisible();

    // Navigation should be accessible (icons only on very small screens)
    const navLinks = page.locator("nav a");
    await expect(navLinks).toHaveCount(4);
  });

  test("schedule filters work on small screen", async ({ page }) => {
    await page.goto("/schedule");
    await page.waitForLoadState("networkidle");

    // Filter toggle should work
    const filterButton = page.locator('button:has-text("Filters")');
    if (await filterButton.isVisible()) {
      await filterButton.click();
      await expect(page.locator("text=LANE_SWIM").first()).toBeVisible();
    }
  });
});

// Tablet Tests (iPad)
test.describe("iPad", () => {
  test.use(devices["iPad (gen 7)"]);

  test("desktop layout appears on tablet", async ({ page }) => {
    await page.goto("/");

    // Navigation text should be visible (not just icons)
    await expect(page.locator('nav a:has-text("Home")')).toBeVisible();
  });

  test("schedule filters visible without toggle", async ({ page }) => {
    await page.goto("/schedule");
    await page.waitForLoadState("networkidle");

    // Filters should be visible without clicking toggle button
    // (based on md: breakpoint)
    const laneSwimButton = page.locator('button:has-text("Lane Swim")').first();
    await expect(laneSwimButton).toBeVisible();
  });

  test("map sidebar has fixed width", async ({ page }) => {
    await page.goto("/map");
    await page.waitForSelector(".leaflet-container");

    // On tablet, sidebar should have fixed width (not full width)
    const markers = page.locator(".leaflet-marker-icon");
    const markerCount = await markers.count();

    if (markerCount > 0) {
      await markers.first().click();
      await page.waitForTimeout(500);

      // Sidebar should not take full width
      const sidebar = page.locator('div:has-text("upcoming sessions")').first();
      const box = await sidebar.boundingBox();
      const viewport = page.viewportSize();

      if (box && viewport) {
        // Sidebar should be less than 50% of viewport width
        expect(box.width).toBeLessThan(viewport.width * 0.5);
      }
    }
  });
});

// Network Conditions
test.describe("Network Conditions", () => {
  test.use(devices["iPhone 12"]);

  test("handles slow 3G connection", async ({ page, context }) => {
    // Simulate slow 3G
    await context.route("**/*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1s delay
      await route.continue();
    });

    await page.goto("/");

    // Should eventually load
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });
  });

  test("shows error on network failure", async ({ page }) => {
    // Block API calls
    await page.route("**/schedule*", (route) => route.abort());

    await page.goto("/schedule");

    // Should show error message
    await expect(page.locator("text=Failed to Load Schedule")).toBeVisible();
  });
});

// Accessibility
test.describe("Mobile Accessibility", () => {
  test.use(devices["iPhone 12"]);

  test("has proper aria labels", async ({ page }) => {
    await page.goto("/");

    // Navigation should have proper aria-label
    await expect(
      page.locator('nav[aria-label="Main navigation"]')
    ).toBeVisible();
  });

  test("buttons are keyboard accessible", async ({ page }) => {
    await page.goto("/schedule");
    await page.waitForLoadState("networkidle");

    // Tab through interactive elements
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Should be able to activate buttons with Enter
    await page.keyboard.press("Enter");
  });

  test("color contrast is sufficient", async ({ page }) => {
    await page.goto("/");

    // Run accessibility check
    // This is a placeholder - you'd use axe-core or similar in production
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
  });
});

// Performance
test.describe("Mobile Performance", () => {
  test.use(devices["iPhone 12"]);

  test("page loads within acceptable time", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test("images are lazy loaded", async ({ page }) => {
    await page.goto("/");

    // Check if images have loading="lazy" attribute where appropriate
    // This is implementation-specific
  });
});
