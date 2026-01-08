-- Add description column to businesses table
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS description text;
