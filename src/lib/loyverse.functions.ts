/**
 * Loyverse server functions — RPC surface consumed by the admin dashboard.
 * ---------------------------------------------------------------
 * Handler bodies are stripped from the client bundle; the raw REST client
 * (`loyverse.server.ts`) and the LOYVERSE_API_TOKEN never ship to the browser.
 *
 * All functions degrade gracefully when the integration is not yet
 * configured — they return `{ configured: false }` so the UI can render a
 * "Connect Loyverse" empty state instead of throwing.
 */
import { createServerFn } from "@tanstack/react-start";
import { mapLoyverseItems } from "@/utils/loyverseMapper";
import type { MenuItem } from "@/lib/menu-data";
import type { DailyBucket } from "@/lib/loyverse.server";

export type IntegrationResult<T> =
  | { configured: true; data: T }
  | { configured: false; reason: "missing_token" | "error"; message?: string };

export const getLoyverseStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { getLoyverseConfig } = await import("@/lib/loyverse.server");
  return getLoyverseConfig();
});

export const getLoyverseMenu = createServerFn({ method: "GET" }).handler(
  async (): Promise<IntegrationResult<MenuItem[]>> => {
    const { getLoyverseConfig, fetchLoyverseItems } = await import("@/lib/loyverse.server");
    const status = getLoyverseConfig();
    if (!status.configured) return { configured: false, reason: "missing_token" };
    try {
      const raw = await fetchLoyverseItems();
      const items = mapLoyverseItems(
        raw.map((r) => ({
          id: r.id,
          item_name: r.item_name,
          category_id: r.category_id,
          default_price: r.default_price ?? r.variants?.[0]?.default_price ?? 0,
          in_stock: r.variants?.[0]?.stores?.[0]?.available_for_sale ?? true,
          sku: r.sku,
        })),
      );
      return { configured: true, data: items };
    } catch (err) {
      return {
        configured: false,
        reason: "error",
        message: err instanceof Error ? err.message : "loyverse_fetch_failed",
      };
    }
  },
);

export const getLoyverseSalesTrend = createServerFn({ method: "GET" }).handler(
  async (): Promise<IntegrationResult<DailyBucket[]>> => {
    const { getLoyverseConfig, fetchLoyverseSalesTrend } = await import(
      "@/lib/loyverse.server"
    );
    const status = getLoyverseConfig();
    if (!status.configured) return { configured: false, reason: "missing_token" };
    try {
      const data = await fetchLoyverseSalesTrend(30);
      return { configured: true, data };
    } catch (err) {
      return {
        configured: false,
        reason: "error",
        message: err instanceof Error ? err.message : "loyverse_fetch_failed",
      };
    }
  },
);
