import { defineConfig, devices } from "@playwright/test";
import baseConfig from "./playwright.config";

/**
 * Fast CI subset: desktop Chrome + one mobile profile.
 * Timeout is higher than base to give beforeEach (waitForSelector + waitForFunction) enough budget.
 */
export default defineConfig({
  ...baseConfig,
  timeout: 60 * 1000,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 5"] },
    },
  ],
});
