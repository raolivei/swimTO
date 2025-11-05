import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for SwimTO
 * Includes mobile and desktop device testing
 */
export default defineConfig({
  testDir: './src/tests',
  testMatch: '**/*.spec.ts',
  
  // Maximum time one test can run
  timeout: 30 * 1000,
  
  // Run tests in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: [
    ['html'],
    ['list'],
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for the app
    baseURL: 'http://localhost:5173',
    
    // Collect trace when retrying failed test
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers and devices
  projects: [
    // Mobile browsers
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 12'],
      },
    },
    {
      name: 'mobile-iphone-se',
      use: {
        ...devices['iPhone SE'],
      },
    },
    {
      name: 'mobile-pixel',
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'mobile-samsung',
      use: {
        ...devices['Galaxy S9+'],
      },
    },
    
    // Tablet
    {
      name: 'tablet-ipad',
      use: {
        ...devices['iPad (gen 7)'],
      },
    },
    {
      name: 'tablet-landscape',
      use: {
        ...devices['iPad (gen 7) landscape'],
      },
    },
    
    // Desktop browsers
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
    },
    
    // Mobile landscape
    {
      name: 'mobile-landscape',
      use: {
        ...devices['iPhone 12'],
        viewport: { width: 844, height: 390 },
      },
    },
  ],

  // Run local dev server before starting tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

