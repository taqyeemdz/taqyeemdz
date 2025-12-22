-- Migration to relate businesses to subscription_plans
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.subscription_plans(id);

-- Set default plan_id to 'Starter' for all existing businesses
DO $$
DECLARE
    starter_id UUID;
BEGIN
    SELECT id INTO starter_id FROM public.subscription_plans WHERE name = 'Starter' LIMIT 1;
    
    IF starter_id IS NOT NULL THEN
        UPDATE public.businesses SET plan_id = starter_id WHERE plan_id IS NULL;
        
        -- Optionally, make it NOT NULL and set a default for new rows
        -- ALTER TABLE public.businesses ALTER COLUMN plan_id SET NOT NULL;
        -- ALTER TABLE public.businesses ALTER COLUMN plan_id SET DEFAULT starter_id;
    END IF;
END $$;
