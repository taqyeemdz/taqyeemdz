ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'qrcode';

-- Create widget_settings table
CREATE TABLE IF NOT EXISTS public.widget_settings (
    business_id UUID PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT true,
    button_color TEXT DEFAULT '#10b981', -- default emerald-500
    button_text TEXT DEFAULT 'Donnez votre avis',
    position TEXT DEFAULT 'bottom-right', -- bottom-right, bottom-left
    api_key UUID DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.widget_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Owners can manage their own widget settings
CREATE POLICY "Owners can manage their own widget settings" 
ON public.widget_settings 
FOR ALL 
USING (
    business_id IN (
        SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
)
WITH CHECK (
    business_id IN (
        SELECT id FROM public.businesses WHERE owner_id = auth.uid()
    )
);

-- Policy: Public can read widget settings (needed for the widget to fetch its config)
CREATE POLICY "Public can read widget settings"
ON public.widget_settings
FOR SELECT
USING (true);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER set_widget_settings_updated_at
BEFORE UPDATE ON public.widget_settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
