-- Add direct foreign key from onboarding_requests(user_id) to profiles(id)
-- This enables PostgREST to join these tables easily
ALTER TABLE public.onboarding_requests
DROP CONSTRAINT IF EXISTS onboarding_requests_user_id_fkey,
ADD CONSTRAINT onboarding_requests_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;
