CREATE TYPE public.access_plan AS ENUM ('free','paid');
ALTER TABLE public.profiles ADD COLUMN plan public.access_plan NOT NULL DEFAULT 'free';
ALTER TABLE public.documents ADD COLUMN is_free boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.guard_profile_status()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF (NEW.status IS DISTINCT FROM OLD.status OR NEW.plan IS DISTINCT FROM OLD.plan)
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can change approval status or plan';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_profile_insert()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.plan := 'free';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER profiles_guard_insert BEFORE INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.guard_profile_insert();

CREATE OR REPLACE FUNCTION public.can_access_file(_user_id uuid, _path text)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT public.has_role(_user_id, 'admin')
    OR (public.is_approved(_user_id) AND EXISTS (
      SELECT 1 FROM public.documents d WHERE d.storage_path = _path AND (
        d.kind IN ('exam','cours','td') OR d.is_free
        OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = _user_id AND p.plan = 'paid')
      )))
$$;

DROP POLICY "Approved read documents files" ON storage.objects;
CREATE POLICY "Approved read documents files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents' AND public.can_access_file(auth.uid(), name));