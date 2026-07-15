// Supabase-backed menu data layer.
//
// Preserves the in-app `MenuItem` shape used by every consumer so the UI
// (menu page, order modal, admin editor, mascot) does not need to change.
// Backed by the `menu_items` table with realtime updates.

import { supabase } from "@/integrations/supabase/client";
import { MENU, type MenuItem } from "@/lib/menu-data";
import type { Database } from "@/integrations/supabase/types";

type Row = Database["public"]["Tables"]["menu_items"]["Row"];
type Insert = Database["public"]["Tables"]["menu_items"]["Insert"];

/** Look up a bundled asset URL for a seeded item id (fallback for image). */
const seededImage: Record<string, string> = Object.fromEntries(
  MENU.map((m) => [m.id, m.image]),
);

export function rowToMenuItem(row: Row): MenuItem {
  return {
    id: row.id,
    category: row.category_key,
    subcategory: row.category_custom ?? undefined,
    name: { es: row.name_es, en: row.name_en },
    desc: { es: row.desc_es ?? "", en: row.desc_en ?? "" },
    price: Number(row.price ?? 0),
    diet: (row.diet ?? []) as MenuItem["diet"],
    image: row.image_url || seededImage[row.id] || "",
    stock: row.stock,
    hidden: row.hidden,
  };
}

export function menuItemToInsert(item: MenuItem, sort: number): Insert {
  // Only persist the image_url if it looks like a real URL / data URL that
  // wasn't derived from the bundled asset fallback.
  const isSeededFallback = seededImage[item.id] === item.image;
  return {
    id: item.id,
    category_key: item.category || "custom",
    category_custom: item.subcategory ?? null,
    name_es: item.name.es,
    name_en: item.name.en,
    desc_es: item.desc.es ?? "",
    desc_en: item.desc.en ?? "",
    price: Number(item.price) || 0,
    diet: item.diet ?? [],
    image_url: isSeededFallback ? null : item.image || null,
    stock: item.stock ?? true,
    hidden: item.hidden ?? false,
    sort,
  };
}

/** Fetch all menu items (admin scope — signed-in staff sees hidden too). */
export async function fetchAllMenu(): Promise<MenuItem[]> {
  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .order("sort", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToMenuItem);
}

/** Diff-sync the current items array against the DB. */
export async function syncMenu(next: MenuItem[]): Promise<void> {
  const currentIds = new Set(next.map((i) => i.id));
  const { data: existing, error: readErr } = await supabase
    .from("menu_items")
    .select("id");
  if (readErr) throw readErr;

  const toDelete = (existing ?? []).map((r) => r.id).filter((id) => !currentIds.has(id));

  const rows: Insert[] = next.map((item, idx) => menuItemToInsert(item, (idx + 1) * 10));
  const { error: upsertErr } = await supabase.from("menu_items").upsert(rows, { onConflict: "id" });
  if (upsertErr) throw upsertErr;

  if (toDelete.length) {
    const { error: delErr } = await supabase.from("menu_items").delete().in("id", toDelete);
    if (delErr) throw delErr;
  }
}
