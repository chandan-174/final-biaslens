DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- Allow public reads of individual avatar files but disallow bucket listing
CREATE POLICY "Public can read individual avatar files"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] IS NOT NULL);