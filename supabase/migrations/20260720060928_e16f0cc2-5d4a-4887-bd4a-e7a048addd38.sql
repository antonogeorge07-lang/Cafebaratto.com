
CREATE POLICY "Owners can upload offer images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'offer-images' AND public.is_staff(auth.uid()));

CREATE POLICY "Owners can update offer images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'offer-images' AND public.is_staff(auth.uid()))
  WITH CHECK (bucket_id = 'offer-images' AND public.is_staff(auth.uid()));

CREATE POLICY "Owners can delete offer images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'offer-images' AND public.is_staff(auth.uid()));

CREATE POLICY "Owners can read offer images" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'offer-images' AND public.is_staff(auth.uid()));
