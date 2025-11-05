import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright Mobile Testing Configuration for SwimTO
 *
 * This configuration is specifically for testing mobile scenarios including:
 * - Real device connectivity (network IP vs localhost)
 * - Mobile viewport rendering
 * - Touch interactions
 * - API connectivity issues
 *
 * Usage:
 *   # Test on localhost (development)
 *   npx playwright test --config=playwright.config.mobile.ts
 *
 *   # Test on network IP (real mobile device simulation)
 *   TEST_BASE_URL=http://192.168.2.48:5173 API_BASE_URL=http://192.168.2.48:8000 npx playwright test --config=playwright.config.mobile.ts
 */

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:5173";
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";

console.log(`\n🧪 Mobile Test Configuration:`);
console.log(`   Base URL: ${BASE_URL}`);
console.log(`   API URL:  ${API_BASE_URL}\n`);

export default defineConfig({
  testDir: "./src/tests",
  testMatch: "**/mobile-*.spec.ts",

  // Mobile tests might need more time for network requests
  timeout: 45 * 1000,

  // Run tests in parallel across devices
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,

  // Retry failed tests
  retries: process.env.CI ? 2 : 1,

  // Workers
  workers: process.env.CI ? 1 : 2,

  // Reporter
  reporter: [
    ["html", { outputFolder: "playwright-report-mobile" }],
    ["list"],
    ["json", { outputFile: "playwright-report-mobile/results.json" }],
  ],

  // Shared settings
  use: {
    baseURL: BASE_URL,

    // Collect trace always for mobile debugging
    trace: "on",

    // Screenshot on failure
    screenshot: "only-on-failure",

    // Video for all tests (helpful for mobile debugging)
    video: "retain-on-failure",

    // Network activity logging
    extraHTTPHeaders: {
      "X-Test-Type": "mobile-automated",
    },
  },

  // Test environment variables
  env: {
    API_BASE_URL,
    TEST_BASE_URL: BASE_URL,
  },

  // Mobile device projects
  projects: [
    {
      name: "iPhone 14 Pro",
      use: {
        ...devices["iPhone 14 Pro"],
        // Enable geolocation for testing location features
        permissions: ["geolocation"],
        geolocation: { latitude: 43.6532, longitude: -79.3832 }, // Toronto coordinates
      },
    },
    {
      name: "iPhone SE - small screen",
      use: {
        ...devices["iPhone SE"],
        permissions: ["geolocation"],
        geolocation: { latitude: 43.6532, longitude: -79.3832 },
      },
    },
    {
      name: "Samsung Galaxy S21",
      use: {
        ...devices["Galaxy S9+"],
        permissions: ["geolocation"],
        geolocation: { latitude: 43.6532, longitude: -79.3832 },
      },
    },
    {
      name: "iPad Air",
      use: {
        ...devices["iPad (gen 7)"],
        permissions: ["geolocation"],
        geolocation: { latitude: 43.6532, longitude: -79.3832 },
      },
    },
    {
      name: "Mobile Landscape",
      use: {
        ...devices["iPhone 14 Pro"],
        viewport: { width: 932, height: 430 },
        permissions: ["geolocation"],
        geolocation: { latitude: 43.6532, longitude: -79.3832 },
      },
    },
  ],

  // For network testing, don't start a local server
  // For localhost testing, start the dev server
  webServer: process.env.TEST_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:5173",
        reuseExistingServer: true,
        timeout: 120 * 1000,
      },
});
