-- Fix RLS policies for admin access
-- auth.jwt() ->> 'role' is usually 'authenticated', not the custom 'admin' role.
-- We check app_metadata -> role which is where Supabase stores custom roles set via admin.createUser or custom claims.

-- Drop old policies
DROP POLICY IF EXISTS "Allow admin to manage onboarding requests" ON public.onboarding_requests;
DROP POLICY IF EXISTS "Allow admin to manage plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Allow admin to manage settings" ON public.system_settings;

-- Create corrected policies for onboarding_requests
CREATE POLICY "Allow admin to manage onboarding requests" ON public.onboarding_requests
    FOR ALL USING (
        (auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'superadmin')) OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'superadmin')
        )
    );

-- Create corrected policies for subscription_plans
CREATE POLICY "Allow admin to manage plans" ON public.subscription_plans
    FOR ALL USING (
        (auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'superadmin')) OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'superadmin')
        )
    );

-- Create corrected policies for system_settings
CREATE POLICY "Allow admin to manage settings" ON public.system_settings
    FOR ALL USING (
        (auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'superadmin')) OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'superadmin')
        )
    );
