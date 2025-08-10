-- RUN THIS IN SUPABASE SQL EDITOR NOW!
-- These are your actual Stripe price IDs from your .env.local file

UPDATE pricing_tiers 
SET 
  stripe_price_id_monthly = 'price_1RuRMHCGECHgvbvc0ZCtgEXX',
  stripe_price_id_yearly = 'price_1RuRNLCGECHgvbvczGsOirlY'
WHERE name = 'basic';

UPDATE pricing_tiers 
SET 
  stripe_price_id_monthly = 'price_1RuRMhCGECHgvbvcHdJIRebI',
  stripe_price_id_yearly = 'price_1RuRNeCGECHgvbvcEKbBBTHd'
WHERE name = 'pro';

UPDATE pricing_tiers 
SET 
  stripe_price_id_monthly = 'price_1RuRMvCGECHgvbvc5zGUDfYC',
  stripe_price_id_yearly = 'price_1RuRNxCGECHgvbvcEJ8o4Q82'
WHERE name = 'pro_plus';

-- Verify it worked
SELECT name, stripe_price_id_monthly, stripe_price_id_yearly 
FROM pricing_tiers;