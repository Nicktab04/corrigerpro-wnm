CREATE TYPE public.payment_kind AS ENUM ('document','subscription');
CREATE TYPE public.payment_status AS ENUM ('awaiting_proof','pending','approved','rejected');

CREATE TABLE public.payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind public.payment_kind NOT NULL,
  document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  amount integer NOT NULL DEFAULT 0,
  status public.payment_status NOT NULL DEFAULT 'awaiting_proof',
  screenshot_path text,
  student_seen boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.payment_requests(user_id);
CREATE INDEX ON public.payment_requests(status);
GRANT SELECT, INSERT ON public.payment_requests TO authenticated;
GRANT ALL ON public.payment_requests TO service_role;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read own payments" ON public.payment_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Students create own payments" ON public.payment_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'awaiting_proof' AND screenshot_path IS NULL
    AND (kind = 'subscription' OR document_id IS NOT NULL));

CREATE TABLE public.document_unlocks (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, document_id)
);
GRANT SELECT ON public.document_unlocks TO authenticated;
GRANT ALL ON public.document_unlocks TO service_role;
ALTER TABLE public.document_unlocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own unlocks" ON public.document_unlocks FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.submit_payment_proof(_id uuid, _path text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _path IS NULL OR split_part(_path,'/',1) <> auth.uid()::text THEN
    RAISE EXCEPTION 'Capture invalide';
  END IF;
  UPDATE public.payment_requests
    SET screenshot_path = _path, status = 'pending', updated_at = now()
    WHERE id = _id AND user_id = auth.uid() AND status IN ('awaiting_proof','pending','rejected');
  IF NOT FOUND THEN RAISE EXCEPTION 'Demande introuvable'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.mark_payment_seen(_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.payment_requests SET student_seen = true WHERE id = _id AND user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.review_payment(_id uuid, _approve boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.payment_requests;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Réservé aux administrateurs'; END IF;
  SELECT * INTO r FROM public.payment_requests WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Demande introuvable'; END IF;
  UPDATE public.payment_requests
    SET status = CASE WHEN _approve THEN 'approved'::payment_status ELSE 'rejected'::payment_status END,
        student_seen = false, updated_at = now()
    WHERE id = _id;
  IF _approve THEN
    IF r.kind = 'subscription' THEN
      UPDATE public.profiles SET plan = 'paid' WHERE id = r.user_id;
    ELSIF r.document_id IS NOT NULL THEN
      INSERT INTO public.document_unlocks(user_id, document_id) VALUES (r.user_id, r.document_id)
        ON CONFLICT DO NOTHING;
    END IF;
  END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public.submit_payment_proof(uuid,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.mark_payment_seen(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.review_payment(uuid,boolean) FROM anon;

CREATE OR REPLACE FUNCTION public.can_access_file(_user_id uuid, _path text)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT public.has_role(_user_id, 'admin')
    OR (public.is_approved(_user_id) AND EXISTS (
      SELECT 1 FROM public.documents d WHERE d.storage_path = _path AND (
        d.kind IN ('exam','cours','td') OR d.is_free
        OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = _user_id AND p.plan = 'paid')
        OR EXISTS (SELECT 1 FROM public.document_unlocks u WHERE u.user_id = _user_id AND u.document_id = d.id)
      )))
$function$;

CREATE POLICY "Students upload own proofs" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Read own or admin proofs" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'payment-proofs' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(),'admin')));