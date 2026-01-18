ALTER TABLE businesses 
ADD COLUMN require_photo BOOLEAN DEFAULT false,
ADD COLUMN require_video BOOLEAN DEFAULT false,
ADD COLUMN require_audio BOOLEAN DEFAULT false;
