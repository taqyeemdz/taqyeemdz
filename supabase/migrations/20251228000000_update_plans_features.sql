-- Add missing feature flag columns to subscription_plans
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS allow_media BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS allow_stats BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS allow_tamboola BOOLEAN DEFAULT false;

-- Optionally, enable features for existing "Pro" and "Enterprise" tiers
UPDATE public.subscription_plans 
SET allow_media = true, allow_stats = true, allow_tamboola = true 
WHERE name IN ('Pro', 'Enterprise');

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
