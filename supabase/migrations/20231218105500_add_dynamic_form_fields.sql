-- Add form_config to businesses table
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS form_config JSONB DEFAULT '[]'::jsonb;

-- Add custom_responses to feedback table
ALTER TABLE public.feedback 
ADD COLUMN IF NOT EXISTS custom_responses JSONB DEFAULT '{}'::jsonb;
