import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Leaf, Nut, Salad, Wheat } from "lucide-react";

import { useI18n } from "@/lib/i18n";
import { useLiveMenu } from "@/lib/useLiveMenu";
import { MENU, CATEGORIES, type Category, type Diet } from "@/lib/menu-data";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { ReservationModal } from "@/components/ReservationModal";
import { OrderModal } from "@/components/OrderModal";
import { trackEvent } from "@/utils/analytics";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu · Cafetería Baratto — Valencia" },
      {
        name: "description",
        content:
          "Full menu at Cafetería Baratto: Italian espresso, breakfast, paninis, signature cocktails and desserts. Filter by category — prices in EUR.",
      },
      { property: "og:title", content: "Menu · Cafetería Baratto" },
      {
        property: "og:description",
        content: "Filter espresso, paninis, cocktails and desserts. Live from the counter.",
      },
    ],
    links: [{ rel: "canonical", href: "https://cafebaratto.com/menu" }],
  }),
  component: MenuPage,
});

const DIET_META: Record<Diet, { icon: React.ComponentType<{ className?: string }>; key: string }> = {
  vegan: { icon: Leaf, key: "diet_vegan" },
  gf: { icon: Wheat, key: "diet_gf" },
  nuts: { icon: Nut, key: "diet_nuts" },
  veg: { icon: Salad, key: "diet_veg" },
};

function MenuPage() {
  const [bookOpen, setBookOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const live = useLiveMenu();

  return (
    <div className="min-h-screen bg-oak-50 text-coffee-900">
      <SiteHeader onBook={() => setBookOpen(true)} onOrder={() => setOrderOpen(true)} />
      <MenuSection live={live} />
      <SiteFooter />

      <ReservationModal open={bookOpen} onClose={() => setBookOpen(false)} />
      <OrderModal
        open={orderOpen}
        onClose={() => setOrderOpen(false)}
        lang="en"
        items={live.items.length > 0 ? live.items : MENU}
      />
    </div>
  );
}

function MenuSection({ live }: { live: ReturnType<typeof useLiveMenu> }) {
  const { t, lang } = useI18n();
  const [cat, setCat] = useState<Category | "all">("all");
  const source = live.items.length > 0 ? live.items : MENU;
  const activeSource = useMemo(() => source.filter((m) => m.stock !== false), [source]);
  const items = useMemo(
    () => (cat === "all" ? activeSource : activeSource.filter((m) => m.category === cat)),
    [cat, activeSource],
  );

  const availableCategories = useMemo(
    () => CATEGORIES.filter((category) => activeSource.some((item) => item.category === category)),
    [activeSource],
  );

  const pills: { id: Category | "all"; label: string }[] = [
    { id: "all", label: t("cat_all") },
    ...availableCategories.map((c) => ({ id: c, label: t(`cat_${c}` as never) })),
  ];

  return (
    <section id="menu" className="bg-oak-100 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-oak-700">{t("menu_eyebrow")}</p>
          <h1 className="mt-3 font-serif text-3xl sm:text-4xl lg:text-5xl">{t("menu_title")}</h1>
          <p className="mt-4 text-coffee-900/70">{t("menu_sub")}</p>
        </div>

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
                          const M = DIET_META[d];
                          const Icon = M.icon;
                          return (
                            <span
                              key={d}
                              className="inline-flex items-center gap-1 rounded-full bg-sage-100 px-2 py-0.5 text-[11px] font-medium text-sage-700"
                            >
                              <Icon className="h-3 w-3" />
                              {t(M.key as never)}
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

