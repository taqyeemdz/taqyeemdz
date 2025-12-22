-- Add limit columns to subscription_plans
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS max_branches INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_qr_codes INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS max_feedback_monthly INTEGER DEFAULT 100;

-- Update existing plans with appropriate limits
UPDATE public.subscription_plans 
SET max_branches = 1, max_qr_codes = 3, max_feedback_monthly = 100 
WHERE name = 'Starter';

UPDATE public.subscription_plans 
SET max_branches = 5, max_qr_codes = 20, max_feedback_monthly = 1000 
WHERE name = 'Pro';

UPDATE public.subscription_plans 
SET max_branches = 999999, max_qr_codes = 999999, max_feedback_monthly = 999999 
WHERE name = 'Enterprise';
