import { useEffect, useState } from "react";
import { MENU, type MenuItem } from "@/lib/menu-data";
import { getPublicMenu, isMenuLoaded, subscribe } from "@/lib/admin-store";

export type LiveMenuState = {
  items: MenuItem[];
  loading: boolean;
  error: string | null;
};

/**
 * Loads the PUBLIC menu (hidden items filtered out) from the shared admin
 * store, falling back to the in-memory MENU only until the database snapshot
 * arrives. Subscribes to live updates so admin edits propagate instantly.
 */
export function useLiveMenu(): LiveMenuState {
  const [state, setState] = useState<LiveMenuState>({
    items: MENU.filter((i) => !i.hidden),
    loading: true,
    error: null,
  });

  useEffect(() => {
    const read = () =>
      setState({ items: getPublicMenu(), loading: !isMenuLoaded(), error: null });
    read();
    const unsub = subscribe(read);
    return unsub;
  }, []);

  return state;
}

