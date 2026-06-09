import { defineConfig, devices } from "@playwright/test";
import baseConfig from "./playwright.config";

/**
 * Fast CI subset: desktop Chrome + one mobile profile.
 */
export default defineConfig({
  ...baseConfig,
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
