# Stripe Integration Quick Setup Guide

## ✅ Checklist of Values You Need

Copy this checklist and fill in your actual values:

```env
# From Stripe Dashboard > Developers > API Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_
STRIPE_SECRET_KEY=sk_test_

# From Stripe Dashboard > Products (after creating products)
STRIPE_PRICE_BASIC_MONTHLY=price_
STRIPE_PRICE_BASIC_YEARLY=price_
STRIPE_PRICE_PRO_MONTHLY=price_
STRIPE_PRICE_PRO_YEARLY=price_
STRIPE_PRICE_PRO_PLUS_MONTHLY=price_
STRIPE_PRICE_PRO_PLUS_YEARLY=price_

# From Supabase Dashboard > Settings > API
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Will get this after running stripe listen command
STRIPE_WEBHOOK_SECRET=whsec_
```

## 🚀 Quick Start Commands

### 1. Install Stripe CLI (Windows PowerShell)
```powershell
# Using Scoop
scoop install stripe

# Or download from: https://github.com/stripe/stripe-cli/releases
```

### 2. Login to Stripe CLI
```bash
stripe login
```

### 3. Forward webhooks to localhost
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
Copy the webhook signing secret it shows (starts with `whsec_`)

### 4. Install dependencies and run
```bash
npm install
npm run dev
```

## 🧪 Test Your Setup

### Test Card Numbers
- Success: `4242 4242 4242 4242`
- Any future expiry date
- Any 3-digit CVC
- Any 5-digit ZIP

### Test Flow
1. Go to http://localhost:3000/pricing
2. Click "Get Started" on any plan
3. Use test card above
4. Check your Stripe Dashboard for the payment
5. Check Supabase for subscription record

## 📝 Production Checklist

Before going live:
- [ ] Switch to live API keys in production
- [ ] Create webhook endpoint in Stripe Dashboard for production URL
- [ ] Update all price IDs to live mode prices
- [ ] Test with real card (you can refund yourself)
- [ ] Enable Stripe Radar for fraud protection

## 🔍 Troubleshooting

### "No such price" error
- Make sure you created products in Stripe Dashboard
- Copy the correct price IDs (not product IDs)
- Check you're using test mode prices with test keys

### Webhook not working
- Make sure `stripe listen` is running
- Check the webhook secret matches
- Look at Stripe Dashboard > Developers > Webhooks for errors

### Database errors
- Run the SQL script in Supabase
- Make sure RLS policies are created
- Check service role key is correct

## 📞 Need Help?

1. Check Stripe logs: Dashboard > Developers > Logs
2. Check browser console for errors
3. Check terminal where `stripe listen` is running
4. Check Supabase logs for database errors