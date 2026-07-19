ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS offer_slots JSONB NOT NULL DEFAULT '[
  {"visible": false, "title": "", "price": 0, "imageUrl": ""},
  {"visible": false, "title": "", "price": 0, "imageUrl": ""},
  {"visible": false, "title": "", "price": 0, "imageUrl": ""},
  {"visible": false, "title": "", "price": 0, "imageUrl": ""},
  {"visible": false, "title": "", "price": 0, "imageUrl": ""}
]'::jsonb;