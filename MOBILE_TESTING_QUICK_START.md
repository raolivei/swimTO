# Mobile Testing Quick Start 📱

Quick guide to test SwimTO on mobile devices.

## 🚀 Quick Start (5 minutes)

### Step 1: Start the app with mobile access
```bash
# Start web server with network access
cd apps/web
npm run dev:mobile

# In another terminal, start API (if not using docker)
cd apps/api
uvicorn app.main:app --reload --host 0.0.0.0
```

### Step 2: Get your local IP
```bash
# Run the mobile testing helper
./scripts/mobile-test.sh

# Or manually find your IP:
# macOS:
ipconfig getifaddr en0

# Linux:
hostname -I | awk '{print $1}'
```

### Step 3: Access from mobile
1. Connect your mobile device to the **same WiFi network**
2. Open browser on mobile device
3. Navigate to: `http://YOUR_IP:5173`
   - Example: `http://192.168.2.48:5173`

## ✅ Quick Test Checklist

Test these essential features on mobile:

### Pages
- [ ] Home page loads and buttons work
- [ ] Map displays markers and is interactive
- [ ] Schedule shows sessions with filters
- [ ] Navigation works smoothly

### Interactions
- [ ] Buttons are easy to tap (no misclicks)
- [ ] Scrolling is smooth
- [ ] Map can be pinched to zoom
- [ ] Links open correctly

### Orientations
- [ ] Portrait mode looks good
- [ ] Landscape mode works

### Error Handling
- [ ] Turn off API server - should see error message with retry button
- [ ] Retry button should work

## 🧪 Running Automated Mobile Tests

```bash
cd apps/web

# Install Playwright (first time only)
npx playwright install

# Run mobile tests
npm run test:mobile

# Run all E2E tests (mobile + desktop)
npm run test:e2e

# Run tests with UI (interactive)
npm run test:e2e:ui
```

## 🐛 Common Issues & Fixes

### Can't connect from mobile
**Problem:** Browser shows "Can't connect" or "Site can't be reached"

**Solutions:**
1. Verify both devices are on same WiFi
2. Check firewall isn't blocking connections:
   ```bash
   # macOS - Allow incoming connections
   # System Preferences > Security & Privacy > Firewall
   # Make sure firewall allows Node/npm
   ```
3. Ensure server is running with `--host` flag
4. Try accessing the health check directly: `http://YOUR_IP:8000/health`

### Schedule not loading
**Problem:** "Failed to Load Schedule" error

**Solutions:**
1. Make sure API server is running
2. Check API is accessible from mobile:
   - Open `http://YOUR_IP:8000/health` in mobile browser
   - Should see: `{"status": "healthy"}`
3. Check CORS settings in API config
4. Verify environment variables point to correct API URL

### Map not showing
**Problem:** Map appears blank or doesn't load

**Solutions:**
1. Check browser console for errors
2. Verify Leaflet CSS is loading
3. Try on a different browser/device
4. Check network connectivity

### Touch targets too small
**Problem:** Hard to tap buttons/links

**Solution:** This should be fixed with the CSS improvements, but if still an issue:
- Update `apps/web/src/index.css` to increase min-height on buttons/links
- Report as a bug with screenshots

## 📖 Full Documentation

For detailed mobile testing strategies, see:
- [Full Mobile Testing Guide](docs/MOBILE_TESTING.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [Local Development Guide](docs/LOCAL_DEVELOPMENT.md)

## 🛠️ Tools

### Browser DevTools
Quick mobile testing without a physical device:
1. Open Chrome DevTools (F12)
2. Click device toolbar icon (Ctrl+Shift+M)
3. Select a mobile device from dropdown
4. Test different screen sizes

### Recommended Devices for Testing
- **iPhone SE** - Small screen (375px)
- **iPhone 12/13/14** - Standard iPhone (390px)
- **Pixel 5** - Standard Android (393px)
- **iPad** - Tablet (768px+)

## 📝 Testing Script Output

When you run `./scripts/mobile-test.sh`, you'll see:
```
🧪 SwimTO Mobile Testing Setup
================================

📱 Local IP Address: 192.168.2.48

🌐 URLs for mobile testing:
  Web:    http://192.168.2.48:5173
  API:    http://192.168.2.48:8000
  Health: http://192.168.2.48:8000/health

📱 Scan QR code to open on mobile:
[QR CODE HERE if qrencode installed]

📋 Mobile Testing Checklist:
  [Full checklist shown here]

✅ All servers are running!
```

## 🎯 Next Steps

After basic mobile testing:
1. Test on different browsers (Safari, Chrome, Firefox)
2. Test with slow network (DevTools throttling)
3. Test offline behavior
4. Run automated Playwright tests
5. Check accessibility with screen readers
6. Test PWA installation (Add to Home Screen)

## 💡 Tips

- **Use QR codes**: Install `qrencode` to generate QR codes for easy URL access
  ```bash
  brew install qrencode  # macOS
  ```

- **Keep DevTools open**: Monitor network requests and console errors

- **Test with real users**: Nothing beats watching actual users interact with your app

- **Regular testing**: Mobile test before each release

- **Performance matters**: Mobile users are often on slower connections

## 🆘 Need Help?

1. Check [Troubleshooting Guide](TROUBLESHOOTING.md)
2. Review [Mobile Testing Documentation](docs/MOBILE_TESTING.md)
3. Check browser console for errors
4. Verify servers are running with health check endpoint

## 📊 Success Criteria

Your mobile experience is good when:
- ✅ App loads in < 3 seconds
- ✅ All touch targets are easily tappable
- ✅ No horizontal scrolling
- ✅ Text is readable without zooming
- ✅ Navigation is intuitive
- ✅ Error states are clear and actionable
- ✅ Works in both portrait and landscape
- ✅ Smooth scrolling and transitions

