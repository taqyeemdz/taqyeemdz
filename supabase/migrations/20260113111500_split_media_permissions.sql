-- Migration to separate allow_media into allow_photo and allow_video
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS allow_photo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS allow_video BOOLEAN DEFAULT false;

ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS allow_photo BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_video BOOLEAN DEFAULT true;

-- Copy existing allow_media values to allow_photo and allow_video for subscription_plans
UPDATE public.subscription_plans 
SET allow_photo = allow_media, 
    allow_video = allow_media;

-- For businesses, let's also initialize them with allow_media value if we want consistency
-- But since we just added allow_media to businesses, we can just sync them
UPDATE public.businesses
SET allow_photo = allow_media,
    allow_video = allow_media;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
