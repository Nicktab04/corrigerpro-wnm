ALTER TABLE public.profiles ALTER COLUMN status SET DEFAULT 'approved'::public.access_status;
CREATE OR REPLACE FUNCTION public.guard_profile_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ BEGIN
  NEW.status := 'approved';
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.plan := 'free';
    NEW.subscription_expires_at := NULL;
    NEW.subscription_expiration_seen_at := NULL;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.guard_profile_insert() FROM PUBLIC, anon, authenticated;
COMMENT ON COLUMN public.profiles.status IS 'Automatically approved on registration; rejected is reserved for explicit administrator revocation. No manual signup approval.';