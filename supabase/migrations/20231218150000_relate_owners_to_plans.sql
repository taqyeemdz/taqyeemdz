-- Relate Subscriptions to Owners (Profiles)
-- 1. Add plan_id to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.subscription_plans(id);

-- 2. Data Migration: Transfer plan_id from businesses to their owners
-- We'll take the plan_id from the first business owned by the user
-- This is a one-time migration to preserve previous assignments
UPDATE public.profiles p
SET plan_id = b.plan_id
FROM public.businesses b
WHERE b.owner_id = p.id
AND p.plan_id IS NULL;

-- 3. Cleanup: Remove plan_id from businesses table (optional, but requested for cleanup)
-- Uncomment the following if you are sure you want to stop storing plan_id on businesses
-- ALTER TABLE public.businesses DROP COLUMN IF EXISTS plan_id;

-- 4. Default for existing owners who don't have a plan yet
-- (e.g. Setting them to the 'Starter' plan)
DO $$
DECLARE
    starter_plan_id UUID;
BEGIN
    SELECT id INTO starter_plan_id FROM public.subscription_plans WHERE name = 'Starter' LIMIT 1;
    
    IF starter_plan_id IS NOT NULL THEN
        UPDATE public.profiles SET plan_id = starter_plan_id WHERE plan_id IS NULL AND role = 'owner';
    END IF;
END $$;
