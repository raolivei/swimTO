#!/bin/bash
set -e

echo "🧪 SwimTO - Running All Tests"
echo "=============================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track results
API_TESTS_PASSED=false
WEB_TESTS_PASSED=false

# API Tests
echo "📦 Running API tests..."
echo "----------------------"
cd apps/api
if make test; then
    echo -e "${GREEN}✅ API tests passed${NC}"
    API_TESTS_PASSED=true
else
    echo -e "${RED}❌ API tests failed${NC}"
fi
cd ../..
echo ""

# Frontend Tests
echo "🎨 Running frontend tests..."
echo "----------------------------"
cd apps/web
if npm test -- --run; then
    echo -e "${GREEN}✅ Frontend tests passed${NC}"
    WEB_TESTS_PASSED=true
else
    echo -e "${RED}❌ Frontend tests failed${NC}"
fi
cd ../..
echo ""

# Summary
echo "📊 Test Summary"
echo "==============="
if $API_TESTS_PASSED; then
    echo -e "${GREEN}✅ API Tests: PASSED${NC}"
else
    echo -e "${RED}❌ API Tests: FAILED${NC}"
fi

if $WEB_TESTS_PASSED; then
    echo -e "${GREEN}✅ Frontend Tests: PASSED${NC}"
else
    echo -e "${RED}❌ Frontend Tests: FAILED${NC}"
fi

echo ""

# Exit with error if any tests failed
if $API_TESTS_PASSED && $WEB_TESTS_PASSED; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi

