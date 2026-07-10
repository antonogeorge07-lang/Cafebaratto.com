// Shared client-side store for menu overrides + live orders + site settings.
// Persisted to localStorage and broadcast across tabs via BroadcastChannel.
import { MENU, type MenuItem } from "@/lib/menu-data";

const MENU_KEY = "baratto.menu.v1";
const ORDERS_KEY = "baratto.orders.v1";
const CURRENCY_KEY = "baratto.currency.v1";
const BOOKINGS_KEY = "baratto.bookings.v1";
const SETTINGS_KEY = "baratto.site.settings.v1";
const CHANNEL = "baratto-sync";

export type OrderStatus = "active" | "fulfilled" | "history";
export type OrderLine = { id: string; name: string; qty: number; unitPrice: number; lineTotal: number };
export type Order = {
  id: string;
  placedAt: string;
  lineItems: OrderLine[];
  subtotal: number;
  currency: string;
  status: OrderStatus;
  customer?: string;
};

export type Currency = "EUR" | "USD" | "GBP";
export const FX: Record<Currency, { rate: number; symbol: string }> = {
  EUR: { rate: 1, symbol: "€" },
  USD: { rate: 1.08, symbol: "$" },
  GBP: { rate: 0.85, symbol: "£" },
};

/**
 * Site-wide visibility & content settings controlled from the admin panel.
 * Persisted with the same broadcast/subscribe mechanism as the menu.
 */
export type SiteSettings = {
  offerEnabled: boolean;
  offerHeadline: string;
  offerBody: string;
  offerCode: string;
  offerCtaLabel: string;
  offerCtaHref: string;
  menuVisible: boolean;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  offerEnabled: false,
  offerHeadline: "Happy Hour · 2×1 on Spritz",
  offerBody: "Every Thursday, 6-8pm. Show this code at the counter to unlock the deal.",
  offerCode: "SPRITZ2X1",
  offerCtaLabel: "Book a table",
  offerCtaHref: "#book",
  menuVisible: true,
};

type Listener = () => void;
const listeners = new Set<Listener>();
let channel: BroadcastChannel | null = null;

function isBrowser() {
  return typeof window !== "undefined";
}

function getChannel() {
  if (!isBrowser()) return null;
  if (!channel && typeof BroadcastChannel !== "undefined") {
    channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = () => emit();
  }
  return channel;
}

function emit() {
  listeners.forEach((l) => l());
}

function broadcast() {
  emit();
  getChannel()?.postMessage({ t: Date.now() });
}

export function subscribe(fn: Listener) {
  listeners.add(fn);
  getChannel(); // ensure channel attached
  if (isBrowser()) {
    const storage = (e: StorageEvent) => {
      if (
        e.key === MENU_KEY ||
        e.key === ORDERS_KEY ||
        e.key === CURRENCY_KEY ||
        e.key === SETTINGS_KEY
      )
        emit();
    };
    window.addEventListener("storage", storage);
    return () => {
      listeners.delete(fn);
      window.removeEventListener("storage", storage);
    };
  }
  return () => listeners.delete(fn);
}

/* ------------- Menu ------------- */
export function getMenu(): MenuItem[] {
  if (!isBrowser()) return MENU;
  try {
    const raw = localStorage.getItem(MENU_KEY);
    if (!raw) return MENU;
    const parsed = JSON.parse(raw) as MenuItem[];
    return Array.isArray(parsed) && parsed.length ? parsed : MENU;
  } catch {
    return MENU;
  }
}

/** Menu items visible on the public site (hidden ones filtered out). */
export function getPublicMenu(): MenuItem[] {
  return getMenu().filter((i) => !i.hidden);
}

export function setMenu(items: MenuItem[]) {
  if (!isBrowser()) return;
  localStorage.setItem(MENU_KEY, JSON.stringify(items));
  broadcast();
}

export function resetMenu() {
  if (!isBrowser()) return;
  localStorage.removeItem(MENU_KEY);
  broadcast();
}

/* ------------- Site settings ------------- */
export function getSettings(): SiteSettings {
  if (!isBrowser()) return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<SiteSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function setSettings(patch: Partial<SiteSettings>) {
  if (!isBrowser()) return;
  const next = { ...getSettings(), ...patch };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  broadcast();
}

/* ------------- Orders ------------- */
export function getOrders(): Order[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
}

export function addOrder(order: Omit<Order, "status">) {
  if (!isBrowser()) return;
  const orders = getOrders();
  const next: Order = { ...order, status: "active" };
  orders.unshift(next);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders.slice(0, 200)));
  broadcast();
}

export function setOrderStatus(id: string, status: OrderStatus) {
  if (!isBrowser()) return;
  const orders = getOrders().map((o) => (o.id === id ? { ...o, status } : o));
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  broadcast();
}

/* ------------- Bookings (table & event) ------------- */
export type BookingKind = "table" | "event";
export type Booking = {
  id: string;
  kind: BookingKind;
  name: string;
  contact: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  partySize: number;
  notes?: string;
  eventType?: string;
  createdAt: string;
};

export function getBookings(): Booking[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(BOOKINGS_KEY);
    return raw ? (JSON.parse(raw) as Booking[]) : [];
  } catch {
    return [];
  }
}

export function addBooking(b: Omit<Booking, "id" | "createdAt">) {
  if (!isBrowser()) return;
  const list = getBookings();
  const next: Booking = {
    ...b,
    id: `BKG-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  list.unshift(next);
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(list.slice(0, 500)));
  broadcast();
  return next;
}

export function getBookingsForDate(date: string): Booking[] {
  return getBookings().filter((b) => b.date === date);
}

export function getCurrency(): Currency {
  if (!isBrowser()) return "EUR";
  return (localStorage.getItem(CURRENCY_KEY) as Currency) ?? "EUR";
}
export function setCurrency(c: Currency) {
  if (!isBrowser()) return;
  localStorage.setItem(CURRENCY_KEY, c);
  broadcast();
}
