-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    price NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'DZD',
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read-only access to plans" ON public.subscription_plans
    FOR SELECT USING (true);

CREATE POLICY "Allow admin to manage plans" ON public.subscription_plans
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Insert initial data
INSERT INTO public.subscription_plans (name, price, features)
VALUES 
    ('Starter', 29, '["1 Business", "100 Feedbacks/mo", "Standard QR"]'),
    ('Pro', 79, '["5 Businesses", "Unlimited Feedbacks", "Custom Branding", "Analytics"]'),
    ('Enterprise', 199, '["Unlimited Businesses", "Priority Support", "Dedicated Account Manager", "API Access"]')
ON CONFLICT (name) DO UPDATE 
SET price = EXCLUDED.price, features = EXCLUDED.features;
