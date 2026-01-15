-- Fix RLS policies for system_settings to allow public read access
-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read-only access to settings" ON public.system_settings;
DROP POLICY IF EXISTS "Allow admin to manage settings" ON public.system_settings;

-- Recreate policies with better separation
-- Allow anyone (authenticated or not) to read settings
CREATE POLICY "Public can read settings" ON public.system_settings
    FOR SELECT 
    USING (true);

-- Allow only admins to insert/update/delete settings
CREATE POLICY "Admins can manage settings" ON public.system_settings
    FOR ALL 
    USING (
        auth.jwt() ->> 'role' IN ('admin', 'superadmin')
    )
    WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'superadmin')
    );
