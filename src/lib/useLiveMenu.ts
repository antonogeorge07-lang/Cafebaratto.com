import { useEffect, useState } from "react";
import { MENU, type MenuItem } from "@/lib/menu-data";
import { mapLoyverseItems, type LoyverseSeed } from "@/utils/loyverseMapper";

export type LiveMenuState = {
  items: MenuItem[];
  loading: boolean;
  error: string | null;
};

/**
 * Loads menu from src/data/loyverse-menu.json asynchronously,
 * simulating a Loyverse POS sync. Falls back to the in-memory
 * MENU array on any failure.
 */
export function useLiveMenu(): LiveMenuState {
  const [state, setState] = useState<LiveMenuState>({
    items: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // small artificial latency to showcase skeletons
        await new Promise((r) => setTimeout(r, 450));
        const mod = await import("@/data/loyverse-menu.json");
        const seed = (mod.default ?? mod) as LoyverseSeed;
        const items = mapLoyverseItems(seed);
        if (!cancelled) setState({ items, loading: false, error: null });
      } catch (err) {
        console.warn("[LOYVERSE] menu sync failed, using local fallback", err);
        if (!cancelled) {
          setState({
            items: MENU,
            loading: false,
            error: err instanceof Error ? err.message : "sync_failed",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
