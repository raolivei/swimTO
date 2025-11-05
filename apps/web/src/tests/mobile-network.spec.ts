import { test, expect } from "@playwright/test";

/**
 * Mobile Network Connectivity Tests
 * 
 * These tests verify that the app works correctly on mobile devices
 * with real network conditions, including:
 * - API connectivity using network IP (not localhost)
 * - Proper error handling for network failures
 * - API URL configuration
 * - CORS handling
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

test.describe("Mobile Network Connectivity", () => {
  
  test("should use correct API URL (not localhost on network)", async ({ page }) => {
    // Intercept API calls to verify they're going to the right place
    const apiCalls: string[] = [];
    
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/facilities') || url.includes('/schedule')) {
        apiCalls.push(url);
        console.log(`📡 API Request: ${url}`);
      }
    });
    
    await page.goto("/map");
    
    // Wait for facilities to load
    await page.waitForTimeout(3000);
    
    // Verify API calls were made
    expect(apiCalls.length).toBeGreaterThan(0);
    
    // If we're testing on network IP, verify NO calls go to localhost
    if (API_BASE_URL.includes('192.168') || API_BASE_URL.includes('10.')) {
      const localhostCalls = apiCalls.filter(url => url.includes('localhost'));
      expect(localhostCalls.length).toBe(0);
      console.log(`✅ All API calls use network IP (no localhost calls)`);
    }
    
    // Verify calls go to expected API base
    const correctApiCalls = apiCalls.filter(url => url.startsWith(API_BASE_URL));
    expect(correctApiCalls.length).toBeGreaterThan(0);
    console.log(`✅ ${correctApiCalls.length} API calls to correct base URL`);
  });

  test("facilities endpoint should be accessible", async ({ page }) => {
    let facilitiesLoaded = false;
    let apiError: string | null = null;
    
    // Monitor API responses
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/facilities')) {
        console.log(`📥 Facilities Response: ${response.status()} ${url}`);
        if (response.status() === 200) {
          facilitiesLoaded = true;
        } else {
          apiError = `HTTP ${response.status()}`;
        }
      }
    });
    
    // Monitor console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`🔴 Console Error: ${msg.text()}`);
      }
    });
    
    await page.goto("/map");
    
    // Wait for API call
    await page.waitForTimeout(5000);
    
    if (!facilitiesLoaded) {
      // Check if error message is displayed
      const errorVisible = await page.locator('text=Failed to Load').isVisible();
      if (errorVisible) {
        console.error(`❌ Facilities failed to load. API Error: ${apiError}`);
        
        // Take screenshot for debugging
        await page.screenshot({ path: 'facilities-error.png', fullPage: true });
      }
    }
    
    expect(facilitiesLoaded).toBe(true);
  });

  test("schedule endpoint should be accessible", async ({ page }) => {
    let scheduleLoaded = false;
    let apiError: string | null = null;
    
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/schedule')) {
        console.log(`📥 Schedule Response: ${response.status()} ${url}`);
        if (response.status() === 200) {
          scheduleLoaded = true;
        } else {
          apiError = `HTTP ${response.status()}`;
        }
      }
    });
    
    await page.goto("/schedule");
    await page.waitForTimeout(5000);
    
    if (!scheduleLoaded) {
      const errorVisible = await page.locator('text=Failed to Load').isVisible();
      if (errorVisible) {
        console.error(`❌ Schedule failed to load. API Error: ${apiError}`);
        await page.screenshot({ path: 'schedule-error.png', fullPage: true });
      }
    }
    
    expect(scheduleLoaded).toBe(true);
  });

  test("should handle API timeout gracefully", async ({ page }) => {
    // Simulate slow network
    await page.route('**/facilities*', route => {
      setTimeout(() => route.continue(), 10000); // 10 second delay
    });
    
    await page.goto("/map");
    
    // Should show loading state
    const loading = page.locator('text=Loading');
    await expect(loading).toBeVisible({ timeout: 2000 });
    
    // After timeout, should show error or eventually load
    await page.waitForTimeout(3000);
  });

  test("should handle API failure gracefully", async ({ page }) => {
    // Simulate API failure
    await page.route('**/facilities*', route => route.abort());
    
    await page.goto("/map");
    
    // Should show error message
    await expect(page.locator('text=Failed to Load')).toBeVisible({ timeout: 10000 });
    
    // Should show retry button
    await expect(page.locator('button:has-text("Try Again")')).toBeVisible();
    
    // Should show technical details
    await expect(page.locator('summary:has-text("Technical details")')).toBeVisible();
  });

  test("health endpoint should be accessible", async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/health`);
    
    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.status).toBe('healthy');
    expect(data.version).toBeDefined();
    
    console.log(`✅ Health check passed: ${data.version}`);
  });

  test("facilities API returns valid data", async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/facilities/?limit=5`);
    
    expect(response.ok()).toBe(true);
    
    const facilities = await response.json();
    expect(Array.isArray(facilities)).toBe(true);
    expect(facilities.length).toBeGreaterThan(0);
    
    // Verify facility structure
    const facility = facilities[0];
    expect(facility).toHaveProperty('facility_id');
    expect(facility).toHaveProperty('name');
    expect(facility).toHaveProperty('latitude');
    expect(facility).toHaveProperty('longitude');
    
    console.log(`✅ Facilities API returned ${facilities.length} facilities`);
  });

  test("schedule API returns valid data", async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/schedule/?limit=5&swim_type=LANE_SWIM`);
    
    expect(response.ok()).toBe(true);
    
    const sessions = await response.json();
    expect(Array.isArray(sessions)).toBe(true);
    expect(sessions.length).toBeGreaterThan(0);
    
    // Verify session structure
    const session = sessions[0];
    expect(session).toHaveProperty('date');
    expect(session).toHaveProperty('start_time');
    expect(session).toHaveProperty('end_time');
    expect(session).toHaveProperty('swim_type');
    expect(session).toHaveProperty('facility');
    
    console.log(`✅ Schedule API returned ${sessions.length} sessions`);
  });

  test("CORS headers should be properly configured", async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/health`, {
      headers: {
        'Origin': 'http://192.168.2.48:5173',
      },
    });
    
    expect(response.ok()).toBe(true);
    
    // Check CORS headers
    const headers = response.headers();
    console.log(`CORS Headers:`, headers);
    
    // Verify CORS is enabled
    expect(headers['access-control-allow-origin']).toBeDefined();
  });
});

