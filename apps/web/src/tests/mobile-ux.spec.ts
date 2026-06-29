import { test, expect } from "@playwright/test";

/**
 * Mobile UX Tests
 *
 * These tests verify mobile-specific UX requirements:
 * - No unwanted horizontal scroll
 * - Proper tap target sizes (44px minimum - WCAG)
 * - Button alignment and spacing
 * - Panel/card layout
 *
 * Run with: npx playwright test mobile-ux.spec.ts --project=mobile
 *
 * Related: GitHub Issue #65
 */

test.describe("Mobile UX - Horizontal Scroll", () => {
  test("home page should not have horizontal scroll", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    expect(hasHorizontalScroll).toBe(false);
  });

  test("schedule page should not have horizontal scroll", async ({ page }) => {
    await page.goto("/schedule");
    await page.waitForLoadState("networkidle");

    const scrollInfo = await page.evaluate(() => {
      const docWidth = document.documentElement.scrollWidth;
      const viewWidth = window.innerWidth;
      const hasScroll = docWidth > viewWidth;
      
      // Find overflowing elements for debugging
      const overflowing: string[] = [];
      if (hasScroll) {
        document.querySelectorAll("*").forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.right > viewWidth + 5) { // 5px tolerance
            const classList = el.className?.toString?.() || '';
            overflowing.push(
              `${el.tagName}[${classList.slice(0, 50)}] right=${rect.right.toFixed(0)}px`
            );
          }
        });
      }
      
      return { hasScroll, docWidth, viewWidth, overflowing: overflowing.slice(0, 5) };
    });

    if (scrollInfo.hasScroll) {
      console.log("Horizontal scroll detected!");
      console.log(`Document width: ${scrollInfo.docWidth}px, Viewport: ${scrollInfo.viewWidth}px`);
      console.log("Overflowing elements:", scrollInfo.overflowing);
    }

    expect(scrollInfo.hasScroll).toBe(false);
  });

  test("map page should not have horizontal scroll", async ({ page }) => {
    await page.goto("/map");
    await page.waitForSelector(".leaflet-container", { timeout: 10000 });

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    expect(hasHorizontalScroll).toBe(false);
  });

  test("about page should not have horizontal scroll", async ({ page }) => {
    await page.goto("/about");
    await page.waitForLoadState("networkidle");

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    expect(hasHorizontalScroll).toBe(false);
  });
});

test.describe("Mobile UX - Tap Targets (44px minimum)", () => {
  test("navigation buttons meet tap target requirements", async ({ page }) => {
    await page.goto("/");

    const navLinks = page.locator("nav a");
    const count = await navLinks.count();

    const failures: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i);
      const box = await link.boundingBox();

      if (box) {
        if (box.height < 44) {
          failures.push(`Nav link ${i} height=${box.height}px (need 44px)`);
        }
        if (box.width < 44) {
          failures.push(`Nav link ${i} width=${box.width}px (need 44px)`);
        }
      }
    }

    expect(failures, `Tap target violations: ${failures.join(", ")}`).toHaveLength(0);
  });

  test("schedule filter buttons meet tap target requirements", async ({ page }) => {
    await page.goto("/schedule");
    await page.waitForLoadState("networkidle");

    // Open filters on mobile if needed
    const filterToggle = page.locator('button:has-text("Filters")');
    if (await filterToggle.isVisible()) {
      await filterToggle.click();
      await page.waitForTimeout(300);
    }

    // Check swim type filter buttons
    const filterButtons = page.locator(
      'button:has-text("All Types"), button:has-text("Lane Swim"), button:has-text("Recreational"), button:has-text("Adult"), button:has-text("Senior")'
    );
    const count = await filterButtons.count();
    const failures: string[] = [];

    for (let i = 0; i < count; i++) {
      const button = filterButtons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        const text = await button.textContent();
        if (box && box.height < 44) {
          failures.push(`"${text}" height=${box.height.toFixed(0)}px`);
        }
      }
    }

    expect(failures, `Filter button tap target violations: ${failures.join(", ")}`).toHaveLength(0);
  });

  test("week navigation buttons meet tap target requirements", async ({ page }) => {
    await page.goto("/schedule");
    await page.waitForLoadState("networkidle");

    const prevButton = page.locator('button:has-text("← Prev")');
    const nextButton = page.locator('button:has-text("Next →")');
    const failures: string[] = [];

    for (const [name, button] of [["Prev", prevButton], ["Next", nextButton]] as const) {
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          if (box.height < 44) failures.push(`${name} height=${box.height.toFixed(0)}px`);
          if (box.width < 44) failures.push(`${name} width=${box.width.toFixed(0)}px`);
        }
      }
    }

    expect(failures, `Week nav tap target violations: ${failures.join(", ")}`).toHaveLength(0);
  });

  test("dark mode toggle meets tap target requirements", async ({ page }) => {
    await page.goto("/");

    const darkModeButton = page.locator('button[aria-label*="mode"]');
    const box = await darkModeButton.boundingBox();

    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeGreaterThanOrEqual(44);
  });
});

test.describe("Mobile UX - Button Alignment", () => {
  test("header buttons should be vertically centered", async ({ page }) => {
    await page.goto("/");

    const header = page.locator("header");
    const headerBox = await header.boundingBox();

    const navLinks = page.locator("nav a");
    const count = await navLinks.count();

    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i);
      const linkBox = await link.boundingBox();

      if (headerBox && linkBox) {
        const headerCenter = headerBox.y + headerBox.height / 2;
        const linkCenter = linkBox.y + linkBox.height / 2;
        const verticalOffset = Math.abs(headerCenter - linkCenter);

        expect(verticalOffset, `Nav link ${i} should be vertically centered`).toBeLessThan(20);
      }
    }
  });

  test("filter chips should be horizontally aligned", async ({ page }) => {
    await page.goto("/schedule");
    await page.waitForLoadState("networkidle");

    // Open filters on mobile
    const filterToggle = page.locator('button:has-text("Filters")');
    if (await filterToggle.isVisible()) {
      await filterToggle.click();
      await page.waitForTimeout(300);
    }

    const filterButtons = page.locator(
      'button:has-text("All Types"), button:has-text("Lane Swim")'
    );
    const count = await filterButtons.count();

    if (count >= 2) {
      const box1 = await filterButtons.nth(0).boundingBox();
      const box2 = await filterButtons.nth(1).boundingBox();

      if (box1 && box2) {
        // Buttons should be on the same row
        const yDiff = Math.abs(box1.y - box2.y);
        expect(yDiff, "Filter buttons should be on same row").toBeLessThan(5);
      }
    }
  });
});

test.describe("Mobile UX - Panel Layout", () => {
  test("session cards should fit within viewport width", async ({ page }) => {
    await page.goto("/schedule");
    await page.waitForLoadState("networkidle");

    const viewportWidth = page.viewportSize()?.width || 390;

    // Check main container width
    const mainContainer = page.locator("main > div").first();
    const mainBox = await mainContainer.boundingBox();
    
    if (mainBox) {
      expect(mainBox.width, "Main container should fit viewport").toBeLessThanOrEqual(viewportWidth + 1);
    }
  });

  test("filter container should have proper edge margins", async ({ page }) => {
    await page.goto("/schedule");
    await page.waitForLoadState("networkidle");

    const filterContainer = page.locator('[class*="rounded-2xl"][class*="shadow-lg"]').first();
    const box = await filterContainer.boundingBox();
    const viewportWidth = page.viewportSize()?.width || 390;

    if (box) {
      // Should have at least 8px margin from edges
      expect(box.x, "Left margin should exist").toBeGreaterThanOrEqual(8);
      expect(viewportWidth - (box.x + box.width), "Right margin should exist").toBeGreaterThanOrEqual(8);
    }
  });
});

test.describe("Mobile UX - Filter Chip Scroll", () => {
  test("filter chips container should scroll, not the page", async ({ page }) => {
    await page.goto("/schedule");
    await page.waitForLoadState("networkidle");

    // Open filters on mobile
    const filterToggle = page.locator('button:has-text("Filters")');
    if (await filterToggle.isVisible()) {
      await filterToggle.click();
      await page.waitForTimeout(300);
    }

    // Page should not have horizontal scroll even with filter chips
    const hasPageScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    expect(hasPageScroll, "Page should not have horizontal scroll").toBe(false);
  });
});

test.describe("Mobile UX - Session Times Visibility", () => {
  test("session times should be visible and prominent in list view", async ({ page }) => {
    await page.goto("/schedule");
    await page.waitForLoadState("networkidle");

    // Wait for sessions to load (may take a moment)
    await page.waitForTimeout(2000);

    // Look for time format patterns (e.g., "7:00 AM - 8:30 AM" or "12:00 PM - 1:00 PM")
    const timePattern = /\d{1,2}:\d{2}\s*(AM|PM)\s*-\s*\d{1,2}:\d{2}\s*(AM|PM)/i;
    
    // Find elements containing time patterns
    const timeElements = page.locator('div').filter({ hasText: timePattern });
    const count = await timeElements.count();

    // Should have at least one visible time if there are sessions
    if (count > 0) {
      const firstTime = timeElements.first();
      await expect(firstTime).toBeVisible();
      
      // Time should be reasonably sized (at least 16px font)
      const fontSize = await firstTime.evaluate((el) => {
        return parseFloat(window.getComputedStyle(el).fontSize);
      });
      expect(fontSize, "Time font size should be at least 16px").toBeGreaterThanOrEqual(16);
      
      console.log(`✓ Found ${count} session times, font-size: ${fontSize}px`);
    } else {
      // If no sessions, that's okay - just log it
      console.log("No sessions found to verify times");
    }
  });

  test("session cards should show times within facility groups", async ({ page }) => {
    await page.goto("/schedule");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Facility-grouped cards in list view
    const facilityCards = page.locator(
      '[class*="rounded-xl"][class*="border-gray"]'
    );
    const cardCount = await facilityCards.count();

    if (cardCount > 0) {
      const firstCard = facilityCards.first();

      // Get the text content of the card
      const cardText = await firstCard.textContent();

      // Time pattern should appear in the card
      const timePattern = /\d{1,2}:\d{2}\s*(AM|PM)/i;
      expect(cardText).toMatch(timePattern);

      console.log(`✓ Facility card contains time information`);
    }
  });
});
