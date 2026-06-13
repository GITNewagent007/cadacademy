
DROP POLICY IF EXISTS "Admins manage taxonomy" ON public.practice_taxonomy;
CREATE POLICY "Admins manage taxonomy"
  ON public.practice_taxonomy
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins read practice-assets" ON storage.objects;
CREATE POLICY "Admins read practice-assets"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'practice-assets' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins write practice-assets" ON storage.objects;
CREATE POLICY "Admins write practice-assets"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'practice-assets' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update practice-assets" ON storage.objects;
CREATE POLICY "Admins update practice-assets"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'practice-assets' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'practice-assets' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins delete practice-assets" ON storage.objects;
CREATE POLICY "Admins delete practice-assets"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'practice-assets' AND public.has_role(auth.uid(), 'admin'));
