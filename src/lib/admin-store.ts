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
import { fetchAllBookings, insertBooking } from "@/lib/data/bookings";
import {
  DEFAULT_SETTINGS,
  type SiteSettings,
  type Order,
  type OrderLine,
  type OrderStatus,
  type Booking,
  type BookingKind,
} from "@/lib/admin-store-types";
export {
  DEFAULT_SETTINGS,
  type SiteSettings,
  type Order,
  type OrderLine,
  type OrderStatus,
  type Booking,
  type BookingKind,
} from "@/lib/admin-store-types";


const CURRENCY_KEY = "baratto.currency.v1";

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
  ensureOrdersSubscription();
  if (isBrowser()) {
    const storage = (e: StorageEvent) => {
      if (e.key === CURRENCY_KEY) emit();
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

/* ------------- Orders (Supabase-backed) ------------- */
let ordersCache: Order[] | null = null;
let ordersLoadStarted = false;
let ordersRealtimeAttached = false;

function refreshOrdersCache() {
  fetchAllOrders()
    .then((rows) => {
      ordersCache = rows;
      emit();
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.warn("[admin-store] fetchAllOrders failed", err);
    });
}

function ensureOrdersSubscription() {
  if (!isBrowser()) return;
  if (!ordersLoadStarted) {
    ordersLoadStarted = true;
    refreshOrdersCache();
  }
  if (ordersRealtimeAttached) return;
  ordersRealtimeAttached = true;
  supabase
    .channel("orders-sync")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "orders" },
      () => refreshOrdersCache(),
    )
    .subscribe();
}

export function getOrders(): Order[] {
  if (!isBrowser()) return [];
  ensureOrdersSubscription();
  return ordersCache ?? [];
}

export function addOrder(order: Omit<Order, "status">) {
  if (!isBrowser()) return;
  // Optimistic local update; realtime will confirm.
  const optimistic: Order = { ...order, status: "active" };
  ordersCache = [optimistic, ...(ordersCache ?? [])].slice(0, 500);
  broadcast();
  insertOrder(order).catch((err) => {
    // eslint-disable-next-line no-console
    console.error("[admin-store] insertOrder failed", err);
    refreshOrdersCache();
  });
}

export function setOrderStatus(id: string, status: OrderStatus) {
  if (!isBrowser()) return;
  ordersCache = (ordersCache ?? []).map((o) =>
    o.id === id ? { ...o, status } : o,
  );
  broadcast();
  updateOrderStatus(id, status).catch((err) => {
    // eslint-disable-next-line no-console
    console.error("[admin-store] updateOrderStatus failed", err);
    refreshOrdersCache();
  });
}

/* ------------- Bookings (Supabase-backed) ------------- */
let bookingsCache: Booking[] | null = null;
let bookingsLoadStarted = false;
let bookingsRealtimeAttached = false;

function refreshBookingsCache() {
  fetchAllBookings()
    .then((rows) => {
      bookingsCache = rows;
      emit();
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.warn("[admin-store] fetchAllBookings failed", err);
    });
}

function ensureBookingsSubscription() {
  if (!isBrowser()) return;
  if (!bookingsLoadStarted) {
    bookingsLoadStarted = true;
    refreshBookingsCache();
  }
  if (bookingsRealtimeAttached) return;
  bookingsRealtimeAttached = true;
  supabase
    .channel("bookings-sync")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "bookings" },
      () => refreshBookingsCache(),
    )
    .subscribe();
}

export function getBookings(): Booking[] {
  if (!isBrowser()) return [];
  ensureBookingsSubscription();
  return bookingsCache ?? [];
}

export function addBooking(b: Omit<Booking, "id" | "createdAt">) {
  if (!isBrowser()) return;
  const optimistic: Booking = {
    ...b,
    id: `BKG-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  bookingsCache = [optimistic, ...(bookingsCache ?? [])].slice(0, 1000);
  broadcast();
  insertBooking(b).catch((err) => {
    // eslint-disable-next-line no-console
    console.error("[admin-store] insertBooking failed", err);
    refreshBookingsCache();
  });
  return optimistic;
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
