
-- Tighten anon INSERT policies on orders and bookings (replace WITH CHECK true with sanity constraints)

DROP POLICY IF EXISTS "orders anon insert" ON public.orders;
CREATE POLICY "orders anon insert" ON public.orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'active'
    AND subtotal >= 0
    AND subtotal <= 100000
    AND jsonb_typeof(items) = 'array'
    AND jsonb_array_length(items) BETWEEN 1 AND 100
    AND char_length(coalesce(customer_name, '')) <= 200
    AND char_length(coalesce(customer_contact, '')) <= 200
    AND char_length(coalesce(notes, '')) <= 2000
  );

DROP POLICY IF EXISTS "bookings anon insert" ON public.bookings;
CREATE POLICY "bookings anon insert" ON public.bookings
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    kind IN ('table','event')
    AND status = 'pending'
    AND party_size BETWEEN 1 AND 200
    AND when_at > (now() - interval '1 day')
    AND when_at < (now() + interval '2 years')
    AND char_length(coalesce(name, '')) BETWEEN 1 AND 200
    AND char_length(coalesce(contact, '')) BETWEEN 1 AND 200
    AND char_length(coalesce(notes, '')) <= 2000
    AND char_length(coalesce(event_type, '')) <= 200
  );
