# PowerShell script to test Stripe integration
# This script simulates the browser flow using cookies

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "STRIPE INTEGRATION TEST (PowerShell)" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"

# Test user credentials - you'll need to update these with real credentials
$email = Read-Host "Enter email for existing user"
$password = Read-Host "Enter password" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

Write-Host ""
Write-Host "Step 1: Testing unauthenticated request (should fail)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/stripe/create-checkout-session" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"tier":"basic","billingCycle":"monthly"}' `
        -ErrorAction Stop
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✓ Correctly rejected unauthenticated request (401)" -ForegroundColor Green
    } else {
        Write-Host "✗ Unexpected error: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Step 2: Creating browser session..." -ForegroundColor Yellow
Write-Host "Opening login page in browser to authenticate..." -ForegroundColor Gray

# Open browser to login page
Start-Process "$baseUrl/login"

Write-Host ""
Write-Host "Please complete these steps in the browser:" -ForegroundColor Cyan
Write-Host "1. Sign in with your credentials" -ForegroundColor White
Write-Host "2. Once logged in, navigate to the pricing page" -ForegroundColor White
Write-Host "3. Click on any 'Subscribe' button" -ForegroundColor White
Write-Host "4. You should be redirected to Stripe checkout" -ForegroundColor White
Write-Host ""
Write-Host "Press Enter once you've completed the login..." -ForegroundColor Yellow
Read-Host

Write-Host ""
Write-Host "Alternative: Manual CURL test with cookies" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "After logging in via browser, you can extract cookies and test with:" -ForegroundColor Gray
Write-Host ""
Write-Host 'curl -X POST http://localhost:3000/api/stripe/create-checkout-session \' -ForegroundColor White
Write-Host '  -H "Content-Type: application/json" \' -ForegroundColor White
Write-Host '  -H "Cookie: [PASTE YOUR COOKIES HERE]" \' -ForegroundColor White
Write-Host '  -d ''{"tier":"pro","billingCycle":"monthly"}''' -ForegroundColor White
Write-Host ""

Write-Host "Test Card Information:" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host "Card Number: 4242 4242 4242 4242" -ForegroundColor Green
Write-Host "Expiry: Any future date (e.g., 12/34)" -ForegroundColor Green
Write-Host "CVC: Any 3 digits (e.g., 123)" -ForegroundColor Green
Write-Host "ZIP: Any valid ZIP (e.g., 10001)" -ForegroundColor Green
Write-Host ""

Write-Host "Webhook Testing:" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
Write-Host "To see webhook events, run in another terminal:" -ForegroundColor Gray
Write-Host "stripe listen --forward-to localhost:3000/api/stripe/webhook" -ForegroundColor White
Write-Host ""

Write-Host "Test complete!" -ForegroundColor Green