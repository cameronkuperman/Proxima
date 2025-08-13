-- Add cancellation tracking columns to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancellation_feedback TEXT,
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP WITH TIME ZONE;

-- Add index for cancellation analysis
CREATE INDEX IF NOT EXISTS idx_subscriptions_cancellation_reason 
ON public.subscriptions(cancellation_reason) 
WHERE cancellation_reason IS NOT NULL;

-- Update subscription_events table to track cancellation events
ALTER TABLE public.subscription_events
ADD COLUMN IF NOT EXISTS event_details JSONB;
