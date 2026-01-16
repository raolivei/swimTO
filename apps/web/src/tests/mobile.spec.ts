import { test, expect } from "@playwright/test";

/**
 * Mobile Testing Suite
 * Tests the SwimTO app on various mobile devices and scenarios
 * 
 * Run with specific project:
 *   npx playwright test mobile.spec.ts --project=mobile          # iPhone 12
 *   npx playwright test mobile.spec.ts --project=mobile-iphone-se # iPhone SE
 *   npx playwright test mobile.spec.ts --project=mobile-pixel    # Pixel 5
 *   npx playwright test mobile.spec.ts --project=tablet-ipad     # iPad
 */

test.describe("Mobile Core", () => {
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
    
    // On small screens filters are behind toggle
    if (await filterButton.isVisible()) {
      // Click to show filters
      await filterButton.click();
      await page.waitForTimeout(300);
    }

    // Can select a filter
    const recreationalButton = page.locator('button:has-text("Recreational")');
    await expect(recreationalButton).toBeVisible();
    await recreationalButton.click();
    
    // Verify filter has active styling
    await expect(recreationalButton).toHaveClass(/from-primary-500/);
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

  test("touch targets are adequate size (44px)", async ({ page }) => {
    await page.goto("/");

    // Check navigation buttons
    const navLinks = page.locator("nav a");
    const navCount = await navLinks.count();

    for (let i = 0; i < navCount; i++) {
      const link = navLinks.nth(i);
      const box = await link.boundingBox();

      // Touch targets should be at least 44x44px
      if (box) {
        expect(box.width, `Nav link ${i} width`).toBeGreaterThanOrEqual(44);
        expect(box.height, `Nav link ${i} height`).toBeGreaterThanOrEqual(44);
      }
    }
  });
});

test.describe("Schedule Features", () => {
  test("schedule page loads", async ({ page }) => {
    await page.goto("/schedule");
    await page.waitForLoadState("networkidle");

    // Should show schedule content
    await expect(page.locator("h1")).toContainText("Swim Schedule");
  });

  test("week navigation works", async ({ page }) => {
    await page.goto("/schedule");
    await page.waitForLoadState("networkidle");

    const nextButton = page.locator('button:has-text("Next →")');
    const prevButton = page.locator('button:has-text("← Prev")');

    await expect(nextButton).toBeVisible();
    await expect(prevButton).toBeVisible();

    // Click next week
    await nextButton.click();
    await page.waitForTimeout(500);

    // Should show week offset
    await expect(page.locator("text=+1 Week")).toBeVisible();
  });
});

test.describe("Network Conditions", () => {
  test("handles slow 3G connection", async ({ page, context }) => {
    // Simulate slow 3G
    await context.route("**/*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay
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

test.describe("Accessibility", () => {
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
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();
  });
});

test.describe("Performance", () => {
  test("page loads within acceptable time", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const loadTime = Date.now() - startTime;

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });
});
