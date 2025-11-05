# Mobile Testing Framework

Comprehensive automated testing for mobile devices to catch issues before they reach users.

## Quick Start

### Run Tests on Localhost (Development)

```bash
# Install dependencies (if not already done)
npm install

# Run mobile tests
npx playwright test --config=playwright.config.mobile.ts
```

### Run Tests on Network IP (Real Mobile Simulation)

This simulates how the app works on an actual mobile device on your local network.

```bash
# First, get your machine's IP address
ipconfig getifaddr en0  # macOS/Linux WiFi
# or
ipconfig getifaddr en1  # macOS/Linux Ethernet

# Run tests with network IP (replace with your IP)
TEST_BASE_URL=http://192.168.2.48:5173 \
API_BASE_URL=http://192.168.2.48:8000 \
npx playwright test --config=playwright.config.mobile.ts
```

## Test Suites

### 1. Network Connectivity Tests (`mobile-network.spec.ts`)

**Purpose**: Catch API connectivity issues like the ones we fixed today.

Tests:
- ✅ Verifies API calls use correct URL (network IP vs localhost)
- ✅ Tests facilities endpoint accessibility  
- ✅ Tests schedule endpoint accessibility
- ✅ Handles API timeouts gracefully
- ✅ Handles API failures with proper error messages
- ✅ Validates health endpoint
- ✅ Validates API data structure
- ✅ Checks CORS configuration

**These tests would have caught:** Mobile device showing "Failed to Load Facilities" due to localhost URL

### 2. Schedule View Tests (`mobile-schedule.spec.ts`)

**Purpose**: Catch date/timezone and schedule rendering issues.

Tests:
- ✅ Dates display correctly without timezone offset
- ✅ Sessions appear on correct days (no off-by-one errors)
- ✅ Week navigation updates dates correctly
- ✅ Filters work on mobile
- ✅ Empty states handled gracefully
- ✅ Table view is responsive and scrollable
- ✅ Swim type badges are visible and colored
- ✅ Time ranges format correctly (AM/PM)
- ✅ Geolocation sort button is functional

**These tests would have caught:** 
- Tuesday data appearing on Wednesday (timezone bug)
- Blank schedule page (filteredSessions bug)

### 3. Map View Tests (`mobile-map.spec.ts`)

**Purpose**: Verify map functionality on mobile devices.

Tests:
- ✅ Map loads and renders tiles
- ✅ Facility markers load from API
- ✅ Marker popups show facility information
- ✅ API failures handled gracefully
- ✅ Sidebar lists facilities
- ✅ Sort by distance works
- ✅ Facility details include address and phone
- ✅ Map is touch-interactive
- ✅ Loading states display properly
- ✅ Map centers on Toronto

## Device Coverage

Tests run on these mobile devices:
- **iPhone 14 Pro** - Latest iOS flagship
- **iPhone SE** - Small screen (320x568)
- **Samsung Galaxy S21** - Android flagship
- **iPad Air** - Tablet
- **Mobile Landscape** - Rotated orientation

## View Test Results

After running tests:

```bash
# Open HTML report
npx playwright show-report playwright-report-mobile
```

Reports include:
- Screenshots of failures
- Video recordings
- Network request logs
- Trace files for debugging

## Configuration

### Environment Variables

- `TEST_BASE_URL` - Base URL for the app (default: `http://localhost:5173`)
- `API_BASE_URL` - API endpoint URL (default: `http://localhost:8000`)

### Playwright Config

Mobile-specific settings in `playwright.config.mobile.ts`:
- Timeout: 45 seconds (mobile needs more time)
- Retries: 1 (to catch flaky tests)
- Trace: Always on (for debugging)
- Video: On failure
- Geolocation: Toronto coordinates (43.6532, -79.3832)

## Debugging Failed Tests

### 1. View Screenshots

Failed tests automatically capture screenshots:

```bash
ls playwright-report-mobile/
```

### 2. View Videos

Videos show exactly what happened:

```bash
open playwright-report-mobile
# Click on failed test, then "Video"
```

### 3. View Traces

Traces show network requests, console logs, and DOM state:

```bash
npx playwright show-trace playwright-report-mobile/trace.zip
```

### 4. Run Single Test

```bash
npx playwright test --config=playwright.config.mobile.ts -g "should use correct API URL"
```

### 5. Run in Debug Mode

```bash
npx playwright test --config=playwright.config.mobile.ts --debug
```

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Run Mobile Tests
  run: |
    npm install
    npx playwright install
    npx playwright test --config=playwright.config.mobile.ts
  env:
    CI: true
    TEST_BASE_URL: ${{ secrets.TEST_URL }}
    API_BASE_URL: ${{ secrets.API_URL }}
```

## Best Practices

1. **Always run tests before deploying** to catch mobile issues early
2. **Test on network IP regularly** to simulate real mobile devices
3. **Check test reports** for screenshots and videos of failures
4. **Update tests** when adding new features
5. **Fix flaky tests immediately** - they hide real issues

## Common Issues

### Tests fail with "Failed to Load"

**Cause**: API not accessible on network IP

**Fix**: 
1. Check docker-compose.yml has correct VITE_API_URL
2. Restart containers: `docker-compose restart web`
3. Verify: `curl http://192.168.2.48:8000/health`

### Date tests fail

**Cause**: Timezone parsing issues

**Fix**: Ensure dates parse as local time (not UTC)
- Use: `new Date(year, month - 1, day)`
- Avoid: `new Date('2025-11-05')` (treats as UTC)

### Map tests fail

**Cause**: Leaflet not loading or markers not rendering

**Fix**: 
1. Check network requests in test trace
2. Verify facilities API returns data
3. Increase timeout if needed

## Writing New Tests

Example test structure:

```typescript
test("new feature works on mobile", async ({ page }) => {
  // Navigate to page
  await page.goto("/feature");
  
  // Wait for content
  await page.waitForLoadState('networkidle');
  
  // Interact with element
  await page.click('button:has-text("Action")');
  
  // Verify result
  await expect(page.locator('text=Success')).toBeVisible();
  
  console.log(`✅ Feature test passed`);
});
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Mobile Testing Best Practices](https://playwright.dev/docs/emulation)
- [Debugging Guide](https://playwright.dev/docs/debug)

---

**Remember**: These tests exist because manual mobile testing is slow and error-prone. Run them often! 🚀

