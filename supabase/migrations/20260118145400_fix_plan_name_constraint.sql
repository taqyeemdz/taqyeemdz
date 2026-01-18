-- Remove the unique constraint on name alone
ALTER TABLE public.subscription_plans
DROP CONSTRAINT IF EXISTS subscription_plans_name_key;

-- Add a composite unique constraint on (name, billing_period)
-- This allows the same plan name for different billing periods
ALTER TABLE public.subscription_plans
ADD CONSTRAINT subscription_plans_name_billing_period_key 
UNIQUE (name, billing_period);
