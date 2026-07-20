import { createContext, useContext, useState, type ReactNode } from "react";

export type Lang = "es" | "en";

type Dict = Record<string, { es: string; en: string }>;

export const T: Dict = {
  nav_home: { es: "Inicio", en: "Home" },
  nav_menu: { es: "Carta", en: "Menu" },
  nav_visit: { es: "Visítanos", en: "Visit" },
  nav_book: { es: "Reservar", en: "Book" },
  nav_order: { es: "Pedir", en: "Order" },
  nav_directions: { es: "Cómo llegar", en: "Get Directions" },

  hero_eyebrow: { es: "Auténtico café italiano · Valencia", en: "Authentic Italian Cafe · Valencia" },
  hero_title_1: { es: "Espresso italiano,", en: "Italian espresso," },
  hero_title_2: { es: "paninis y cócteles.", en: "paninis & cocktails." },
  hero_sub: {
    es: "Tú eliges cómo empezar el día...",
    en: "You Choose How to Start Your day...",
  },
  hero_cta_menu: { es: "Ver la carta", en: "Explore the menu" },
  hero_cta_book: { es: "Reservar mesa", en: "Book a table" },

  menu_eyebrow: { es: "La Carta", en: "The Menu" },
  menu_title: { es: "Hecho con amor italiano", en: "Made with Italian love" },
  menu_sub: {
    es: "\n",
    en: "\n",
  },
  cat_all: { es: "Todo", en: "All" },
  cat_coffee: { es: "Café", en: "Coffee" },
  cat_breakfast: { es: "Desayunos", en: "Breakfast" },
  cat_paninis: { es: "Paninis", en: "Paninis" },
  cat_cocktails: { es: "Cócteles", en: "Cocktails" },
  cat_desserts: { es: "Postres", en: "Desserts" },

  diet_vegan: { es: "Vegano", en: "Vegan" },
  diet_gf: { es: "Sin gluten", en: "Gluten-Free" },
  diet_nuts: { es: "Contiene frutos secos", en: "Contains Nuts" },
  diet_veg: { es: "Vegetariano", en: "Vegetarian" },

  visit_eyebrow: { es: "Visítanos", en: "Visit Us" },
  visit_title: { es: "Te esperamos en Vinatea", en: "See you on Vinatea" },
  visit_address: { es: "Dirección", en: "Address" },
  visit_hours: { es: "Horario", en: "Hours" },
  visit_phone: { es: "Teléfono", en: "Phone" },
  visit_directions: { es: "Abrir en Google Maps", en: "Open in Google Maps" },

  hours_weekday: { es: "Lun–Vie: 7:00 – 22:00", en: "Mon–Fri: 7:00 AM – 10:00 PM" },
  hours_weekend: { es: "Sáb–Dom: 9:00 – 22:00", en: "Sat–Sun: 9:00 AM – 10:00 PM" },

  open_now: { es: "Abierto ahora", en: "Open now" },
  closed_now: { es: "Cerrado", en: "Closed" },

  reserve_title: { es: "Reservar mesa", en: "Book a table" },
  reserve_date: { es: "Fecha", en: "Date" },
  reserve_time: { es: "Hora", en: "Time" },
  reserve_guests: { es: "Personas", en: "Guests" },
  reserve_name: { es: "Nombre", en: "Name" },
  reserve_notes: { es: "Peticiones especiales", en: "Special requests" },
  reserve_submit: { es: "Confirmar reserva", en: "Confirm reservation" },
  reserve_done: { es: "¡Gracias! Te confirmaremos pronto.", en: "Thanks! We'll confirm shortly." },

  order_title: { es: "Pedido para recoger", en: "Pickup order" },
  order_subtotal: { es: "Subtotal", en: "Subtotal" },
  order_checkout: { es: "Tramitar pedido", en: "Checkout" },
  order_empty: { es: "Tu pedido está vacío.", en: "Your order is empty." },
  order_done: { es: "¡Pedido recibido!", en: "Order received!" },
  out_of_stock: { es: "Agotado", en: "Out of stock" },
  menu_sync_alert: {
    es: "La carta digital se está sincronizando con la caja. Mostrando datos locales mientras tanto.",
    en: "Digital menu is syncing with the POS. Showing local data in the meantime.",
  },

  news_eyebrow: { es: "Únete al Baratto Club", en: "Join the Baratto Club" },
  news_title: { es: "Buen café en tu inbox", en: "Good coffee in your inbox" },
  news_sub: {
    es: "Novedades, cócteles de temporada y eventos exclusivos. Sin spam.",
    en: "New drops, seasonal cocktails and member events. No spam.",
  },
  news_email: { es: "tu@email.com", en: "you@email.com" },
  news_submit: { es: "Suscribirme", en: "Subscribe" },
  news_done: { es: "¡Suscrito! Revisa tu email.", en: "Subscribed! Check your inbox." },
  news_invalid: { es: "Introduce un email válido.", en: "Please enter a valid email." },

  story_eyebrow: { es: "Nuestra historia", en: "Our story" },
  story_title: { es: "Un trocito de Italia en Valencia", en: "A slice of Italy in Valencia" },
  story_body: {
    es: "Cafeteria Baratto nació del amor por el espresso de verdad — granos seleccionados, leche bien texturizada, y paninis prensados al momento. Junto al parque infantil, somos punto de encuentro de vecinos, viajeros y familias.",
    en: "Cafeteria Baratto was born from a love of real espresso — hand-picked beans, perfectly textured milk, and paninis pressed to order. Beside the children's park, we're a meeting spot for neighbours, travellers and families.",
  },

  hero_directions: { es: "Cómo llegar", en: "Directions" },

  blends_coming: { es: "Muy pronto", en: "Coming soon" },
  blends_title: { es: "Nuestros blends de café", en: "Our In-House Coffee Blends" },
  blends_sub: {
    es: "Tres tuestes de firma desarrollados con nuestro tostador en Valencia. Envasados, fechados y entregados en tu puerta.",
    en: "Three signature roasts developed with our Valencia roaster. Bagged, dated, delivered to your door.",
  },
  blends_preview: { es: "Vista previa", en: "Preview" },

  waitlist_title: { es: "Sé el primero", en: "Be first in line" },
  waitlist_sub: {
    es: "Déjanos tu email y te avisamos el día que enviemos las primeras bolsas.",
    en: "Drop your email we'll ping you the day the first bags ship.",
  },
  waitlist_placeholder: { es: "tu@email.com", en: "you@email.com" },
  waitlist_notify: { es: "Avísame", en: "Notify me" },
  waitlist_sending: { es: "Enviando…", en: "Sending…" },
  waitlist_done: { es: "¡Estás en la lista! Te escribiremos.", en: "You're on the list. We'll be in touch." },
  waitlist_invalid: { es: "Introduce un email válido.", en: "Please enter a valid email." },

  bridge_eyebrow: { es: "La carta completa", en: "The full menu" },
  bridge_title: { es: "Espresso, paninis, cócteles y postres", en: "Espresso, paninis, cocktails & desserts" },
  bridge_sub: {
    es: "Filtra por categoría. Precios en euros. Actualizado en vivo desde la barra.",
    en: "Filter by category. Prices in euros. Updated live from the counter.",
  },
  bridge_cta: { es: "Ver la carta", en: "View the menu" },

  menu_h1: { es: "Auténtica carta italiana en Valencia", en: "Authentic Italian Menu in Valencia" },
  menu_intro: {
    es: "Desde espresso de origen único y paninis prensados hasta desayunos, cócteles de firma y postres caseros cada plato se prepara al momento con ingredientes y técnica italianos. Precios en EUR, actualizados en vivo desde la barra.",
    en: "From single-origin espresso and pressed paninis to breakfast plates, signature cocktails and house-made desserts every item is prepared to order with Italian ingredients and technique. Prices in EUR, updated live from the counter.",
  },
  menu_browse: { es: "Explora nuestra selección", en: "Browse our selection" },

  book_eyebrow: { es: "Café Baratto", en: "Café Baratto" },
  book_title: { es: "Reserva tu sitio", en: "Reserve your spot" },
  book_sub: {
    es: "Elige fecha, comparte tus datos y te enviaremos la confirmación por email.",
    en: "Pick a date, share your details, and we'll email a confirmation.",
  },
  book_kind_table: { es: "Mesa", en: "Table" },
  book_kind_event: { es: "Evento", en: "Event" },

  offer_badge: { es: "Oferta especial", en: "Special offer" },
  offer_code: { es: "Código", en: "Code" },
  offer_copy: { es: "Copiar", en: "Copy" },
  offer_copied: { es: "Copiado", en: "Copied" },
  offer_untitled: { es: "Sin título", en: "Untitled" },

  footer_tagline: { es: "Tu café de barrio en Valencia.", en: "Your neighborhood cafe in Valencia." },
  footer_rights: { es: "Todos los derechos reservados.", en: "All rights reserved." },
};

const I18nCtx = createContext<{ lang: Lang; t: (k: keyof typeof T) => string; setLang: (l: Lang) => void }>({
  lang: "en",
  t: (k) => T[k]?.en ?? String(k),
  setLang: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const t = (k: keyof typeof T) => T[k]?.[lang] ?? String(k);
  return <I18nCtx.Provider value={{ lang, t, setLang }}>{children}</I18nCtx.Provider>;
}

export const useI18n = () => useContext(I18nCtx);
