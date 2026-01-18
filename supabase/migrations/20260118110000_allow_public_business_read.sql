-- Enable RLS on businesses if not enabled
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Drop existing read policy if exists to avoid conflict
DROP POLICY IF EXISTS "Public can view businesses" ON public.businesses;
DROP POLICY IF EXISTS "Anyone can view businesses" ON public.businesses;

-- Create policy to allow anyone to view businesses (needed for the public feedback form)
CREATE POLICY "Public can view businesses" ON public.businesses
    FOR SELECT USING (true);


-- Enable RLS on subscription_plans if not enabled
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Drop existing read policy
DROP POLICY IF EXISTS "Public can view plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Anyone can view plans" ON public.subscription_plans;

-- Create policy to allow anyone to view plans (needed to check media permissions)
CREATE POLICY "Public can view plans" ON public.subscription_plans
    FOR SELECT USING (true);
