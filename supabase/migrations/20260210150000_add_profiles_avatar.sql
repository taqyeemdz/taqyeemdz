-- Create a public bucket for profiles
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public read access
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Public Read Access for profiles'
    ) THEN
        CREATE POLICY "Public Read Access for profiles"
        ON storage.objects FOR SELECT
        USING ( bucket_id = 'profiles' );
    END IF;
END $$;

-- Policy: Allow authenticated users to upload their own avatar
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Authenticated Upload for profiles'
    ) THEN
        CREATE POLICY "Authenticated Upload for profiles"
        ON storage.objects FOR INSERT
        WITH CHECK ( bucket_id = 'profiles' AND auth.role() = 'authenticated' );
    END IF;
END $$;

-- Policy: Allow users to update/delete their own objects
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Authenticated Update for profiles'
    ) THEN
        CREATE POLICY "Authenticated Update for profiles"
        ON storage.objects FOR UPDATE
        USING ( bucket_id = 'profiles' AND auth.role() = 'authenticated' );
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Authenticated Delete for profiles'
    ) THEN
        CREATE POLICY "Authenticated Delete for profiles"
        ON storage.objects FOR DELETE
        USING ( bucket_id = 'profiles' AND auth.role() = 'authenticated' );
    END IF;
END $$;

-- Add avatar_url and logo_url to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Enable RLS on profiles if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING ( auth.uid() = id );

-- Policy: Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING ( auth.uid() = id );

-- Policy: Public profiles are viewable by everyone (optional, based on your needs)
-- DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
-- CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

