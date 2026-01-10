-- Add allow_audio feature flag to subscription_plans
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS allow_audio BOOLEAN DEFAULT false;

-- Enable audio for existing "Pro" and "Enterprise" tiers by default
UPDATE public.subscription_plans 
SET allow_audio = true 
WHERE name IN ('Pro', 'Enterprise');

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
