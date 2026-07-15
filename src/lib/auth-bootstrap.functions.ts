import { createServerFn } from "@tanstack/react-start";

/**
 * Public bootstrap check: does any owner exist yet?
 * Uses the service-role client so we don't need to expose the underlying
 * SECURITY DEFINER `owner_exists()` function to anon/authenticated via the Data API.
 */
export const checkOwnerExists = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("owner_exists");
  if (error) throw new Error(error.message);
  return { exists: !!data };
});
