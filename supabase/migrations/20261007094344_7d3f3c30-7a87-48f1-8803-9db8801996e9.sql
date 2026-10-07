REVOKE EXECUTE ON FUNCTION public.submit_payment_proof(uuid,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mark_payment_seen(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.review_payment(uuid,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_payment_proof(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_payment_seen(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_payment(uuid,boolean) TO authenticated;