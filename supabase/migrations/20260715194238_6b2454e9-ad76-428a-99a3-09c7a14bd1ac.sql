
CREATE POLICY "menu-images public read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'menu-images');
