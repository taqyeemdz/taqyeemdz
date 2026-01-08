-- Add user_id column to onboarding_requests table
-- Run this in your Supabase SQL Editor

ALTER TABLE public.onboarding_requests
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add comment
COMMENT ON COLUMN public.onboarding_requests.user_id IS 'Reference to the auth user created during registration';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_onboarding_requests_user_id ON public.onboarding_requests(user_id);

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'onboarding_requests'
  AND column_name IN ('user_id', 'password');
