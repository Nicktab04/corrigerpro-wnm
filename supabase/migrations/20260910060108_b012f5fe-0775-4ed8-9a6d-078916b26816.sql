CREATE POLICY "Approved read documents files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND (public.is_approved(auth.uid()) OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Uploaders write documents files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'uploader')));
CREATE POLICY "Admins delete documents files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'));