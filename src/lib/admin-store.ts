// Shared client-side store.
//
// Menu items are backed by Supabase (`menu_items` table) with a module-level
// cache kept in sync via realtime; the sync `getMenu()` API is preserved so
// existing consumers do not need to change. Orders, bookings, and site
// settings still use localStorage in this phase; they move to Supabase in
// later phases of the production plan.
import { MENU, type MenuItem } from "@/lib/menu-data";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllMenu, syncMenu } from "@/lib/data/menu";
import { fetchSettings, saveSettings } from "@/lib/data/site-settings";
import {
  fetchAllOrders,
  insertOrder,
  updateOrderStatus,
} from "@/lib/data/orders";
import {
  DEFAULT_SETTINGS,
  type SiteSettings,
  type Order,
  type OrderLine,
  type OrderStatus,
} from "@/lib/admin-store-types";
export {
  DEFAULT_SETTINGS,
  type SiteSettings,
  type Order,
  type OrderLine,
  type OrderStatus,
} from "@/lib/admin-store-types";


const CURRENCY_KEY = "baratto.currency.v1";
const BOOKINGS_KEY = "baratto.bookings.v1";
const CHANNEL = "baratto-sync";

export type Currency = "EUR" | "USD" | "GBP";
export const FX: Record<Currency, { rate: number; symbol: string }> = {
  EUR: { rate: 1, symbol: "€" },
  USD: { rate: 1.08, symbol: "$" },
  GBP: { rate: 0.85, symbol: "£" },
};

// SiteSettings/DEFAULT_SETTINGS are re-exported from admin-store-types above.

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
  ensureMenuSubscription();
  ensureSettingsSubscription();
  if (isBrowser()) {
    const storage = (e: StorageEvent) => {
      if (e.key === ORDERS_KEY || e.key === CURRENCY_KEY) emit();
    };
    window.addEventListener("storage", storage);
    return () => {
      listeners.delete(fn);
      window.removeEventListener("storage", storage);
    };
  }
  return () => listeners.delete(fn);
}

/* ------------- Menu (Supabase-backed) ------------- */
let menuCache: MenuItem[] | null = null;
let menuLoadStarted = false;
let menuRealtimeAttached = false;

function refreshMenuCache() {
  fetchAllMenu()
    .then((items) => {
      menuCache = items;
      emit();
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.warn("[admin-store] fetchAllMenu failed", err);
    });
}

function ensureMenuSubscription() {
  if (!isBrowser()) return;
  if (!menuLoadStarted) {
    menuLoadStarted = true;
    refreshMenuCache();
  }
  if (menuRealtimeAttached) return;
  menuRealtimeAttached = true;
  supabase
    .channel("menu_items-sync")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "menu_items" },
      () => refreshMenuCache(),
    )
    .subscribe();
}

export function getMenu(): MenuItem[] {
  if (!isBrowser()) return MENU;
  ensureMenuSubscription();
  return menuCache ?? MENU;
}

/** Menu items visible on the public site (hidden ones filtered out). */
export function getPublicMenu(): MenuItem[] {
  return getMenu().filter((i) => !i.hidden);
}

/** Sync the given items array to Supabase (diff upsert + delete removed). */
export function setMenu(items: MenuItem[]) {
  if (!isBrowser()) return;
  // Optimistic local update so the UI reflects the change instantly.
  menuCache = items;
  broadcast();
  syncMenu(items).catch((err) => {
    // eslint-disable-next-line no-console
    console.error("[admin-store] syncMenu failed", err);
    refreshMenuCache();
  });
}

/** Reset local cache and re-fetch from DB (does NOT re-seed rows). */
export function resetMenu() {
  if (!isBrowser()) return;
  menuCache = null;
  refreshMenuCache();
}


/* ------------- Site settings (Supabase-backed) ------------- */
let settingsCache: SiteSettings | null = null;
let settingsLoadStarted = false;
let settingsRealtimeAttached = false;

function refreshSettingsCache() {
  fetchSettings()
    .then((s) => {
      settingsCache = s;
      emit();
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.warn("[admin-store] fetchSettings failed", err);
    });
}

function ensureSettingsSubscription() {
  if (!isBrowser()) return;
  if (!settingsLoadStarted) {
    settingsLoadStarted = true;
    refreshSettingsCache();
  }
  if (settingsRealtimeAttached) return;
  settingsRealtimeAttached = true;
  supabase
    .channel("site_settings-sync")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "site_settings" },
      () => refreshSettingsCache(),
    )
    .subscribe();
}

export function getSettings(): SiteSettings {
  if (!isBrowser()) return DEFAULT_SETTINGS;
  ensureSettingsSubscription();
  return settingsCache ?? DEFAULT_SETTINGS;
}

export function setSettings(patch: Partial<SiteSettings>) {
  if (!isBrowser()) return;
  const next = { ...getSettings(), ...patch };
  // Optimistic local update
  settingsCache = next;
  broadcast();
  saveSettings(next).catch((err) => {
    // eslint-disable-next-line no-console
    console.error("[admin-store] saveSettings failed", err);
    refreshSettingsCache();
  });
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
