/**
 * Loyverse → App state mapper
 * ---------------------------------------------------------------
 * Transforms raw Loyverse POS payloads (Items API, Webhooks)
 * into the strongly-typed `MenuItem` shape our React UI consumes.
 *
 * Reference endpoints:
 *   GET https://api.loyverse.com/v1.0/items
 *   GET https://api.loyverse.com/v1.0/receipts?created_at_min=...
 *
 * Pair with `src/lib/loyverse.functions.ts` (createServerFn) that
 * reads `process.env.LOYVERSE_API_TOKEN` and proxies the call so the
 * token never reaches the client bundle.
 */

import { MENU, type Category, type MenuItem } from "@/lib/menu-data";

/** Minimal subset of a Loyverse item we care about. */
export interface LoyverseItem {
  id: string;
  item_name: string;
  category_id: string;
  default_price: number;
  in_stock: boolean;
  sku?: string;
}

/** Locally-stored seed shape (src/data/loyverse-menu.json). */
export type LoyverseSeed = LoyverseItem[];

const LOCAL_BY_ID = new Map(MENU.map((m) => [m.id, m]));

/**
 * Merge a Loyverse item with the local copywriting/imagery catalog.
 * Loyverse owns price + stock; the local catalog owns translations,
 * descriptions, dietary tags and image assets.
 */
export function mapLoyverseItem(item: LoyverseItem): MenuItem | null {
  const local = LOCAL_BY_ID.get(item.id);
  if (!local) return null; // unknown SKU — ignore for the public menu
  return {
    ...local,
    price: item.default_price,
    stock: item.in_stock,
    category: (item.category_id as Category) ?? local.category,
  };
}

export function mapLoyverseItems(items: LoyverseItem[]): MenuItem[] {
  return items.map(mapLoyverseItem).filter((x): x is MenuItem => x !== null);
}

/**
 * Reverse mapper — UI mutation → Loyverse PUT payload.
 * Used by the admin "stock toggle" sync simulation.
 */
export function toLoyverseUpdate(item: Pick<MenuItem, "id" | "price" | "stock">) {
  return {
    id: item.id,
    default_price: item.price,
    in_stock: item.stock ?? true,
    updated_at: new Date().toISOString(),
  };
}
