-- Add media and audio toggles to businesses table
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS allow_media BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_audio BOOLEAN DEFAULT true;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
