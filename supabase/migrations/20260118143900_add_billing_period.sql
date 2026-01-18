-- Add billing_period column to subscription_plans table
ALTER TABLE public.subscription_plans
ADD COLUMN billing_period text NOT NULL DEFAULT 'monthly';

-- Add check constraint to ensure only valid values
ALTER TABLE public.subscription_plans
ADD CONSTRAINT billing_period_check CHECK (billing_period IN ('monthly', 'yearly'));
