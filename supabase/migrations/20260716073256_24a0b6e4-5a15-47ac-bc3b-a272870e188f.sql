
REVOKE EXECUTE ON FUNCTION public.cancel_stale_orders()  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.daily_digest_stats()   FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.cancel_stale_orders()  TO service_role;
GRANT  EXECUTE ON FUNCTION public.daily_digest_stats()   TO service_role;
