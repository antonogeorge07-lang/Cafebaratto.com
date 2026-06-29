export type Diet = "vegan" | "gf" | "nuts" | "veg";
export type Category = "coffee" | "breakfast" | "paninis" | "cocktails" | "desserts";

export interface MenuItem {
  id: string;
  category: Category;
  name: { es: string; en: string };
  desc: { es: string; en: string };
  price: number; // EUR
  diet: Diet[];
  image: string; // imported asset URL
  stock?: boolean;
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
    name: { es: "Flat White", en: "Flat White" },
    desc: { es: "Doble ristretto, microespuma sedosa.", en: "Double ristretto, silky microfoam." },
    price: 2.6,
    diet: ["veg", "gf"],
    image: coffee,
    stock: true,
  },
  {
    id: "tostada",
    category: "breakfast",
    name: { es: "Tostada con tomate", en: "Tomato Toast" },
    desc: { es: "Pan artesano, tomate, AOVE y sal Maldon.", en: "Artisan bread, grated tomato, EVOO, Maldon salt." },
    price: 3.8,
    diet: ["vegan"],
    image: breakfast,
    stock: true,
  },
  {
    id: "cornetto",
    category: "breakfast",
    name: { es: "Cornetto", en: "Cornetto" },
    desc: { es: "Croissant italiano, mantequilla francesa.", en: "Italian croissant, French butter." },
    price: 2.4,
    diet: ["veg", "nuts"],
    image: pastry,
    stock: true,
  },
  {
    id: "panini-prosciutto",
    category: "paninis",
    name: { es: "Panini Prosciutto", en: "Prosciutto Panini" },
    desc: { es: "Prosciutto di Parma, mozzarella, rúcula.", en: "Prosciutto di Parma, mozzarella, rocket." },
    price: 7.5,
    diet: [],
    image: interior,
    stock: true,
  },
  {
    id: "panini-caprese",
    category: "paninis",
    name: { es: "Panini Caprese", en: "Caprese Panini" },
    desc: { es: "Mozzarella, tomate, albahaca, pesto.", en: "Mozzarella, tomato, basil, pesto." },
    price: 6.8,
    diet: ["veg", "nuts"],
    image: storefront,
    stock: true,
  },
  {
    id: "panini-vegano",
    category: "paninis",
    name: { es: "Panini Verde", en: "Green Panini" },
    desc: { es: "Hummus, berenjena asada, espinacas.", en: "Hummus, roasted eggplant, baby spinach." },
    price: 6.5,
    diet: ["vegan"],
    image: breakfast,
    stock: true,
  },
  {
    id: "negroni",
    category: "cocktails",
    name: { es: "Negroni", en: "Negroni" },
    desc: { es: "Gin, Campari, vermouth rosso. Naranja.", en: "Gin, Campari, vermouth rosso. Orange peel." },
    price: 8.5,
    diet: ["vegan", "gf"],
    image: interior,
    stock: true,
  },
  {
    id: "spritz",
    category: "cocktails",
    name: { es: "Aperol Spritz", en: "Aperol Spritz" },
    desc: { es: "Aperol, prosecco, soda, naranja.", en: "Aperol, prosecco, soda, orange." },
    price: 7.0,
    diet: ["vegan", "gf"],
    image: storefront,
    stock: true,
  },
  {
    id: "tiramisu",
    category: "desserts",
    name: { es: "Tiramisú", en: "Tiramisù" },
    desc: { es: "Mascarpone, espresso, cacao. Receta de la nonna.", en: "Mascarpone, espresso, cocoa. Nonna's recipe." },
    price: 4.8,
    diet: ["veg"],
    image: pastry,
    stock: true,
  },
  {
    id: "cannoli",
    category: "desserts",
    name: { es: "Cannoli Siciliani", en: "Sicilian Cannoli" },
    desc: { es: "Ricotta, pistacho, chocolate.", en: "Ricotta, pistachio, chocolate." },
    price: 4.2,
    diet: ["veg", "nuts"],
    image: pastry,
    stock: true,
  },
];

export const CATEGORIES: Category[] = ["coffee", "breakfast", "paninis", "cocktails", "desserts"];
