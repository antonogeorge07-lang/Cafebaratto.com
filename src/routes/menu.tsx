import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Leaf,
  Nut,
  Salad,
  Wheat,
  EyeOff,
  Milk,
  BadgeCheck,
  Sprout,
  Flame,
  Candy,
  Feather,
  Star,
  Tag,
} from "lucide-react";

import { useI18n } from "@/lib/i18n";
import { useLiveMenu } from "@/lib/useLiveMenu";
import { MENU, categoryLabel, dietLabel, type Category } from "@/lib/menu-data";
import { getSettings, subscribe } from "@/lib/admin-store";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { ReservationModal } from "@/components/ReservationModal";
import { OrderModal } from "@/components/OrderModal";
import { trackEvent } from "@/utils/analytics";
import { MascotCompanion } from "@/components/MascotCompanion";

const MENU_OG_IMAGE = "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4858d6c7-c750-4111-b15b-042ce66b1b72/id-preview-913363a3--2694da8b-2e39-40c7-aa7b-7862a798f940.lovable.app-1783326888662.png";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Authentic Italian Menu in Valencia · Cafetería Baratto" },
      {
        name: "description",
        content:
          "Full menu at Cafetería Baratto: Italian espresso, breakfast, pressed paninis, signature cocktails and desserts. Filter by category — prices in EUR.",
      },
      { property: "og:title", content: "Authentic Italian Menu in Valencia · Cafetería Baratto" },
      {
        property: "og:description",
        content: "Espresso, paninis, cocktails and desserts served fresh in central Valencia.",
      },
      { property: "og:image", content: MENU_OG_IMAGE },
      { name: "twitter:image", content: MENU_OG_IMAGE },
      { property: "og:url", content: "https://cafebaratto.com/menu" },
    ],
    links: [{ rel: "canonical", href: "https://cafebaratto.com/menu" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CafeOrCoffeeShop",
          name: "Cafetería Baratto",
          image: MENU_OG_IMAGE,
          url: "https://cafebaratto.com/menu",
          telephone: "+34963000000",
          servesCuisine: ["Italian", "Coffee", "Cocktails"],
          address: {
            "@type": "PostalAddress",
            streetAddress: "C. de Vinatea, 20",
            addressLocality: "València",
            postalCode: "46001",
            addressCountry: "ES",
          },
          hasMenu: {
            "@type": "Menu",
            name: "Cafetería Baratto Menu",
            url: "https://cafebaratto.com/menu",
            hasMenuSection: [
              { "@type": "MenuSection", name: "Coffee" },
              { "@type": "MenuSection", name: "Breakfast" },
              { "@type": "MenuSection", name: "Paninis" },
              { "@type": "MenuSection", name: "Cocktails" },
              { "@type": "MenuSection", name: "Desserts" },
            ],
          },
        }),
      },
    ],
  }),
  component: MenuPage,
});

const DIET_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  vegan: Leaf,
  veg: Salad,
  gf: Wheat,
  df: Milk,
  nuts: Nut,
  nut_free: Nut,
  halal: BadgeCheck,
  organic: Sprout,
  spicy: Flame,
  sugar_free: Candy,
  low_cal: Feather,
  house_special: Star,
};

function MenuPage() {
  const [bookOpen, setBookOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(() => getSettings().menuVisible);
  const live = useLiveMenu();

  useEffect(() => {
    setMenuVisible(getSettings().menuVisible);
    const unsub = subscribe(() => setMenuVisible(getSettings().menuVisible));
    return unsub;
  }, []);

  return (
    <div className="min-h-screen bg-oak-50 text-coffee-900">
      <SiteHeader onBook={() => setBookOpen(true)} onOrder={() => setOrderOpen(true)} />
      {menuVisible ? (
        <MenuSection live={live} />
      ) : (
        <section className="mx-auto max-w-2xl px-4 py-24 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-oak-200 text-coffee-900/60">
            <EyeOff className="h-5 w-5" />
          </span>
          <h1 className="mt-5 font-serif text-3xl">Menu temporarily unavailable</h1>
          <p className="mt-3 text-sm text-coffee-900/70">
            We're updating our offering. Please check back shortly.
          </p>
        </section>
      )}
      <SiteFooter />

      <ReservationModal open={bookOpen} onClose={() => setBookOpen(false)} />
      <OrderModal
        open={orderOpen}
        onClose={() => setOrderOpen(false)}
        lang="en"
        items={live.items.length > 0 ? live.items : MENU}
      />
      <MascotCompanion />
    </div>
  );
}

function MenuSection({ live }: { live: ReturnType<typeof useLiveMenu> }) {
  const { t, lang } = useI18n();
  const [cat, setCat] = useState<Category | "all">("all");
  const source = live.loading && live.items.length === 0 ? MENU : live.items;
  const activeSource = useMemo(() => source.filter((m) => m.stock !== false), [source]);
  const items = useMemo(
    () => (cat === "all" ? activeSource : activeSource.filter((m) => m.category === cat)),
    [cat, activeSource],
  );

  const availableCategories = useMemo(
    () => Array.from(new Set(activeSource.map((item) => item.category))),
    [activeSource],
  );

  const pills: { id: Category | "all"; label: string }[] = [
    { id: "all", label: t("cat_all") },
    ...availableCategories.map((c) => ({ id: c, label: categoryLabel(c, lang) })),
  ];

  return (
    <section id="menu" className="bg-oak-100 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-oak-700">{t("menu_eyebrow")}</p>
          <h1 className="mt-3 font-serif text-3xl sm:text-4xl lg:text-5xl">{t("menu_h1")}</h1>
          <p className="mt-4 text-coffee-900/70">
            {t("menu_intro")}
          </p>
        </div>

        <h2 className="mt-10 text-center font-serif text-xl text-coffee-900/80">{t("menu_browse")}</h2>

        {live.error && (
          <div
            role="alert"
            className="mx-auto mt-8 max-w-2xl rounded-2xl border border-oak-300 bg-oak-50 px-4 py-3 text-center text-sm text-coffee-900/80"
          >
            {t("menu_sync_alert")}
          </div>
        )}

        <div className="mt-10 min-h-[52px]">
          <div className="flex flex-wrap justify-center gap-2">
            {pills.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setCat(p.id);
                  trackEvent("menu_filter", { category: p.id });
                }}
                aria-pressed={cat === p.id}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  cat === p.id
                    ? "bg-coffee-900 text-oak-50"
                    : "bg-oak-50 text-coffee-900/80 hover:bg-oak-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {live.loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <li
                  key={`sk-${i}`}
                  className="overflow-hidden rounded-3xl border border-oak-200 bg-oak-50"
                >
                  <div className="aspect-[5/3] animate-pulse bg-oak-200" />
                  <div className="min-h-[128px] space-y-2 p-5">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-oak-200" />
                    <div className="h-3 w-full animate-pulse rounded bg-oak-200/70" />
                    <div className="h-3 w-5/6 animate-pulse rounded bg-oak-200/70" />
                  </div>
                </li>
              ))
            : items.map((m) => (
                <li
                  key={m.id}
                  className="group overflow-hidden rounded-3xl border border-oak-200 bg-oak-50 transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative aspect-[5/3] overflow-hidden">
                    <img
                      src={m.image}
                      alt={m.name[lang]}
                      loading="lazy"
                      width={800}
                      height={480}
                      className="size-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="min-h-[128px] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-serif text-lg text-coffee-900">{m.name[lang]}</h3>
                      <span className="shrink-0 text-sm tabular-nums text-coffee-900/60">
                        €{m.price.toFixed(2)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-coffee-900/70">{m.desc[lang]}</p>
                    {m.diet.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {m.diet.map((d) => {
                          const Icon = DIET_ICONS[d] ?? Tag;
                          return (
                            <span
                              key={d}
                              className="inline-flex items-center gap-1 rounded-full bg-sage-100 px-2 py-0.5 text-[11px] font-medium text-sage-700"
                            >
                              <Icon className="h-3 w-3" />
                              {dietLabel(d, lang)}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </li>
              ))}
        </ul>
      </div>
    </section>
  );
}

