# Manual Stripe Integration Testing with CURL

## Prerequisites
- Server running on http://localhost:3000
- Valid test user account

## Step-by-Step CURL Commands

### 1. Login to Get Authentication Cookie

```bash
# Login (saves cookies to cookies.txt file)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"your-password"}' \
  -c cookies.txt -v
```

### 2. Verify Authentication

```bash
# Check if authenticated (uses saved cookies)
curl -X GET http://localhost:3000/api/auth/session \
  -b cookies.txt
```

### 3. Create Checkout Session - Basic Monthly

```bash
# Create checkout session for Basic tier (monthly)
curl -X POST http://localhost:3000/api/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"tier":"basic","billingCycle":"monthly"}' \
  -b cookies.txt
```

### 4. Create Checkout Session - Pro Yearly

```bash
# Create checkout session for Pro tier (yearly)
curl -X POST http://localhost:3000/api/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"tier":"pro","billingCycle":"yearly"}' \
  -b cookies.txt
```

### 5. Create Checkout Session - Pro Plus Monthly

```bash
# Create checkout session for Pro Plus tier (monthly)
curl -X POST http://localhost:3000/api/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"tier":"pro_plus","billingCycle":"monthly"}' \
  -b cookies.txt
```

## Expected Responses

### Successful Checkout Session Creation
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "sessionId": "cs_test_..."
}
```

### User Not Authenticated (401)
```json
{
  "error": "Please sign in to subscribe"
}
```

### User Already Has Subscription (400)
```json
{
  "error": "You already have an active subscription. Please manage it from your profile.",
  "hasSubscription": true
}
```

### Invalid Tier (400)
```json
{
  "error": "Invalid tier selected"
}
```

## Testing Without Authentication (Should Fail)

```bash
# This should return 401 Unauthorized
curl -X POST http://localhost:3000/api/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"tier":"basic","billingCycle":"monthly"}'
```

## Windows PowerShell Commands

### 1. Login (PowerShell)
```powershell
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"your-email@example.com","password":"your-password"}' `
  -SessionVariable session

# Check response
$response.Content | ConvertFrom-Json
```

### 2. Create Checkout Session (PowerShell)
```powershell
$checkoutResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/stripe/create-checkout-session" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"tier":"basic","billingCycle":"monthly"}' `
  -WebSession $session

# Parse and display the checkout URL
$checkout = $checkoutResponse.Content | ConvertFrom-Json
Write-Host "Checkout URL: $($checkout.url)"
```

## Test Stripe Webhook Locally

1. Install Stripe CLI:
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows
scoop install stripe

# Or download from https://github.com/stripe/stripe-cli/releases
```

2. Login to Stripe CLI:
```bash
stripe login
```

3. Forward webhooks to your local server:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

4. Trigger test events:
```bash
# Test checkout completed
stripe trigger checkout.session.completed

# Test subscription updated
stripe trigger customer.subscription.updated

# Test payment succeeded
stripe trigger invoice.payment_succeeded
```

## Complete Test Flow

1. **Login** to get authentication cookie
2. **Create checkout session** - should receive Stripe checkout URL
3. **Click the URL** to go to Stripe's hosted checkout page
4. **Use test card**: 4242 4242 4242 4242 (any future date, any CVC)
5. **Complete checkout**
6. **Check webhook logs** to verify subscription was created
7. **Check database** to confirm subscription record exists

## Debugging Tips

### View Request Headers
```bash
curl -X POST http://localhost:3000/api/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"tier":"basic","billingCycle":"monthly"}' \
  -b cookies.txt \
  -v  # Verbose mode shows headers
```

### Save Full Response with Headers
```bash
curl -X POST http://localhost:3000/api/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"tier":"basic","billingCycle":"monthly"}' \
  -b cookies.txt \
  -i  # Include headers in output
```

### Pretty Print JSON Response
```bash
curl -X POST http://localhost:3000/api/stripe/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"tier":"basic","billingCycle":"monthly"}' \
  -b cookies.txt \
  -s | python -m json.tool
```

## Common Issues and Solutions

### Issue: 401 Unauthorized
**Solution**: Make sure you're including the cookies file (-b cookies.txt) and that you've logged in first

### Issue: CORS errors
**Solution**: Use the cookies approach instead of Authorization headers, as the API uses cookie-based auth

### Issue: "Price configuration error"
**Solution**: Ensure the Stripe price IDs are set in your .env.local file:
```
STRIPE_PRICE_BASIC_MONTHLY=price_xxx
STRIPE_PRICE_BASIC_YEARLY=price_xxx
STRIPE_PRICE_PRO_MONTHLY=price_xxx
STRIPE_PRICE_PRO_YEARLY=price_xxx
STRIPE_PRICE_PRO_PLUS_MONTHLY=price_xxx
STRIPE_PRICE_PRO_PLUS_YEARLY=price_xxx
```