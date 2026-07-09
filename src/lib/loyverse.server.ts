/**
 * Loyverse REST API — server-only client.
 * ---------------------------------------------------------------
 * Docs: https://developer.loyverse.com/docs/
 *   GET /v1.0/items      → menu / stock
 *   GET /v1.0/receipts   → sales feed
 *
 * Auth: personal access token or OAuth Bearer. Store as `LOYVERSE_API_TOKEN`
 *       via `add_secret`; NEVER prefix with VITE_ (would leak to the bundle).
 *
 * Optional secondary secret for the webhook receiver:
 *   `LOYVERSE_WEBHOOK_SECRET` — shared HMAC secret configured on the
 *   provider side; used to verify inbound POSTs to
 *   /api/public/loyverse-webhook.
 */

const BASE_URL = "https://api.loyverse.com/v1.0";

export type LoyverseConfigState =
  | { configured: true }
  | { configured: false; reason: "missing_token" };

export function getLoyverseConfig(): LoyverseConfigState {
  if (!process.env.LOYVERSE_API_TOKEN) {
    return { configured: false, reason: "missing_token" };
  }
  return { configured: true };
}

async function loyverseFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = process.env.LOYVERSE_API_TOKEN;
  if (!token) throw new Error("LOYVERSE_API_TOKEN is not set");

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Loyverse ${path} failed [${res.status}]: ${body}`);
  }
  return (await res.json()) as T;
}

/* ---------- Items ---------- */
export interface LoyverseApiItem {
  id: string;
  item_name: string;
  category_id: string;
  price?: number;
  default_price?: number;
  variants?: { default_price?: number; stores?: { available_for_sale?: boolean }[] }[];
  sku?: string;
}

export async function fetchLoyverseItems(): Promise<LoyverseApiItem[]> {
  const data = await loyverseFetch<{ items: LoyverseApiItem[] }>("/items?limit=250");
  return data.items ?? [];
}

/* ---------- Receipts ---------- */
export interface LoyverseReceipt {
  receipt_number: string;
  created_at: string;
  total_money: number;
  line_items: { item_id: string; quantity: number; total_money: number }[];
}

export interface DailyBucket {
  day: string; // yyyy-mm-dd
  sales: number;
  orders: number;
}

export async function fetchLoyverseSalesTrend(days = 30): Promise<DailyBucket[]> {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (days - 1));
  const params = new URLSearchParams({
    created_at_min: since.toISOString(),
    limit: "250",
  });
  const data = await loyverseFetch<{ receipts: LoyverseReceipt[] }>(
    `/receipts?${params.toString()}`,
  );

  const buckets = new Map<string, DailyBucket>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setUTCDate(since.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { day: key, sales: 0, orders: 0 });
  }
  for (const r of data.receipts ?? []) {
    const key = r.created_at.slice(0, 10);
    const b = buckets.get(key);
    if (!b) continue;
    b.sales += r.total_money ?? 0;
    b.orders += 1;
  }
  return [...buckets.values()];
}
