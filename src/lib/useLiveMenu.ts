import { useEffect, useState } from "react";
import { MENU, type MenuItem } from "@/lib/menu-data";
import { getMenu, subscribe } from "@/lib/admin-store";

export type LiveMenuState = {
  items: MenuItem[];
  loading: boolean;
  error: string | null;
};

/**
 * Loads the menu from the independent admin store (localStorage-backed),
 * falling back to the in-memory MENU. Subscribes to live updates so admin
 * edits propagate instantly across the site.
 */
export function useLiveMenu(): LiveMenuState {
  const [state, setState] = useState<LiveMenuState>({
    items: MENU,
    loading: true,
    error: null,
  });

  useEffect(() => {
    setState({ items: getMenu(), loading: false, error: null });
    const unsub = subscribe(() => {
      setState({ items: getMenu(), loading: false, error: null });
    });
    return unsub;
  }, []);

  return state;
}
