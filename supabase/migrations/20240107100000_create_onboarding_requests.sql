-- Create onboarding_requests table
CREATE TABLE IF NOT EXISTS public.onboarding_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    wilaya TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    email TEXT,
    plan_id UUID REFERENCES public.subscription_plans(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'paid', 'active', 'rejected')),
    payment_proof TEXT,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.onboarding_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public insert for onboarding requests" ON public.onboarding_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow admin to manage onboarding requests" ON public.onboarding_requests
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.onboarding_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
