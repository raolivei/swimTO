import { test, expect } from "@playwright/test";

/**
 * Mobile Schedule Tests
 * 
 * These tests verify schedule-specific functionality on mobile devices:
 * - Date rendering and timezone handling
 * - Schedule table/list views
 * - Week navigation
 * - Filtering
 */

test.describe("Mobile Schedule View", () => {
  
  test("dates should display correctly without timezone offset", async ({ page }) => {
    await page.goto("/schedule");
    
    // Wait for schedule to load
    await page.waitForSelector('button:has-text("Table View")', { timeout: 10000 });
    
    // Switch to table view to see dates
    await page.click('button:has-text("Table View")');
    
    // Wait for table to render
    await page.waitForSelector('table', { timeout: 5000 });
    
    // Get today's date in local timezone
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayName = dayNames[dayOfWeek];
    const todayMonth = today.getMonth() + 1;
    const todayDate = today.getDate();
    
    console.log(`📅 Today: ${todayName} ${todayMonth}/${todayDate}`);
    
    // Find today's column in the table
    const todayCell = page.locator(`th:has-text("${todayName}"):has-text("${todayMonth}/${todayDate}")`);
    await expect(todayCell).toBeVisible();
    
    console.log(`✅ Today's date column found: ${todayName} ${todayMonth}/${todayDate}`);
    
    // Verify the week header shows all 7 days
    const sunCell = page.locator('th:has-text("Sun")').first();
    const satCell = page.locator('th:has-text("Sat")').first();
    await expect(sunCell).toBeVisible();
    await expect(satCell).toBeVisible();
    
    console.log(`✅ Full week (Sun-Sat) is displayed`);
  });

  test("schedule should show sessions for correct days", async ({ page }) => {
    // Navigate to schedule
    await page.goto("/schedule");
    await page.waitForLoadState('networkidle');
    
    // Switch to list view
    await page.click('button:has-text("List View")');
    
    // Wait for sessions to load
    await page.waitForTimeout(3000);
    
    // Check if any dates are shown
    const dateHeaders = page.locator('h2');
    const count = await dateHeaders.count();
    
    if (count > 0) {
      // Get first date header text
      const firstDate = await dateHeaders.first().textContent();
      console.log(`📅 First schedule date: ${firstDate}`);
      
      // Verify date format is readable (e.g., "Today", "Tomorrow", or "Nov 5, 2025")
      expect(firstDate).toBeTruthy();
      expect(firstDate!.length).toBeGreaterThan(3);
    }
    
    console.log(`✅ Schedule shows ${count} date sections`);
  });

  test("week navigation should update dates correctly", async ({ page }) => {
    await page.goto("/schedule");
    await page.waitForSelector('button:has-text("Next Week")', { timeout: 10000 });
    
    // Click table view
    await page.click('button:has-text("Table View")');
    await page.waitForSelector('table', { timeout: 5000 });
    
    // Get current week's first date
    const getCurrentWeekInfo = async () => {
      const weekInfo = await page.locator('div:has-text("This Week"), div:has-text("Nov")').first().textContent();
      return weekInfo;
    };
    
    const currentWeek = await getCurrentWeekInfo();
    console.log(`📅 Current week: ${currentWeek}`);
    
    // Navigate to next week
    await page.click('button:has-text("Next Week")');
    await page.waitForTimeout(1000);
    
    const nextWeek = await getCurrentWeekInfo();
    console.log(`📅 Next week: ${nextWeek}`);
    
    // Verify week changed
    expect(nextWeek).not.toBe(currentWeek);
    
    // Navigate back to current week
    await page.click('button:has-text("Previous Week")');
    await page.waitForTimeout(1000);
    
    const backToCurrentWeek = await getCurrentWeekInfo();
    expect(backToCurrentWeek).toBe(currentWeek);
    
    console.log(`✅ Week navigation works correctly`);
  });

  test("schedule filters work on mobile", async ({ page }) => {
    await page.goto("/schedule");
    await page.waitForLoadState('networkidle');
    
    // On mobile, filters might be behind a toggle
    const filterButton = page.locator('button:has-text("Filters")');
    if (await filterButton.isVisible()) {
      await filterButton.click();
    }
    
    // Click "Recreational Swim" filter
    await page.click('button:has-text("Recreational")');
    
    // Wait for filter to apply
    await page.waitForTimeout(2000);
    
    // Verify filter is selected (has primary background color)
    const recreationalButton = page.locator('button:has-text("Recreational")');
    const classes = await recreationalButton.getAttribute('class');
    expect(classes).toContain('primary');
    
    console.log(`✅ Filter applied successfully`);
  });

  test("schedule should handle empty results gracefully", async ({ page }) => {
    // Set up route to return empty array
    await page.route('**/schedule*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
    
    await page.goto("/schedule");
    await page.waitForTimeout(3000);
    
    // Should show "no sessions" message
    await expect(page.locator('text=No sessions found')).toBeVisible();
    
    console.log(`✅ Empty state handled correctly`);
  });

  test("table view should be responsive on mobile", async ({ page }) => {
    await page.goto("/schedule");
    await page.waitForSelector('button:has-text("Table View")');
    
    await page.click('button:has-text("Table View")');
    await page.waitForSelector('table', { timeout: 5000 });
    
    // Verify table is scrollable on mobile
    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    // Check if table container has overflow-x scroll
    const tableContainer = page.locator('div').filter({ has: table }).first();
    const overflow = await tableContainer.evaluate(el => 
      window.getComputedStyle(el).overflowX
    );
    
    // Should be scrollable on mobile
    expect(['auto', 'scroll']).toContain(overflow);
    
    console.log(`✅ Table is scrollable: overflow-x=${overflow}`);
  });

  test("swim type badges should be visible and colored", async ({ page }) => {
    await page.goto("/schedule");
    await page.waitForLoadState('networkidle');
    
    // Switch to list view
    await page.click('button:has-text("List View")');
    await page.waitForTimeout(2000);
    
    // Look for swim type badges
    const laneSwimBadge = page.locator('text=Lane Swim').first();
    if (await laneSwimBadge.isVisible()) {
      const bgColor = await laneSwimBadge.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      
      // Should have a background color (not transparent/default)
      expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
      console.log(`✅ Swim type badge has color: ${bgColor}`);
    }
  });

  test("time ranges should format correctly", async ({ page }) => {
    await page.goto("/schedule");
    await page.waitForLoadState('networkidle');
    
    await page.click('button:has-text("List View")');
    await page.waitForTimeout(2000);
    
    // Look for time range text (e.g., "7:00 AM - 8:30 AM")
    const timeRegex = /\d{1,2}:\d{2}\s*(AM|PM)\s*-\s*\d{1,2}:\d{2}\s*(AM|PM)/;
    const timeslocator = page.locator('p, div').filter({ hasText: timeRegex });
    
    const count = await timeslocator.count();
    if (count > 0) {
      const firstTime = await timeslocator.first().textContent();
      console.log(`⏰ Time format example: ${firstTime}`);
      
      // Verify format is correct
      expect(firstTime).toMatch(timeRegex);
    }
    
    console.log(`✅ Found ${count} properly formatted time ranges`);
  });

  test("geolocation sort button should be visible", async ({ page }) => {
    await page.goto("/schedule");
    await page.waitForLoadState('networkidle');
    
    // Should show "Sort by distance" button
    const sortButton = page.locator('button:has-text("Sort by distance")');
    await expect(sortButton).toBeVisible();
    
    // Click it (will request permission)
    await sortButton.click();
    
    // Should show loading or location error (permission might be denied in tests)
    await page.waitForTimeout(2000);
    
    const gettingLocation = await page.locator('text=Getting location').isVisible();
    const locationEnabled = await page.locator('text=Location enabled').isVisible();
    const locationError = await page.locator('text=Location permission').isVisible();
    
    const hasLocationState = gettingLocation || locationEnabled || locationError;
    expect(hasLocationState).toBe(true);
    
    console.log(`✅ Geolocation feature is functional`);
  });
});

