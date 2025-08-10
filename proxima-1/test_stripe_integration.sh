#!/bin/bash

# ================================================
# STRIPE INTEGRATION TEST SCRIPT
# Tests the complete checkout flow with authentication
# ================================================

# Configuration
BASE_URL="http://localhost:3000"
EMAIL="test@example.com"
PASSWORD="Test123456!"

echo "================================================"
echo "STRIPE INTEGRATION TEST SUITE"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ "$1" = "success" ]; then
        echo -e "${GREEN}✓${NC} $2"
    elif [ "$1" = "error" ]; then
        echo -e "${RED}✗${NC} $2"
    else
        echo -e "${YELLOW}→${NC} $2"
    fi
}

# ================================================
# STEP 1: Sign up or login to get auth token
# ================================================
echo "STEP 1: Authenticating user..."
echo "-------------------------------"

# First, try to sign up (in case user doesn't exist)
print_status "info" "Attempting to create test user..."
SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"Test User\"}" \
    -c cookies.txt \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$SIGNUP_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$SIGNUP_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    print_status "success" "User created successfully"
else
    print_status "info" "User may already exist, attempting login..."
fi

# Login to get session
print_status "info" "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
    -c cookies.txt \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$LOGIN_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    print_status "success" "Login successful"
    echo "Response: $RESPONSE_BODY"
else
    print_status "error" "Login failed with status $HTTP_CODE"
    echo "Response: $RESPONSE_BODY"
    exit 1
fi

echo ""

# ================================================
# STEP 2: Check authentication status
# ================================================
echo "STEP 2: Verifying authentication..."
echo "------------------------------------"

AUTH_CHECK=$(curl -s -X GET "$BASE_URL/api/auth/session" \
    -b cookies.txt \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$AUTH_CHECK" | tail -n 1)
RESPONSE_BODY=$(echo "$AUTH_CHECK" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    print_status "success" "Authentication verified"
    echo "Session: $RESPONSE_BODY"
else
    print_status "error" "Authentication check failed"
    echo "Response: $RESPONSE_BODY"
fi

echo ""

# ================================================
# STEP 3: Test checkout session creation
# ================================================
echo "STEP 3: Creating Stripe checkout session..."
echo "-------------------------------------------"

# Test Basic tier - Monthly
print_status "info" "Testing Basic tier (monthly)..."
CHECKOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/stripe/create-checkout-session" \
    -H "Content-Type: application/json" \
    -d '{"tier":"basic","billingCycle":"monthly"}' \
    -b cookies.txt \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$CHECKOUT_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$CHECKOUT_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    print_status "success" "Checkout session created successfully"
    echo "Response: $RESPONSE_BODY"
    
    # Extract the URL from response
    CHECKOUT_URL=$(echo "$RESPONSE_BODY" | grep -o '"url":"[^"]*' | sed 's/"url":"//')
    if [ ! -z "$CHECKOUT_URL" ]; then
        print_status "success" "Checkout URL: $CHECKOUT_URL"
    fi
else
    print_status "error" "Failed to create checkout session (Status: $HTTP_CODE)"
    echo "Response: $RESPONSE_BODY"
fi

echo ""

# Test Pro tier - Yearly
print_status "info" "Testing Pro tier (yearly)..."
CHECKOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/stripe/create-checkout-session" \
    -H "Content-Type: application/json" \
    -d '{"tier":"pro","billingCycle":"yearly"}' \
    -b cookies.txt \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$CHECKOUT_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$CHECKOUT_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    print_status "success" "Pro tier checkout session created"
    echo "Response: $RESPONSE_BODY"
elif [ "$HTTP_CODE" = "400" ]; then
    print_status "info" "User may already have a subscription"
    echo "Response: $RESPONSE_BODY"
else
    print_status "error" "Failed with status $HTTP_CODE"
    echo "Response: $RESPONSE_BODY"
fi

echo ""

# ================================================
# STEP 4: Test unauthenticated request
# ================================================
echo "STEP 4: Testing unauthenticated request..."
echo "------------------------------------------"

print_status "info" "Attempting checkout without authentication..."
UNAUTH_RESPONSE=$(curl -s -X POST "$BASE_URL/api/stripe/create-checkout-session" \
    -H "Content-Type: application/json" \
    -d '{"tier":"basic","billingCycle":"monthly"}' \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$UNAUTH_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$UNAUTH_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "401" ]; then
    print_status "success" "Correctly rejected unauthenticated request"
    echo "Response: $RESPONSE_BODY"
else
    print_status "error" "Unexpected status code: $HTTP_CODE (expected 401)"
    echo "Response: $RESPONSE_BODY"
fi

echo ""

# ================================================
# STEP 5: Test invalid tier
# ================================================
echo "STEP 5: Testing invalid tier..."
echo "--------------------------------"

print_status "info" "Testing with invalid tier name..."
INVALID_RESPONSE=$(curl -s -X POST "$BASE_URL/api/stripe/create-checkout-session" \
    -H "Content-Type: application/json" \
    -d '{"tier":"invalid_tier","billingCycle":"monthly"}' \
    -b cookies.txt \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$INVALID_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$INVALID_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "400" ]; then
    print_status "success" "Correctly rejected invalid tier"
    echo "Response: $RESPONSE_BODY"
else
    print_status "error" "Unexpected status code: $HTTP_CODE (expected 400)"
    echo "Response: $RESPONSE_BODY"
fi

echo ""

# ================================================
# STEP 6: Test webhook endpoint
# ================================================
echo "STEP 6: Testing webhook endpoint..."
echo "------------------------------------"

print_status "info" "Checking webhook endpoint availability..."
WEBHOOK_CHECK=$(curl -s -X GET "$BASE_URL/api/stripe/webhook" \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$WEBHOOK_CHECK" | tail -n 1)
RESPONSE_BODY=$(echo "$WEBHOOK_CHECK" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    print_status "success" "Webhook endpoint is accessible"
    echo "Response: $RESPONSE_BODY"
else
    print_status "error" "Webhook endpoint returned status $HTTP_CODE"
    echo "Response: $RESPONSE_BODY"
fi

echo ""

# ================================================
# CLEANUP
# ================================================
echo "CLEANUP"
echo "-------"
rm -f cookies.txt
print_status "success" "Cleaned up temporary files"

echo ""
echo "================================================"
echo "TEST SUMMARY"
echo "================================================"
echo ""
echo "✓ Authentication flow tested"
echo "✓ Checkout session creation tested"
echo "✓ Error handling tested"
echo "✓ Webhook endpoint checked"
echo ""
echo "To complete the full integration test:"
echo "1. Click on a checkout URL above to go through Stripe's payment flow"
echo "2. Use test card: 4242 4242 4242 4242 (any future date, any CVC)"
echo "3. Check the webhook logs to verify the subscription was created"
echo ""
echo "Monitor webhook events with:"
echo "  stripe listen --forward-to localhost:3000/api/stripe/webhook"
echo ""