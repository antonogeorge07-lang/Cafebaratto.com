import { createContext, useContext, useState, type ReactNode } from "react";

export type Lang = "es" | "en";

type Dict = Record<string, { es: string; en: string }>;

export const T: Dict = {
  nav_menu: { es: "Carta", en: "Menu" },
  nav_visit: { es: "Visítanos", en: "Visit" },
  nav_book: { es: "Reservar", en: "Book" },
  nav_order: { es: "Pedir", en: "Order" },
  nav_directions: { es: "Cómo llegar", en: "Get Directions" },

  hero_eyebrow: { es: "Auténtico café italiano · Valencia", en: "Authentic Italian Cafe · Valencia" },
  hero_title_1: { es: "Espresso italiano,", en: "Italian espresso," },
  hero_title_2: { es: "paninis y cócteles.", en: "paninis & cocktails." },
  hero_sub: {
    es: "Junto a la Plaza del Ayuntamiento. Desde 1992, sirviendo café de verdad, paninis recién hechos y cócteles de autor en el corazón de Valencia.",
    en: "Steps from Plaza del Ayuntamiento. Since 1992, pouring real coffee, fresh-pressed paninis and signature cocktails in the heart of Valencia.",
  },
  hero_cta_menu: { es: "Ver la carta", en: "Explore the menu" },
  hero_cta_book: { es: "Reservar mesa", en: "Book a table" },

  menu_eyebrow: { es: "La Carta", en: "The Menu" },
  menu_title: { es: "Hecho con amor italiano", en: "Made with Italian love" },
  menu_sub: {
    es: "Selecciona una categoría. Toda la carta, sin PDFs.",
    en: "Pick a category. Full menu, zero PDFs.",
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
