# 📱 SwimTO Mobile Testing Checklist

Print or save this for quick reference!

## 🚀 Quick Start (2 Minutes)

```bash
# 1. Start servers with mobile access
cd apps/web && npm run dev:mobile

# 2. Run testing helper
./scripts/mobile-test.sh

# 3. Connect mobile device to same WiFi
# 4. Open http://YOUR_IP:5173 on mobile
```

---

## ✅ Manual Testing Checklist

### Setup
- [ ] Both devices on same WiFi
- [ ] Web server running on port 5173
- [ ] API server running on port 8000
- [ ] Can access health endpoint: `http://YOUR_IP:8000/health`

### Devices to Test
- [ ] iPhone (Safari) - Small & Large screens
- [ ] Android (Chrome) - Various manufacturers
- [ ] iPad (Safari) - Portrait & Landscape
- [ ] Different screen sizes (320px, 375px, 414px)

### Pages
- [ ] **Home** - Hero loads, buttons work, navigation accessible
- [ ] **Map** - Markers display, sidebar opens/closes, touch zoom works
- [ ] **Schedule** - Sessions load, filters toggle, dates are readable
- [ ] **About** - Content is readable, no overflow

### Interactions
- [ ] All buttons are easy to tap (no misclicks)
- [ ] Links open correctly
- [ ] Scrolling is smooth (60fps feel)
- [ ] Map pinch-to-zoom works
- [ ] No accidental zooms when typing
- [ ] Forms are usable with mobile keyboard
- [ ] Navigation works smoothly

### Orientations
- [ ] Portrait mode looks good
- [ ] Landscape mode works
- [ ] Rotation is smooth
- [ ] Content adapts properly

### Error States
- [ ] Error messages are visible
- [ ] Retry buttons work
- [ ] Technical details are expandable
- [ ] Error recovery works

### Network Conditions
- [ ] Works on WiFi
- [ ] Works on 4G/5G
- [ ] Handles slow connection (3G)
- [ ] Shows appropriate loading states
- [ ] Offline error is clear

### Performance
- [ ] Initial load < 3 seconds
- [ ] Page feels responsive
- [ ] No laggy scrolling
- [ ] Animations are smooth

---

## 🧪 Automated Testing

```bash
# Install Playwright (first time only)
cd apps/web
npx playwright install

# Run mobile tests
npm run test:mobile

# Run all E2E tests
npm run test:e2e

# Run with UI (interactive)
npm run test:e2e:ui

# View test report
npx playwright show-report
```

---

## 🐛 Common Issues

### "Can't connect to server"
1. Check same WiFi network
2. Verify firewall settings
3. Ensure `--host` flag is used
4. Try accessing API health endpoint directly

### "Failed to Load Schedule"
1. Verify API server is running
2. Check CORS settings
3. Test API endpoint in mobile browser
4. Check browser console for errors

### "Map not showing"
1. Check Leaflet CSS loaded
2. Verify touch-action CSS
3. Test on real device (not just emulator)
4. Check browser console

### "Touch targets too small"
1. Should be fixed with CSS updates
2. Report as bug with screenshot
3. Check for zoom issues

---

## 📊 Success Criteria

Your mobile experience is ✅ when:

- ✅ Loads in < 3 seconds
- ✅ All buttons easy to tap
- ✅ No horizontal scrolling
- ✅ Text readable without zoom
- ✅ Navigation intuitive
- ✅ Errors clear and actionable
- ✅ Works portrait & landscape
- ✅ Smooth scrolling

---

## 📝 Test Report Template

```markdown
## Mobile Test Report

**Date**: _____________________
**Tester**: ___________________
**Device**: ___________________
**OS/Browser**: _______________

### Results
- [ ] Home page
- [ ] Map view
- [ ] Schedule page
- [ ] Navigation
- [ ] Error handling
- [ ] Performance

### Issues Found
1. _________________________________
2. _________________________________
3. _________________________________

### Screenshots
(Attach screenshots of any issues)

### Overall Assessment
- [ ] Pass - Ready for production
- [ ] Pass with minor issues
- [ ] Fail - Major issues found
```

---

## 🎯 Quick Commands

```bash
# Development
npm run dev:mobile              # Start with network access
./scripts/mobile-test.sh        # Test helper with QR code

# Testing
npm run test:mobile             # Mobile-only tests
npm run test:e2e               # All E2E tests
npm run test:e2e:ui            # Interactive test UI

# Debugging
npx playwright test --debug     # Debug mode
npx playwright test --headed    # Show browser
npx playwright show-report      # View results
```

---

## 📖 Documentation

- **Quick Start**: MOBILE_TESTING_QUICK_START.md
- **Full Guide**: docs/MOBILE_TESTING.md
- **Summary**: docs/MOBILE_IMPROVEMENTS_SUMMARY.md
- **Troubleshooting**: TROUBLESHOOTING.md

---

## 💡 Pro Tips

1. **Use QR Codes**: Install `qrencode` for instant mobile access
   ```bash
   brew install qrencode  # macOS
   ```

2. **DevTools First**: Test in browser DevTools before real device

3. **Real Devices**: Always test on real devices before release

4. **Slow Network**: Test with Chrome DevTools network throttling

5. **Screenshots**: Take screenshots of issues for bug reports

6. **Playwright UI**: Use `--ui` flag for easier debugging

---

## 🆘 Need Help?

1. ✅ Check documentation files
2. ✅ Review browser console errors
3. ✅ Verify servers are running
4. ✅ Check MOBILE_TESTING.md for detailed solutions
5. ✅ Test API health endpoint directly

---

**Last Updated**: 2025-11-05
**Version**: 1.0.0

