-- Create system_settings table for global platform configurations
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read-only access to settings" ON public.system_settings
    FOR SELECT USING (true);

CREATE POLICY "Allow admin to manage settings" ON public.system_settings
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Insert default settings
INSERT INTO public.system_settings (key, value, description)
VALUES 
    ('platform_name', '"TaqyeemDZ"', 'The name of the platform displayed in emails and page titles.'),
    ('support_email', '"support@taqyeemdz.com"', 'The email address where user inquiries are sent.'),
    ('registrations_enabled', 'true', 'Whether new business owners can sign up.'),
    ('maintenance_mode', 'false', 'If true, only admins can access the platform.')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, description = EXCLUDED.description;
