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

-- 1. Add owner details to businesses for public access
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS owner_avatar_url TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS owner_logo_url TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS owner_email TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS owner_full_name TEXT;

-- 2. Fill existing data
UPDATE public.businesses b
SET plan_id = p.plan_id,
    owner_avatar_url = p.avatar_url,
    owner_logo_url = p.logo_url,
    owner_email = p.email,
    owner_full_name = p.full_name
FROM public.profiles p
WHERE b.owner_id = p.id;

-- 3. Ensure new businesses get a plan_id (fallback to Starter if owner has none)
DO $$
DECLARE
    starter_id UUID;
BEGIN
    SELECT id INTO starter_id FROM public.subscription_plans WHERE name = 'Starter' LIMIT 1;
    IF starter_id IS NOT NULL THEN
        UPDATE public.businesses SET plan_id = starter_id WHERE plan_id IS NULL;
    END IF;
END $$;

-- 4. Trigger to keep businesses info in sync with owner profiles
CREATE OR REPLACE FUNCTION public.sync_business_from_profile()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.businesses
    SET plan_id = NEW.plan_id,
        owner_avatar_url = NEW.avatar_url,
        owner_logo_url = NEW.logo_url,
        owner_email = NEW.email,
        owner_full_name = NEW.full_name
    WHERE owner_id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_sync_business ON public.profiles;
CREATE TRIGGER on_profile_sync_business
    AFTER UPDATE OF plan_id, avatar_url, logo_url, email, full_name ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_business_from_profile();

-- 5. Reload schema cache
NOTIFY pgrst, 'reload schema';
