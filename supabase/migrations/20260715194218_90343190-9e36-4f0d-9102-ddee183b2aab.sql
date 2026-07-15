
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'owner');
$$;

-- menu_items
CREATE TABLE public.menu_items (
  id text PRIMARY KEY,
  category_key text NOT NULL,
  category_custom text,
  name_es text NOT NULL,
  name_en text NOT NULL,
  desc_es text NOT NULL DEFAULT '',
  desc_en text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  diet text[] NOT NULL DEFAULT '{}',
  image_url text,
  stock boolean NOT NULL DEFAULT true,
  hidden boolean NOT NULL DEFAULT false,
  sort integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.menu_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_items TO authenticated;
GRANT ALL ON public.menu_items TO service_role;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "menu_items public read visible" ON public.menu_items FOR SELECT TO anon, authenticated
  USING (hidden = false OR public.is_staff(auth.uid()));
CREATE POLICY "menu_items staff insert" ON public.menu_items FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "menu_items staff update" ON public.menu_items FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "menu_items staff delete" ON public.menu_items FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE TRIGGER menu_items_set_updated_at BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- site_settings
CREATE TABLE public.site_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  offer_enabled boolean NOT NULL DEFAULT false,
  offer_headline text NOT NULL DEFAULT '',
  offer_body text NOT NULL DEFAULT '',
  offer_code text NOT NULL DEFAULT '',
  offer_cta_label text NOT NULL DEFAULT '',
  offer_cta_href text NOT NULL DEFAULT '',
  menu_visible boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_settings public read" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "site_settings staff write" ON public.site_settings FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER site_settings_set_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- orders
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE DEFAULT ('ORD-' || to_char(now(),'YYMMDD') || '-' || substr(md5(random()::text),1,6)),
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','preparing','ready','fulfilled','cancelled')),
  customer_name text,
  customer_contact text,
  notes text,
  placed_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders anon insert" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "orders staff read" ON public.orders FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "orders staff update" ON public.orders FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "orders staff delete" ON public.orders FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));
CREATE TRIGGER orders_set_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX orders_status_idx ON public.orders (status);
CREATE INDEX orders_placed_at_idx ON public.orders (placed_at DESC);

-- bookings
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('table','event')),
  name text NOT NULL,
  contact text NOT NULL,
  party_size integer NOT NULL DEFAULT 1 CHECK (party_size > 0),
  when_at timestamptz NOT NULL,
  notes text,
  event_type text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.bookings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings anon insert" ON public.bookings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "bookings staff read" ON public.bookings FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "bookings staff update" ON public.bookings FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "bookings staff delete" ON public.bookings FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));
CREATE TRIGGER bookings_set_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX bookings_when_at_idx ON public.bookings (when_at);
CREATE INDEX bookings_status_idx ON public.bookings (status);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;

-- Seed settings
INSERT INTO public.site_settings (id, offer_enabled, offer_headline, offer_body, offer_code, offer_cta_label, offer_cta_href, menu_visible)
VALUES (1, false, 'Happy Hour · 2×1 on Spritz', 'Every Thursday, 6-8pm. Show this code at the counter to unlock the deal.', 'SPRITZ2X1', 'Book a table', '#book', true)
ON CONFLICT (id) DO NOTHING;

-- Seed menu
INSERT INTO public.menu_items (id, category_key, category_custom, name_es, name_en, desc_es, desc_en, price, diet, stock, sort) VALUES
  ('espresso','coffee','Espresso','Espresso','Espresso','Doble carga, crema dorada. Tostado italiano.','Double shot, golden crema. Italian roast.',1.60, ARRAY['vegan','gf'], true, 10),
  ('cappuccino','coffee','Espresso','Cappuccino','Cappuccino','Espresso, leche texturizada, cacao.','Espresso, silky milk, cocoa dusting.',2.20, ARRAY['veg','gf'], true, 20),
  ('flatwhite','coffee','Espresso','Flat White','Flat White','Doble ristretto, microespuma sedosa.','Double ristretto, silky microfoam.',2.60, ARRAY['veg','gf'], true, 30),
  ('tostada','food','Breads','Tostada con tomate','Tomato Toast','Pan artesano, tomate, AOVE y sal Maldon.','Artisan bread, grated tomato, EVOO, Maldon salt.',3.80, ARRAY['vegan'], true, 40),
  ('cornetto','food','Croissants','Cornetto','Cornetto','Croissant italiano, mantequilla francesa.','Italian croissant, French butter.',2.40, ARRAY['veg','nuts'], true, 50),
  ('panini-prosciutto','food','Paninis','Panini Prosciutto','Prosciutto Panini','Prosciutto di Parma, mozzarella, rúcula.','Prosciutto di Parma, mozzarella, rocket.',7.50, ARRAY[]::text[], true, 60),
  ('panini-caprese','food','Paninis','Panini Caprese','Caprese Panini','Mozzarella, tomate, albahaca, pesto.','Mozzarella, tomato, basil, pesto.',6.80, ARRAY['veg','nuts'], true, 70),
  ('panini-vegano','food','Paninis','Panini Verde','Green Panini','Hummus, berenjena asada, espinacas.','Hummus, roasted eggplant, baby spinach.',6.50, ARRAY['vegan'], true, 80),
  ('bocconcini','food','Snacks','Bocconcini di Mozzarella','Mozzarella Sticks','Mozzarella empanada, crujiente, salsa de calabaza.','Breaded mozzarella, crisp, pumpkin dip.',5.50, ARRAY['veg'], true, 90),
  ('negroni','beverages_desserts','Cocktails','Negroni','Negroni','Gin, Campari, vermouth rosso. Naranja.','Gin, Campari, vermouth rosso. Orange peel.',8.50, ARRAY['vegan','gf'], true, 100),
  ('spritz','beverages_desserts','Cocktails','Aperol Spritz','Aperol Spritz','Aperol, prosecco, soda, naranja.','Aperol, prosecco, soda, orange.',7.00, ARRAY['vegan','gf'], true, 110),
  ('tiramisu','beverages_desserts','Desserts','Tiramisú','Tiramisù','Mascarpone, espresso, cacao. Receta de la nonna. ¨Hecho al momento¨','Mascarpone, espresso, cocoa. Nonna''s recipe. ¨Made to Order¨',4.80, ARRAY['veg'], true, 120),
  ('cannoli','beverages_desserts','Desserts','Cannoli Siciliani','Sicilian Cannoli','Ricotta, pistacho, chocolate.','Ricotta, pistachio, chocolate.',4.20, ARRAY['veg','nuts'], true, 130)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for menu-images
CREATE POLICY "menu-images staff insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'menu-images' AND public.is_staff(auth.uid()));
CREATE POLICY "menu-images staff update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'menu-images' AND public.is_staff(auth.uid()))
  WITH CHECK (bucket_id = 'menu-images' AND public.is_staff(auth.uid()));
CREATE POLICY "menu-images staff delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'menu-images' AND public.is_staff(auth.uid()));
