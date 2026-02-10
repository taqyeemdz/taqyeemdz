-- 0. Ensure feedback-media bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('feedback-media', 'feedback-media', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload Feedback Media" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Feedback Media" ON storage.objects;

-- Allow public (anonymous) to upload to the feedback-media bucket
CREATE POLICY "Public Upload Feedback Media"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'feedback-media' );

-- Allow public read access to the feedback-media bucket
CREATE POLICY "Public Read Feedback Media"
ON storage.objects FOR SELECT
USING ( bucket_id = 'feedback-media' );

-- 1. Fill existing NULL plan_id in businesses from owner profiles
UPDATE public.businesses b
SET plan_id = p.plan_id
FROM public.profiles p
WHERE b.owner_id = p.id AND b.plan_id IS NULL;

-- 2. Ensure new businesses get a plan_id (fallback to Starter if owner has none, but they should have)
-- This is just a safety measure for existing rows that might still be NULL
DO $$
DECLARE
    starter_id UUID;
BEGIN
    SELECT id INTO starter_id FROM public.subscription_plans WHERE name = 'Starter' LIMIT 1;
    IF starter_id IS NOT NULL THEN
        UPDATE public.businesses SET plan_id = starter_id WHERE plan_id IS NULL;
    END IF;
END $$;

-- 3. Trigger to keep businesses.plan_id in sync with profiles.plan_id
CREATE OR REPLACE FUNCTION public.sync_business_plan()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.businesses
    SET plan_id = NEW.plan_id
    WHERE owner_id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_plan_update ON public.profiles;
CREATE TRIGGER on_profile_plan_update
    AFTER UPDATE OF plan_id ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_business_plan();

-- 4. Reload schema cache
NOTIFY pgrst, 'reload schema';
