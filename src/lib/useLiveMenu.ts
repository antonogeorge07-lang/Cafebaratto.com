import { useEffect, useState } from "react";
import { MENU, type MenuItem } from "@/lib/menu-data";
import { mapLoyverseItems, type LoyverseSeed } from "@/utils/loyverseMapper";
import { getMenu, subscribe } from "@/lib/admin-store";

export type LiveMenuState = {
  items: MenuItem[];
  loading: boolean;
  error: string | null;
};

/**
 * Loads the menu: prefers admin-edited overrides from localStorage,
 * else falls back to the Loyverse seed JSON, else the in-memory MENU.
 * Subscribes to live updates so admin edits propagate instantly.
 */
export function useLiveMenu(): LiveMenuState {
  const [state, setState] = useState<LiveMenuState>({
    items: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const override = getMenu();
      // If admin has customised the menu, use that immediately.
      if (override !== MENU) {
        if (!cancelled) setState({ items: override, loading: false, error: null });
        return;
      }
      try {
        await new Promise((r) => setTimeout(r, 250));
        const mod = await import("@/data/loyverse-menu.json");
        const seed = (mod.default ?? mod) as LoyverseSeed;
        const items = mapLoyverseItems(seed);
        if (!cancelled) setState({ items, loading: false, error: null });
      } catch (err) {
        if (!cancelled) {
          setState({
            items: MENU,
            loading: false,
            error: err instanceof Error ? err.message : "sync_failed",
          });
        }
      }
    };
    void load();
    const unsub = subscribe(() => {
      const override = getMenu();
      if (override !== MENU) setState({ items: override, loading: false, error: null });
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  return state;
}
