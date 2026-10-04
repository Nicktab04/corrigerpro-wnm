REVOKE EXECUTE ON FUNCTION public.can_access_file(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.guard_profile_insert() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.guard_profile_status() FROM anon, authenticated, public;