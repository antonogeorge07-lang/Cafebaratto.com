// Site settings backed by Supabase (`site_settings` table, single row id=1).
import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_SETTINGS,
  normalizeOfferSlots,
  type SiteSettings,
} from "@/lib/admin-store-types";

type Row = {
  id: number;
  menu_visible: boolean;
  offer_body: string;
  offer_code: string;
  offer_cta_href: string;
  offer_cta_label: string;
  offer_enabled: boolean;
  offer_headline: string;
  offer_slots: unknown;
  updated_at: string;
};

function rowToSettings(r: Partial<Row> | null | undefined): SiteSettings {
  if (!r) return DEFAULT_SETTINGS;
  return {
    offerEnabled: r.offer_enabled ?? DEFAULT_SETTINGS.offerEnabled,
    offerHeadline: r.offer_headline ?? DEFAULT_SETTINGS.offerHeadline,
    offerBody: r.offer_body ?? DEFAULT_SETTINGS.offerBody,
    offerCode: r.offer_code ?? DEFAULT_SETTINGS.offerCode,
    offerCtaLabel: r.offer_cta_label ?? DEFAULT_SETTINGS.offerCtaLabel,
    offerCtaHref: r.offer_cta_href ?? DEFAULT_SETTINGS.offerCtaHref,
    offerSlots: normalizeOfferSlots(r.offer_slots),
    menuVisible: r.menu_visible ?? DEFAULT_SETTINGS.menuVisible,
  };
}

function settingsToRow(s: SiteSettings): Omit<Row, "id" | "updated_at"> {
  return {
    menu_visible: s.menuVisible,
    offer_body: s.offerBody,
    offer_code: s.offerCode,
    offer_cta_href: s.offerCtaHref,
    offer_cta_label: s.offerCtaLabel,
    offer_enabled: s.offerEnabled,
    offer_headline: s.offerHeadline,
    offer_slots: normalizeOfferSlots(s.offerSlots),
  };
}

export async function fetchSettings(): Promise<SiteSettings> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return rowToSettings(data as Row | null);
}

export async function saveSettings(next: SiteSettings): Promise<void> {
  const { error } = await supabase
    .from("site_settings")
    .upsert({ id: 1, ...settingsToRow(next) }, { onConflict: "id" });
  if (error) throw error;
}
