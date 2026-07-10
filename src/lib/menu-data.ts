export type Diet = "vegan" | "gf" | "nuts" | "veg";

/**
 * Category is a free-form string keyed by the taxonomy below. We keep it as
 * `string` (instead of a union) so the admin can add fully custom categories
 * without breaking type-safety across the app.
 */
export type Category = string;

export interface MenuItem {
  id: string;
  category: Category;
  /** Optional free-text sub-category, e.g. "Espresso", "Croissants". */
  subcategory?: string;
  name: { es: string; en: string };
  desc: { es: string; en: string };
  price: number; // EUR
  diet: Diet[];
  image: string; // imported asset URL or data URL
  stock?: boolean;
  /** When true the item is hidden from the public menu (admin-only). */
  hidden?: boolean;
}

/**
 * Base taxonomy shown in the admin form. `presets` populate the sub-category
 * suggestion chips; admin can still type any custom sub-category.
 * `custom` means "make up your own parent category name" and lives in
 * `subcategory` when the admin picks it.
 */
export const BASE_CATEGORIES: {
  key: string;
  labelEn: string;
  labelEs: string;
  presets: string[];
}[] = [
  { key: "coffee", labelEn: "Coffee", labelEs: "Café", presets: ["Espresso", "Brewed", "Pour-over"] },
  { key: "drinks", labelEn: "Drinks & Juices", labelEs: "Bebidas y Zumos", presets: [] },
  { key: "food", labelEn: "Food", labelEs: "Comida", presets: ["Snacks", "Quick Bites", "Breads", "Croissants"] },
  { key: "beverages_desserts", labelEn: "Beverages & Desserts", labelEs: "Bebidas y Postres", presets: [] },
  { key: "custom", labelEn: "Custom", labelEs: "Personalizado", presets: [] },
];

/**
 * Legacy category list — kept so any older code / seed data continues to work
 * with existing i18n keys (cat_coffee, cat_breakfast, cat_paninis, ...).
 */
export const CATEGORIES: string[] = [
  "coffee",
  "breakfast",
  "paninis",
  "cocktails",
  "desserts",
];

/** Human-readable label for a category key (falls back to the raw key). */
export function categoryLabel(key: string, lang: "en" | "es" = "en"): string {
  const base = BASE_CATEGORIES.find((c) => c.key === key);
  if (base) return lang === "es" ? base.labelEs : base.labelEn;
  // Nice-case unknown keys, e.g. "cold_brew" → "Cold Brew".
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

import coffee from "@/assets/espresso-pull.jpg";
import latte from "@/assets/portafilter.jpg";
import pastry from "@/assets/pastry.jpg";
import piadina from "@/assets/food-piadina-bresaola.jpg";
import cheeseBoard from "@/assets/food-cheese-board.jpg";
import bruschetta from "@/assets/food-bruschetta.jpg";
import aperitivo from "@/assets/food-aperitivo.jpg";
import mortadella from "@/assets/food-mortadella-focaccia.jpg";
import mozzaSticks from "@/assets/food-mozzarella-sticks.jpg";
import focacciaTomato from "@/assets/food-focaccia-tomato.jpg";

export const MENU: MenuItem[] = [
  {
    id: "espresso",
    category: "coffee",
    subcategory: "Espresso",
    name: { es: "Espresso", en: "Espresso" },
    desc: { es: "Doble carga, crema dorada. Tostado italiano.", en: "Double shot, golden crema. Italian roast." },
    price: 1.6,
    diet: ["vegan", "gf"],
    image: coffee,
    stock: true,
  },
  {
    id: "cappuccino",
    category: "coffee",
    subcategory: "Espresso",
    name: { es: "Cappuccino", en: "Cappuccino" },
    desc: { es: "Espresso, leche texturizada, cacao.", en: "Espresso, silky milk, cocoa dusting." },
    price: 2.2,
    diet: ["veg", "gf"],
    image: latte,
    stock: true,
  },
  {
    id: "flatwhite",
    category: "coffee",
    subcategory: "Espresso",
    name: { es: "Flat White", en: "Flat White" },
    desc: { es: "Doble ristretto, microespuma sedosa.", en: "Double ristretto, silky microfoam." },
    price: 2.6,
    diet: ["veg", "gf"],
    image: coffee,
    stock: true,
  },
  {
    id: "tostada",
    category: "food",
    subcategory: "Breads",
    name: { es: "Tostada con tomate", en: "Tomato Toast" },
    desc: { es: "Pan artesano, tomate, AOVE y sal Maldon.", en: "Artisan bread, grated tomato, EVOO, Maldon salt." },
    price: 3.8,
    diet: ["vegan"],
    image: focacciaTomato,
    stock: true,
  },
  {
    id: "cornetto",
    category: "food",
    subcategory: "Croissants",
    name: { es: "Cornetto", en: "Cornetto" },
    desc: { es: "Croissant italiano, mantequilla francesa.", en: "Italian croissant, French butter." },
    price: 2.4,
    diet: ["veg", "nuts"],
    image: pastry,
    stock: true,
  },
  {
    id: "panini-prosciutto",
    category: "food",
    subcategory: "Paninis",
    name: { es: "Panini Prosciutto", en: "Prosciutto Panini" },
    desc: { es: "Prosciutto di Parma, mozzarella, rúcula.", en: "Prosciutto di Parma, mozzarella, rocket." },
    price: 7.5,
    diet: [],
    image: piadina,
    stock: true,
  },
  {
    id: "panini-caprese",
    category: "food",
    subcategory: "Paninis",
    name: { es: "Panini Caprese", en: "Caprese Panini" },
    desc: { es: "Mozzarella, tomate, albahaca, pesto.", en: "Mozzarella, tomato, basil, pesto." },
    price: 6.8,
    diet: ["veg", "nuts"],
    image: mortadella,
    stock: true,
  },
  {
    id: "panini-vegano",
    category: "food",
    subcategory: "Paninis",
    name: { es: "Panini Verde", en: "Green Panini" },
    desc: { es: "Hummus, berenjena asada, espinacas.", en: "Hummus, roasted eggplant, baby spinach." },
    price: 6.5,
    diet: ["vegan"],
    image: bruschetta,
    stock: true,
  },
  {
    id: "negroni",
    category: "beverages_desserts",
    subcategory: "Cocktails",
    name: { es: "Negroni", en: "Negroni" },
    desc: { es: "Gin, Campari, vermouth rosso. Naranja.", en: "Gin, Campari, vermouth rosso. Orange peel." },
    price: 8.5,
    diet: ["vegan", "gf"],
    image: aperitivo,
    stock: true,
  },
  {
    id: "spritz",
    category: "beverages_desserts",
    subcategory: "Cocktails",
    name: { es: "Aperol Spritz", en: "Aperol Spritz" },
    desc: { es: "Aperol, prosecco, soda, naranja.", en: "Aperol, prosecco, soda, orange." },
    price: 7.0,
    diet: ["vegan", "gf"],
    image: cheeseBoard,
    stock: true,
  },
  {
    id: "tiramisu",
    category: "beverages_desserts",
    subcategory: "Desserts",
    name: { es: "Tiramisú", en: "Tiramisù" },
    desc: { es: "Mascarpone, espresso, cacao. Receta de la nonna. ¨Hecho al momento¨", en: "Mascarpone, espresso, cocoa. Nonna's recipe. ¨Made to Order¨" },
    price: 4.8,
    diet: ["veg"],
    image: pastry,
    stock: true,
  },
  {
    id: "cannoli",
    category: "beverages_desserts",
    subcategory: "Desserts",
    name: { es: "Cannoli Siciliani", en: "Sicilian Cannoli" },
    desc: { es: "Ricotta, pistacho, chocolate.", en: "Ricotta, pistachio, chocolate." },
    price: 4.2,
    diet: ["veg", "nuts"],
    image: pastry,
    stock: true,
  },
  {
    id: "bocconcini",
    category: "food",
    subcategory: "Snacks",
    name: { es: "Bocconcini di Mozzarella", en: "Mozzarella Sticks" },
    desc: { es: "Mozzarella empanada, crujiente, salsa de calabaza.", en: "Breaded mozzarella, crisp, pumpkin dip." },
    price: 5.5,
    diet: ["veg"],
    image: mozzaSticks,
    stock: true,
  },
];
