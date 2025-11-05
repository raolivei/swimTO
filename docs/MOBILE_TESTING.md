# Mobile Testing Guide

## Overview

This guide covers mobile testing strategies, tools, and best practices for the SwimTO application.

## Quick Testing Checklist

### Device Testing

- [ ] iPhone (various models and iOS versions)
- [ ] Android phones (various manufacturers)
- [ ] Tablets (iPad, Android tablets)
- [ ] Different screen sizes (small: 320px, medium: 375px, large: 414px+)
- [ ] Landscape and portrait orientations

### Browser Testing

- [ ] Safari (iOS)
- [ ] Chrome (iOS & Android)
- [ ] Firefox (Android)
- [ ] Samsung Internet (Android)
- [ ] Edge (Android)

### Network Conditions

- [ ] WiFi
- [ ] 4G/5G
- [ ] 3G (slow connection)
- [ ] Offline mode
- [ ] Airplane mode toggle

### Touch & Gestures

- [ ] Tap targets (minimum 44x44px)
- [ ] Scroll performance
- [ ] Pinch to zoom on map
- [ ] Swipe gestures
- [ ] Long press interactions

### UI/UX Elements

- [ ] Navigation is accessible
- [ ] Forms are usable with mobile keyboard
- [ ] Error states are visible and actionable
- [ ] Loading states are clear
- [ ] Text is readable without zooming
- [ ] Touch targets don't overlap
- [ ] No horizontal scrolling (except intentional)

### Performance

- [ ] Initial load time < 3 seconds
- [ ] Time to interactive < 5 seconds
- [ ] Smooth scrolling (60fps)
- [ ] Map loads and is interactive
- [ ] Images load efficiently
- [ ] API responses are cached appropriately

### Accessibility

- [ ] Screen reader compatibility
- [ ] Sufficient color contrast
- [ ] Focus indicators visible
- [ ] Semantic HTML
- [ ] ARIA labels where needed

## Testing Methods

### 1. Browser DevTools (Quickest)

**Chrome/Edge DevTools:**

```bash
# Open DevTools
Cmd+Option+I (Mac) or F12 (Windows/Linux)

# Toggle device toolbar
Cmd+Shift+M (Mac) or Ctrl+Shift+M (Windows/Linux)
```

**Preset Devices:**

- iPhone SE (375 x 667)
- iPhone 12 Pro (390 x 844)
- iPhone 14 Pro Max (430 x 932)
- Pixel 5 (393 x 851)
- Galaxy S20 (360 x 800)
- iPad Air (820 x 1180)

**Custom Sizes:**

- Small: 320px width
- Medium: 375px width
- Large: 428px width
- Tablet: 768px width

**Network Throttling:**

- Fast 3G
- Slow 3G
- Offline

### 2. Local Network Testing (Real Devices)

**Find your local IP:**

```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Alternative
ipconfig getifaddr en0
```

**Access from mobile device:**

```
http://YOUR_LOCAL_IP:5173  # Vite dev server
http://YOUR_LOCAL_IP:8000  # API server
```

**Example:**

```
http://192.168.2.48:5173
```

**Requirements:**

- Ensure mobile device is on same WiFi network
- Check firewall settings allow local network access
- For iOS, may need to trust certificate if using HTTPS

### 3. Browser-Based Tools

**BrowserStack:**

- Real device testing
- Automated screenshots
- Interactive sessions
- https://www.browserstack.com

**LambdaTest:**

- Live testing
- Screenshot testing
- Responsive testing
- https://www.lambdatest.com

**Sauce Labs:**

- Real device cloud
- Automated testing
- Performance metrics
- https://saucelabs.com

### 4. Lighthouse Mobile Audit

```bash
# Using Chrome DevTools
# 1. Open DevTools (F12)
# 2. Go to Lighthouse tab
# 3. Select "Mobile" device
# 4. Select categories (Performance, Accessibility, Best Practices, SEO)
# 5. Click "Analyze page load"

# Using CLI
npm install -g lighthouse
lighthouse http://localhost:5173 --view --preset=mobile
```

**Key Metrics to Monitor:**

- First Contentful Paint (FCP) < 1.8s
- Largest Contentful Paint (LCP) < 2.5s
- Time to Interactive (TTI) < 3.8s
- Total Blocking Time (TBT) < 200ms
- Cumulative Layout Shift (CLS) < 0.1

### 5. Responsive Design Testing

```bash
# Install Chrome extension: Window Resizer
# Or use Firefox Responsive Design Mode

# Test these breakpoints:
# Mobile Small:    320px - 374px
# Mobile Medium:   375px - 424px
# Mobile Large:    425px - 767px
# Tablet:          768px - 1023px
# Desktop:         1024px+
```

## Common Mobile Issues & Solutions

### Issue 1: API Not Accessible from Mobile

**Symptoms:**

- "Failed to Load Schedule" error
- Network connectivity errors
- CORS errors

**Solutions:**

```typescript
// 1. Update API URL in .env
VITE_API_URL=http://192.168.2.48:8000

// 2. Ensure API CORS allows local network
// apps/api/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In development only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

// 3. Check firewall settings
# macOS
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /path/to/python
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblock /path/to/python
```

### Issue 2: Viewport Not Set

**Symptoms:**

- Page appears zoomed out
- Touch targets too small

**Solution:**

```html
<!-- Ensure this is in index.html -->
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes"
/>
```

### Issue 3: Map Not Responsive

**Symptoms:**

- Map overflow on mobile
- Controls not accessible
- Pinch zoom conflicts

**Solution:**

```css
/* Ensure map container has proper constraints */
.leaflet-container {
  width: 100%;
  height: 100%;
  touch-action: pan-y pinch-zoom;
}
```

### Issue 4: Touch Targets Too Small

**Symptoms:**

- Hard to tap buttons
- Misclicks

**Solution:**

```css
/* Minimum touch target: 44x44px */
button,
a {
  min-height: 44px;
  min-width: 44px;
}
```

### Issue 5: Sidebar Overflow

**Symptoms:**

- Content extends beyond viewport
- Horizontal scrolling

**Solution:**

```tsx
{/* Make sidebar full-width on mobile, fixed width on larger screens */}
<div className="absolute top-4 right-4 left-4 md:left-auto md:w-80 ...">
```

### Issue 6: Font Size Too Small

**Symptoms:**

- Text hard to read without zooming
- Squinting required

**Solution:**

```css
/* Minimum 16px for body text on mobile */
body {
  font-size: 16px;
}

/* Minimum 14px for small text */
.text-sm {
  font-size: 14px;
}
```

## Testing Script

Create a mobile testing checklist script:

```bash
#!/bin/bash
# scripts/mobile-test.sh

echo "🧪 SwimTO Mobile Testing Script"
echo "================================"
echo ""

# Get local IP
LOCAL_IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1)
echo "📱 Your local IP: $LOCAL_IP"
echo ""

# Start servers
echo "🚀 Starting servers..."
echo "  - Web: http://$LOCAL_IP:5173"
echo "  - API: http://$LOCAL_IP:8000"
echo ""

# Instructions
echo "📋 Testing Instructions:"
echo "  1. Connect mobile device to same WiFi network"
echo "  2. Open browser on mobile device"
echo "  3. Navigate to: http://$LOCAL_IP:5173"
echo "  4. Test each page and feature"
echo "  5. Try different orientations"
echo "  6. Test with network throttling"
echo ""

# QR Code (if qrencode is installed)
if command -v qrencode &> /dev/null; then
    echo "📱 Scan QR code to open on mobile:"
    qrencode -t UTF8 "http://$LOCAL_IP:5173"
else
    echo "💡 Install qrencode for QR code: brew install qrencode"
fi

echo ""
echo "✅ Ready for mobile testing!"
```

## Automated Testing

### Playwright Mobile Tests

```typescript
// apps/web/src/tests/mobile.spec.ts
import { test, expect, devices } from "@playwright/test";

// Test on iPhone 12
test.use(devices["iPhone 12"]);

test("mobile: home page loads", async ({ page }) => {
  await page.goto("http://localhost:5173");
  await expect(page.locator("h1")).toContainText("Find Your Perfect Swim Time");
});

test("mobile: navigation works", async ({ page }) => {
  await page.goto("http://localhost:5173");

  // Test mobile navigation
  await page.click('a[href="/schedule"]');
  await expect(page).toHaveURL(/schedule/);

  await page.click('a[href="/map"]');
  await expect(page).toHaveURL(/map/);
});

test("mobile: schedule filter toggles", async ({ page }) => {
  await page.goto("http://localhost:5173/schedule");

  // Should hide filters by default on mobile
  await expect(page.locator("text=Filters")).toBeVisible();

  // Click to show filters
  await page.click("text=Filters");
  await expect(page.locator("text=LANE_SWIM")).toBeVisible();
});

test("mobile: error state shows retry button", async ({ page }) => {
  // Mock API failure
  await page.route("**/schedule", (route) => route.abort());

  await page.goto("http://localhost:5173/schedule");

  await expect(page.locator("text=Failed to Load Schedule")).toBeVisible();
  await expect(page.locator('button:has-text("Try Again")')).toBeVisible();
});

// Test on Android
test.use(devices["Pixel 5"]);

test("android: map loads", async ({ page }) => {
  await page.goto("http://localhost:5173/map");

  // Wait for map to initialize
  await page.waitForSelector(".leaflet-container");

  // Check markers appear
  await page.waitForSelector(".leaflet-marker-icon");
});

// Test landscape orientation
test.use({
  ...devices["iPhone 12"],
  viewport: { width: 844, height: 390 },
});

test("mobile landscape: layout adapts", async ({ page }) => {
  await page.goto("http://localhost:5173");

  // Check that content is still accessible
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator("nav")).toBeVisible();
});
```

### Visual Regression Testing

```typescript
// apps/web/src/tests/visual-mobile.spec.ts
import { test, expect, devices } from "@playwright/test";

test.use(devices["iPhone 12"]);

test("mobile: home page screenshot", async ({ page }) => {
  await page.goto("http://localhost:5173");
  await expect(page).toHaveScreenshot("mobile-home.png");
});

test("mobile: schedule page screenshot", async ({ page }) => {
  await page.goto("http://localhost:5173/schedule");
  await page.waitForLoadState("networkidle");
  await expect(page).toHaveScreenshot("mobile-schedule.png");
});

test("mobile: map page screenshot", async ({ page }) => {
  await page.goto("http://localhost:5173/map");
  await page.waitForSelector(".leaflet-container");
  await expect(page).toHaveScreenshot("mobile-map.png");
});

test("mobile: error state screenshot", async ({ page }) => {
  await page.route("**/schedule", (route) => route.abort());
  await page.goto("http://localhost:5173/schedule");
  await expect(page).toHaveScreenshot("mobile-error.png");
});
```

## Performance Testing

### Measuring Performance

```typescript
// apps/web/src/tests/performance.ts
import { test } from "@playwright/test";

test("mobile performance metrics", async ({ page }) => {
  await page.goto("http://localhost:5173");

  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0];
    const paint = performance.getEntriesByType("paint");

    return {
      domContentLoaded:
        navigation.domContentLoadedEventEnd -
        navigation.domContentLoadedEventStart,
      load: navigation.loadEventEnd - navigation.loadEventStart,
      firstPaint: paint.find((p) => p.name === "first-paint")?.startTime,
      firstContentfulPaint: paint.find(
        (p) => p.name === "first-contentful-paint"
      )?.startTime,
    };
  });

  console.log("Performance Metrics:", metrics);

  // Assert performance budgets
  expect(metrics.domContentLoaded).toBeLessThan(1000); // 1s
  expect(metrics.load).toBeLessThan(3000); // 3s
  expect(metrics.firstContentfulPaint).toBeLessThan(1800); // 1.8s
});
```

## Best Practices

### 1. Progressive Enhancement

- Ensure core functionality works without JavaScript
- Test with JS disabled
- Provide fallbacks for modern features

### 2. Touch-First Design

- Design for touch before mouse
- Adequate spacing between interactive elements
- Support common mobile gestures

### 3. Network Awareness

- Show loading states immediately
- Handle offline gracefully
- Implement retry logic
- Cache API responses

### 4. Performance Budget

- Total page size < 1MB
- Initial bundle < 200KB
- API responses < 100KB
- Images optimized and lazy-loaded

### 5. Accessibility

- Test with screen readers (VoiceOver, TalkBack)
- Ensure keyboard navigation works
- Maintain color contrast ratios
- Use semantic HTML

### 6. Safe Areas (Notched Devices)

```css
/* Account for notches and rounded corners */
padding-left: env(safe-area-inset-left);
padding-right: env(safe-area-inset-right);
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
```

### 7. Prevent Zoom on Input Focus (iOS)

```html
<!-- Set font-size to 16px or higher to prevent zoom -->
<input style="font-size: 16px;" />
```

### 8. PWA Support

```html
<!-- Add manifest for installability -->
<link rel="manifest" href="/manifest.json" />

<!-- Add iOS-specific meta tags -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
```

## Resources

### Tools

- Chrome DevTools Device Mode
- Firefox Responsive Design Mode
- Safari Web Inspector
- Lighthouse
- WebPageTest Mobile
- GTmetrix Mobile Analysis

### Testing Services

- BrowserStack
- Sauce Labs
- LambdaTest
- Percy (Visual Testing)
- Playwright
- Cypress

### Documentation

- MDN Web Docs - Mobile Web Development
- Google Web Fundamentals - Mobile
- Apple Human Interface Guidelines
- Material Design - Mobile

### Communities

- Web Performance Slack
- Frontend Focus Newsletter
- Mobile DevOps Slack

## Troubleshooting

### Can't connect from mobile device

1. Check same WiFi network
2. Check firewall settings
3. Try `0.0.0.0` instead of `localhost` in server config
4. Verify IP address is correct
5. Try accessing `/health` endpoint directly

### Map not loading on mobile

1. Check Leaflet CSS is loaded
2. Verify touch-action CSS property
3. Test on real device (some emulators have issues)
4. Check console for errors

### API calls failing

1. Check CORS configuration
2. Verify API URL in environment variables
3. Check network tab for request details
4. Test API endpoint directly in mobile browser

### Touch events not working

1. Verify touch-action CSS
2. Check for JavaScript errors
3. Test passive event listeners
4. Ensure no preventDefault() issues

## Next Steps

1. ✅ Set up mobile testing environment
2. ✅ Run through testing checklist
3. ✅ Fix any identified issues
4. ✅ Add automated mobile tests
5. ✅ Monitor mobile performance metrics
6. ✅ Implement PWA features
7. ✅ Regular testing on real devices
