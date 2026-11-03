CREATE OR REPLACE FUNCTION public.guard_profile_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ BEGIN
  IF ((NEW.status IS DISTINCT FROM OLD.status AND NOT (OLD.status = 'pending' AND NEW.status = 'approved')) OR NEW.plan IS DISTINCT FROM OLD.plan OR NEW.subscription_expires_at IS DISTINCT FROM OLD.subscription_expires_at) AND NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Only admins can change access status, plan or subscription expiry'; END IF;
  IF NEW.subscription_expiration_seen_at IS DISTINCT FROM OLD.subscription_expiration_seen_at AND NOT public.has_role(auth.uid(), 'admin') AND (NEW.subscription_expiration_seen_at IS DISTINCT FROM OLD.subscription_expires_at OR OLD.subscription_expires_at IS NULL OR OLD.subscription_expires_at > now()) THEN RAISE EXCEPTION 'Subscription has not expired'; END IF;
  IF NEW.plan = 'free' AND NEW.plan IS DISTINCT FROM OLD.plan THEN NEW.subscription_expires_at := NULL; END IF;
  IF NEW.plan = 'paid' AND NEW.plan IS DISTINCT FROM OLD.plan AND NEW.subscription_expires_at IS NULL THEN SELECT now() + make_interval(months => subscription_duration_months) INTO NEW.subscription_expires_at FROM public.app_settings WHERE id = 1; END IF;
  NEW.updated_at := now(); RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.guard_profile_status() FROM PUBLIC, anon, authenticated;