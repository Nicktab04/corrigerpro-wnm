ALTER TABLE public.app_settings ADD COLUMN subscription_duration_months integer NOT NULL DEFAULT 1;
ALTER TABLE public.app_settings ADD CONSTRAINT positive_subscription_duration CHECK (subscription_duration_months > 0);
ALTER TABLE public.payment_requests ADD COLUMN subscription_duration_months integer;
UPDATE public.payment_requests SET subscription_duration_months = 1 WHERE kind = 'subscription';
ALTER TABLE public.profiles ADD COLUMN subscription_expires_at timestamptz, ADD COLUMN subscription_expiration_seen_at timestamptz;
UPDATE public.profiles p SET subscription_expires_at = s.confirmed_at + interval '1 month' FROM (SELECT user_id, max(updated_at) AS confirmed_at FROM public.payment_requests WHERE kind = 'subscription' AND status = 'approved' GROUP BY user_id) s WHERE p.id = s.user_id AND p.plan = 'paid';
CREATE OR REPLACE FUNCTION public.snapshot_subscription_duration() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN
  IF NEW.kind = 'subscription' THEN SELECT subscription_duration_months INTO NEW.subscription_duration_months FROM public.app_settings WHERE id = 1; ELSE NEW.subscription_duration_months := NULL; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER payment_subscription_duration BEFORE INSERT ON public.payment_requests FOR EACH ROW EXECUTE FUNCTION public.snapshot_subscription_duration();
CREATE OR REPLACE FUNCTION public.guard_profile_insert() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN NEW.plan := 'free'; NEW.subscription_expires_at := NULL; NEW.subscription_expiration_seen_at := NULL; END IF;
  RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.guard_profile_status() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN
  IF (NEW.status IS DISTINCT FROM OLD.status OR NEW.plan IS DISTINCT FROM OLD.plan OR NEW.subscription_expires_at IS DISTINCT FROM OLD.subscription_expires_at) AND NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Only admins can change approval status, plan or subscription expiry'; END IF;
  IF NEW.subscription_expiration_seen_at IS DISTINCT FROM OLD.subscription_expiration_seen_at AND NOT public.has_role(auth.uid(), 'admin') AND (NEW.subscription_expiration_seen_at IS DISTINCT FROM OLD.subscription_expires_at OR OLD.subscription_expires_at IS NULL OR OLD.subscription_expires_at > now()) THEN RAISE EXCEPTION 'Subscription has not expired'; END IF;
  IF NEW.plan = 'free' AND NEW.plan IS DISTINCT FROM OLD.plan THEN NEW.subscription_expires_at := NULL; END IF;
  IF NEW.plan = 'paid' AND NEW.plan IS DISTINCT FROM OLD.plan AND NEW.subscription_expires_at IS NULL THEN SELECT now() + make_interval(months => subscription_duration_months) INTO NEW.subscription_expires_at FROM public.app_settings WHERE id = 1; END IF;
  NEW.updated_at := now(); RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.review_payment(_id uuid, _approve boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ DECLARE r public.payment_requests; BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Réservé aux administrateurs'; END IF;
  SELECT * INTO r FROM public.payment_requests WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Demande introuvable'; END IF;
  IF r.status <> 'pending' THEN RAISE EXCEPTION 'Cette demande a déjà été traitée ou attend une capture'; END IF;
  UPDATE public.payment_requests SET status = CASE WHEN _approve THEN 'approved'::payment_status ELSE 'rejected'::payment_status END, student_seen = false, updated_at = now() WHERE id = _id;
  IF _approve THEN
    IF r.kind = 'subscription' THEN
      PERFORM 1 FROM public.profiles WHERE id = r.user_id FOR UPDATE;
      UPDATE public.profiles SET plan = 'paid', subscription_expires_at = greatest(now(), subscription_expires_at) + make_interval(months => coalesce(r.subscription_duration_months, 1)), subscription_expiration_seen_at = NULL WHERE id = r.user_id;
    ELSIF r.document_id IS NOT NULL THEN INSERT INTO public.document_unlocks(user_id, document_id) VALUES (r.user_id, r.document_id) ON CONFLICT DO NOTHING;
    END IF;
  END IF;
END $$;
CREATE OR REPLACE FUNCTION public.can_access_file(_user_id uuid, _path text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT public.has_role(_user_id, 'admin') OR (public.is_approved(_user_id) AND EXISTS (SELECT 1 FROM public.documents d WHERE d.storage_path = _path AND (d.kind IN ('exam','cours','td') OR d.is_free OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = _user_id AND p.plan = 'paid' AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > now())) OR EXISTS (SELECT 1 FROM public.document_unlocks u WHERE u.user_id = _user_id AND u.document_id = d.id))))
$$;
CREATE OR REPLACE FUNCTION public.mark_subscription_expiration_seen() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN
 UPDATE public.profiles SET subscription_expiration_seen_at = subscription_expires_at WHERE id = auth.uid() AND subscription_expires_at <= now();
END $$;
REVOKE ALL ON FUNCTION public.mark_subscription_expiration_seen() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_subscription_expiration_seen() TO authenticated;
CREATE OR REPLACE FUNCTION public.set_student_plan(_id uuid, _paid boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Réservé aux administrateurs'; END IF;
 UPDATE public.profiles SET plan = CASE WHEN _paid THEN 'paid'::access_plan ELSE 'free'::access_plan END, subscription_expires_at = CASE WHEN _paid THEN now() + make_interval(months => (SELECT subscription_duration_months FROM public.app_settings WHERE id = 1)) ELSE NULL END, subscription_expiration_seen_at = NULL WHERE id = _id;
END $$;
REVOKE ALL ON FUNCTION public.set_student_plan(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_student_plan(uuid, boolean) TO authenticated;