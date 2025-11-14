#!/bin/bash

# Mobile Testing Helper Script
# This script helps set up local network testing for mobile devices

set -e

echo "🧪 SwimTO Mobile Testing Setup"
echo "================================"
echo ""

# Get local IP address
get_local_ip() {
    # Try common network interfaces
    LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || \
               ipconfig getifaddr en1 2>/dev/null || \
               hostname -I 2>/dev/null | awk '{print $1}' || \
               ip route get 1 2>/dev/null | awk '{print $7}' || \
               echo "unknown")
    echo "$LOCAL_IP"
}

LOCAL_IP=$(get_local_ip)

if [ "$LOCAL_IP" = "unknown" ]; then
    echo "❌ Could not determine local IP address"
    echo "Please find your local IP manually:"
    echo "  macOS: System Preferences > Network"
    echo "  Linux: ip addr show"
    echo "  Windows: ipconfig"
    exit 1
fi

echo "📱 Local IP Address: $LOCAL_IP"
echo ""
echo "🌐 URLs for mobile testing:"
echo "  Web:    http://$LOCAL_IP:5173"
echo "  API:    http://$LOCAL_IP:8000"
echo "  Health: http://$LOCAL_IP:8000/health"
echo ""

# Generate QR code if qrencode is available
if command -v qrencode &> /dev/null; then
    echo "📱 Scan QR code to open on mobile:"
    echo ""
    qrencode -t UTF8 "http://$LOCAL_IP:5173"
    echo ""
else
    echo "💡 Tip: Install qrencode for QR codes"
    echo "  macOS:  brew install qrencode"
    echo "  Linux:  sudo apt-get install qrencode"
    echo ""
fi

echo "📋 Mobile Testing Checklist:"
echo ""
echo "  Setup:"
echo "    ☐ Mobile device on same WiFi network"
echo "    ☐ Servers are running (web + API)"
echo "    ☐ Can access health endpoint"
echo ""
echo "  Devices:"
echo "    ☐ iPhone (Safari)"
echo "    ☐ Android (Chrome)"
echo "    ☐ Tablet (iPad/Android)"
echo ""
echo "  Pages:"
echo "    ☐ Home page loads correctly"
echo "    ☐ Map view displays and is interactive"
echo "    ☐ Schedule page shows sessions"
echo "    ☐ About page is readable"
echo "    ☐ Navigation works smoothly"
echo ""
echo "  Features:"
echo "    ☐ Schedule filters toggle on mobile"
echo "    ☐ Map markers are tappable"
echo "    ☐ Links open correctly"
echo "    ☐ Error states show retry button"
echo "    ☐ Loading states are visible"
echo ""
echo "  Orientations:"
echo "    ☐ Portrait mode"
echo "    ☐ Landscape mode"
echo ""
echo "  Network:"
echo "    ☐ WiFi connection"
echo "    ☐ Mobile data (4G/5G)"
echo "    ☐ Slow connection (3G)"
echo "    ☐ Toggle airplane mode"
echo ""
echo "  Interactions:"
echo "    ☐ Touch targets are easy to tap"
echo "    ☐ Scrolling is smooth"
echo "    ☐ No accidental clicks"
echo "    ☐ Pinch to zoom on map works"
echo "    ☐ Swipe back navigation works"
echo ""

# Check if servers are running
check_server() {
    local url=$1
    local name=$2
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|404"; then
        echo "✅ $name is running"
        return 0
    else
        echo "❌ $name is not running"
        return 1
    fi
}

echo "🔍 Checking servers..."
echo ""

WEB_RUNNING=false
API_RUNNING=false

if check_server "http://localhost:5173" "Web server"; then
    WEB_RUNNING=true
fi

if check_server "http://localhost:8000/health" "API server"; then
    API_RUNNING=true
fi

echo ""

if ! $WEB_RUNNING || ! $API_RUNNING; then
    echo "⚠️  Some servers are not running!"
    echo ""
    echo "To start servers:"
    echo "  Web:  cd apps/web && npm run dev -- --host"
    echo "  API:  cd apps/api && uvicorn app.main:app --reload --host 0.0.0.0"
    echo ""
    echo "Or use docker-compose:"
    echo "  docker-compose up"
    echo ""
    exit 1
fi

echo "✅ All servers are running!"
echo ""
echo "🚀 Ready for mobile testing!"
echo ""
echo "📖 For detailed testing guide, see: docs/MOBILE_TESTING.md"

