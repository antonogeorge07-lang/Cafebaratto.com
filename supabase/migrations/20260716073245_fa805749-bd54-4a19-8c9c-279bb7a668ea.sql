
-- =========================
-- Analytics views
-- =========================

CREATE OR REPLACE VIEW public.revenue_by_day
WITH (security_invoker = true) AS
SELECT
  (placed_at AT TIME ZONE 'UTC')::date AS day,
  COUNT(*)::int AS orders_count,
  COUNT(*) FILTER (WHERE status = 'fulfilled')::int AS fulfilled_count,
  COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled_count,
  COALESCE(SUM(subtotal) FILTER (WHERE status <> 'cancelled'), 0)::numeric(12,2) AS revenue,
  currency
FROM public.orders
WHERE placed_at >= (now() - interval '90 days')
GROUP BY day, currency
ORDER BY day DESC;

CREATE OR REPLACE VIEW public.top_items
WITH (security_invoker = true) AS
SELECT
  (item->>'id')                       AS item_id,
  (item->>'name')                     AS name,
  SUM((item->>'qty')::int)::int       AS qty_sold,
  SUM(((item->>'qty')::int) * ((item->>'unitPrice')::numeric))::numeric(12,2) AS revenue
FROM public.orders,
     LATERAL jsonb_array_elements(items) AS item
WHERE placed_at >= (now() - interval '30 days')
  AND status <> 'cancelled'
GROUP BY item_id, name
ORDER BY qty_sold DESC
LIMIT 25;

CREATE OR REPLACE VIEW public.avg_prep_minutes
WITH (security_invoker = true) AS
SELECT
  (placed_at AT TIME ZONE 'UTC')::date AS day,
  ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - placed_at)) / 60.0)::numeric, 2) AS avg_minutes,
  COUNT(*)::int AS fulfilled_count
FROM public.orders
WHERE status = 'fulfilled'
  AND placed_at >= (now() - interval '30 days')
GROUP BY day
ORDER BY day DESC;

-- Only staff should see these; views inherit RLS from orders via security_invoker.
REVOKE ALL ON public.revenue_by_day FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.top_items       FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.avg_prep_minutes FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.revenue_by_day  TO authenticated;
GRANT SELECT ON public.top_items       TO authenticated;
GRANT SELECT ON public.avg_prep_minutes TO authenticated;
GRANT SELECT ON public.revenue_by_day  TO service_role;
GRANT SELECT ON public.top_items       TO service_role;
GRANT SELECT ON public.avg_prep_minutes TO service_role;

-- =========================
-- Auto-cancel stale orders
-- =========================
CREATE OR REPLACE FUNCTION public.cancel_stale_orders()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE affected int;
BEGIN
  WITH updated AS (
    UPDATE public.orders
       SET status = 'cancelled',
           updated_at = now()
     WHERE status = 'active'
       AND placed_at < (now() - interval '30 minutes')
    RETURNING id
  )
  SELECT count(*)::int INTO affected FROM updated;
  RETURN affected;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_stale_orders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_stale_orders() TO service_role;

-- =========================
-- Daily digest data helper
-- =========================
CREATE OR REPLACE FUNCTION public.daily_digest_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  day_start timestamptz := date_trunc('day', now() - interval '1 day');
  day_end   timestamptz := date_trunc('day', now());
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'date', to_char(day_start, 'YYYY-MM-DD'),
    'orders_total',      COALESCE((SELECT count(*)  FROM public.orders WHERE placed_at >= day_start AND placed_at < day_end), 0),
    'orders_fulfilled',  COALESCE((SELECT count(*)  FROM public.orders WHERE placed_at >= day_start AND placed_at < day_end AND status = 'fulfilled'), 0),
    'orders_cancelled',  COALESCE((SELECT count(*)  FROM public.orders WHERE placed_at >= day_start AND placed_at < day_end AND status = 'cancelled'), 0),
    'revenue',           COALESCE((SELECT SUM(subtotal) FROM public.orders WHERE placed_at >= day_start AND placed_at < day_end AND status <> 'cancelled'), 0),
    'currency',          COALESCE((SELECT currency FROM public.orders WHERE placed_at >= day_start AND placed_at < day_end LIMIT 1), 'EUR'),
    'bookings_new',      COALESCE((SELECT count(*)  FROM public.bookings WHERE created_at >= day_start AND created_at < day_end), 0),
    'bookings_confirmed',COALESCE((SELECT count(*)  FROM public.bookings WHERE created_at >= day_start AND created_at < day_end AND status = 'confirmed'), 0),
    'top_items',         COALESCE((
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT (item->>'name') AS name, SUM((item->>'qty')::int)::int AS qty
        FROM public.orders, LATERAL jsonb_array_elements(items) AS item
        WHERE placed_at >= day_start AND placed_at < day_end AND status <> 'cancelled'
        GROUP BY name
        ORDER BY qty DESC
        LIMIT 5
      ) t
    ), '[]'::jsonb)
  ) INTO result;
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.daily_digest_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.daily_digest_stats() TO service_role;
