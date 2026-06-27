// Shared client-side store for menu overrides + live orders.
// Persisted to localStorage and broadcast across tabs via BroadcastChannel.
import { MENU, type MenuItem } from "@/lib/menu-data";

const MENU_KEY = "baratto.menu.v1";
const ORDERS_KEY = "baratto.orders.v1";
const CURRENCY_KEY = "baratto.currency.v1";
const PASS_KEY = "baratto.masterhash.v1";
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
      if (e.key === MENU_KEY || e.key === ORDERS_KEY || e.key === CURRENCY_KEY) emit();
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

/* ------------- Currency ------------- */
export function getCurrency(): Currency {
  if (!isBrowser()) return "EUR";
  return (localStorage.getItem(CURRENCY_KEY) as Currency) ?? "EUR";
}
export function setCurrency(c: Currency) {
  if (!isBrowser()) return;
  localStorage.setItem(CURRENCY_KEY, c);
  broadcast();
}

/* ------------- Master password ------------- */
export function getMasterHash(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(PASS_KEY);
}
export function setMasterHash(hash: string) {
  if (!isBrowser()) return;
  localStorage.setItem(PASS_KEY, hash);
}
