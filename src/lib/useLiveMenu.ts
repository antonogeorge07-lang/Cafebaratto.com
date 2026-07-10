import { useEffect, useState } from "react";
import { MENU, type MenuItem } from "@/lib/menu-data";
import { getPublicMenu, subscribe } from "@/lib/admin-store";

export type LiveMenuState = {
  items: MenuItem[];
  loading: boolean;
  error: string | null;
};

/**
 * Loads the PUBLIC menu (hidden items filtered out) from the shared admin
 * store, falling back to the in-memory MENU. Subscribes to live updates so
 * admin edits propagate instantly across the site.
 */
export function useLiveMenu(): LiveMenuState {
  const [state, setState] = useState<LiveMenuState>({
    items: MENU.filter((i) => !i.hidden),
    loading: true,
    error: null,
  });

  useEffect(() => {
    setState({ items: getPublicMenu(), loading: false, error: null });
    const unsub = subscribe(() => {
      setState({ items: getPublicMenu(), loading: false, error: null });
    });
    return unsub;
  }, []);

  return state;
}
