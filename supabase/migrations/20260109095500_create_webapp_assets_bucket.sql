-- Create a public bucket for web app assets (logos, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('webapp-assets', 'webapp-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public read access to all objects in the bucket
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'webapp-assets' );

-- Policy: Allow authenticated users to upload objects (e.g. owners uploading logos)
CREATE POLICY "Authenticated Upload Access"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'webapp-assets' AND auth.role() = 'authenticated' );

-- Policy: Allow owners/admins to update/delete their own objects or all objects
-- For simplicity, let's allow authenticated users to update/delete for now, strictly scoped to the bucket
CREATE POLICY "Authenticated Update Access"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'webapp-assets' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated Delete Access"
ON storage.objects FOR DELETE
USING ( bucket_id = 'webapp-assets' AND auth.role() = 'authenticated' );
