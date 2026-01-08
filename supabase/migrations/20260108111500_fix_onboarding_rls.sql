-- Correct RLS policy for onboarding_requests to use app_metadata role
DROP POLICY IF EXISTS "Allow admin to manage onboarding requests" ON public.onboarding_requests;

CREATE POLICY "Allow admin to manage onboarding requests" ON public.onboarding_requests
    FOR ALL USING (
        (auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'superadmin')) OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'superadmin')
        )
    );
