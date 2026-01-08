-- Add password column to onboarding_requests table
ALTER TABLE public.onboarding_requests
ADD COLUMN IF NOT EXISTS password TEXT;

-- Add user_id column to link to created auth user
ALTER TABLE public.onboarding_requests
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add comments to explain the columns
COMMENT ON COLUMN public.onboarding_requests.password IS 'Password chosen by the owner during onboarding request submission';
COMMENT ON COLUMN public.onboarding_requests.user_id IS 'Reference to the auth user created during registration';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_onboarding_requests_user_id ON public.onboarding_requests(user_id);
