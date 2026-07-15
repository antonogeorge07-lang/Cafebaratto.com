-- Storage: drop the public-read policy conflicting with the private bucket
DROP POLICY IF EXISTS "menu-images public read" ON storage.objects;

-- Convert SECURITY DEFINER helpers to SECURITY INVOKER where callers can already
-- read the rows they need under RLS (user_roles allows "read own roles").
ALTER FUNCTION public.has_role(uuid, public.app_role) SECURITY INVOKER;
ALTER FUNCTION public.is_staff(uuid) SECURITY INVOKER;

-- owner_exists must scan all rows to check bootstrap state, so it stays
-- SECURITY DEFINER but is no longer callable from the Data API by anon/authenticated.
REVOKE EXECUTE ON FUNCTION public.owner_exists() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.owner_exists() TO service_role;