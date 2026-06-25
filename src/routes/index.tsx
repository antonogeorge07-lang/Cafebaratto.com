import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Coffee,
  MapPin,
  Clock,
  Phone,
  Instagram,
  Menu as MenuIcon,
  Navigation,
  X,
  Leaf,
  Wheat,
  Nut,
  Salad,
  Mail,
} from "lucide-react";

import hero from "@/assets/interior.jpg";
import storefront from "@/assets/storefront.jpg";
import mascot from "@/assets/mascot-cutout.png";

import { I18nProvider, useI18n, type Lang } from "@/lib/i18n";
import { MENU, CATEGORIES, type Category, type Diet } from "@/lib/menu-data";
import { OpenStatusBadge } from "@/components/OpenStatusBadge";
import { ReservationModal } from "@/components/ReservationModal";
import { OrderModal } from "@/components/OrderModal";
import { MascotCompanion } from "@/components/MascotCompanion";

const ADDRESS = "C. de Vinatea, 20, 46001 València, Spain";
const PHONE = "+34 963 00 00 00";
const PHONE_TEL = "+34963000000";
const MAPS_DIR = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  "Cafeteria Baratto " + ADDRESS,
)}`;
const MAPS_EMBED = `https://maps.google.com/maps?q=${encodeURIComponent(
  "Cafeteria Baratto, " + ADDRESS,
)}&z=17&output=embed`;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cafetería Baratto — Italian espresso, paninis & cocktails in Valencia" },
      {
        name: "description",
        content:
          "Authentic Italian cafe in Valencia near Plaza del Ayuntamiento. Real espresso, fresh paninis and signature cocktails. Open daily on C. de Vinatea.",
      },
      { property: "og:title", content: "Cafetería Baratto — Valencia" },
      {
        property: "og:description",
        content:
          "Authentic Italian espresso, paninis and signature cocktails in the heart of Valencia.",
      },
      { property: "og:image", content: hero },
      { property: "og:url", content: "https://cafebaratto.com/" },
    ],
    links: [{ rel: "canonical", href: "https://cafebaratto.com/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CafeOrCoffeeShop",
          name: "Cafetería Baratto",
          image: hero,
          telephone: PHONE,
          priceRange: "€",
          address: {
            "@type": "PostalAddress",
            streetAddress: "C. de Vinatea, 20",
            postalCode: "46001",
            addressLocality: "València",
            addressCountry: "ES",
          },
          servesCuisine: ["Italian", "Coffee", "Paninis", "Cocktails"],
          openingHours: ["Mo-Fr 07:00-22:00", "Sa-Su 09:00-22:00"],
          sameAs: ["https://instagram.com/cafebaratto"],
        }),
      },
    ],
  }),
  component: () => (
    <I18nProvider>
      <Page />
    </I18nProvider>
  ),
});

function Page() {
  const { t, lang, setLang } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);

  return (
    <div className="min-h-screen bg-oak-50 text-coffee-900">
      <StickyHeader
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        lang={lang}
        setLang={setLang}
        onBook={() => setBookOpen(true)}
        onOrder={() => setOrderOpen(true)}
      />

      <main>
        <Hero onBook={() => setBookOpen(true)} />
        <MenuSection />
        <StorySection />
        <VisitSection />
        <Newsletter />
      </main>

      <SiteFooter />

      <ReservationModal open={bookOpen} onClose={() => setBookOpen(false)} />
      <OrderModal open={orderOpen} onClose={() => setOrderOpen(false)} lang={lang} />
      <MascotCompanion />

      {/* Mobile sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-oak-200 bg-oak-50/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex gap-2">
          <button
            onClick={() => setOrderOpen(true)}
            className="flex-1 rounded-full border border-coffee-900/20 py-2.5 text-sm font-medium text-coffee-900"
          >
            {t("nav_order")}
          </button>
          <button
            onClick={() => setBookOpen(true)}
            className="flex-1 rounded-full bg-coffee-900 py-2.5 text-sm font-medium text-oak-50"
          >
            {t("nav_book")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------- Header ------------------------- */

function StickyHeader({
  menuOpen,
  setMenuOpen,
  lang,
  setLang,
  onBook,
  onOrder,
}: {
  menuOpen: boolean;
  setMenuOpen: (b: boolean) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  onBook: () => void;
  onOrder: () => void;
}) {
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-40 border-b border-oak-200/60 bg-oak-50/85 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-10">
        <a href="#top" className="flex shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-coffee-900 text-oak-50">
            <Coffee className="h-4 w-4" />
          </span>
          <span className="font-serif text-xl font-semibold tracking-tight">Baratto</span>
        </a>

        <ul className="ml-6 hidden items-center gap-6 text-sm text-coffee-900/80 md:flex">
          <li>
            <a href="#menu" className="hover:text-coffee-900">{t("nav_menu")}</a>
          </li>
          <li>
            <a href="#visit" className="hover:text-coffee-900">{t("nav_visit")}</a>
          </li>
          <li>
            <button onClick={onOrder} className="hover:text-coffee-900">{t("nav_order")}</button>
          </li>
          <li>
            <button onClick={onBook} className="hover:text-coffee-900">{t("nav_book")}</button>
          </li>
          <li>
            <Link to="/admin" className="text-coffee-900/50 hover:text-coffee-900">Admin</Link>
          </li>
        </ul>

        <div className="ml-auto flex items-center gap-2">
          <LangToggle lang={lang} setLang={setLang} />
          <a
            href={MAPS_DIR}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-coffee-900 px-3 py-2 text-xs font-medium text-oak-50 transition hover:bg-coffee-950 sm:px-4 sm:text-sm"
          >
            <Navigation className="h-4 w-4" />
            <span className="hidden sm:inline">{t("nav_directions")}</span>
          </a>
          <button
            aria-label="Open menu"
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-md p-2 md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="border-t border-oak-200 bg-oak-50 px-4 py-4 md:hidden">
          <ul className="space-y-2 text-sm">
            {[
              { href: "#menu", label: t("nav_menu") },
              { href: "#visit", label: t("nav_visit") },
            ].map((i) => (
              <li key={i.href}>
                <a
                  href={i.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 hover:bg-oak-100"
                >
                  {i.label}
                </a>
              </li>
            ))}
            <li>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOrder();
                }}
                className="block w-full rounded-lg px-3 py-2 text-left hover:bg-oak-100"
              >
                {t("nav_order")}
              </button>
            </li>
            <li>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onBook();
                }}
                className="block w-full rounded-lg px-3 py-2 text-left hover:bg-oak-100"
              >
                {t("nav_book")}
              </button>
            </li>
            <li>
              <Link to="/admin" className="block rounded-lg px-3 py-2 text-coffee-900/60">
                Admin
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}

function LangToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="inline-flex overflow-hidden rounded-full border border-oak-300 text-xs">
      {(["es", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`px-2.5 py-1 font-medium uppercase tracking-wider transition ${
            lang === l ? "bg-coffee-900 text-oak-50" : "text-coffee-900/70 hover:bg-oak-200"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

/* ------------------------- Hero ------------------------- */

function Hero({ onBook }: { onBook: () => void }) {
  const { t } = useI18n();
  return (
    <section id="top" className="hero-pattern relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-10 lg:pb-24 lg:pt-20">
        <div className="fade-in-up">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <OpenStatusBadge />
            <span className="text-xs uppercase tracking-[0.25em] text-oak-700">
              {t("hero_eyebrow")}
            </span>
          </div>
          <h1 className="font-serif text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
            {t("hero_title_1")}
            <br />
            <em className="font-normal text-oak-600">{t("hero_title_2")}</em>
          </h1>
          <p className="mt-5 max-w-lg text-base text-coffee-900/75 sm:text-lg">{t("hero_sub")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#menu"
              className="rounded-full bg-coffee-900 px-5 py-3 text-sm font-medium text-oak-50 transition hover:bg-coffee-950"
            >
              {t("hero_cta_menu")}
            </a>
            <button
              onClick={onBook}
              className="rounded-full border border-coffee-900/25 px-5 py-3 text-sm font-medium text-coffee-900 transition hover:border-coffee-900/60"
            >
              {t("hero_cta_book")}
            </button>
          </div>
        </div>

        <div className="relative fade-in-up delay-200">
          <div className="hover-float overflow-hidden rounded-3xl shadow-xl ring-1 ring-oak-200">
            <img
              src={hero}
              alt="Inside Cafetería Baratto"
              width={1600}
              height={1200}
              className="h-[360px] w-full object-cover sm:h-[480px]"
            />
          </div>
          <img
            src={mascot}
            alt=""
            aria-hidden
            className="pointer-events-none absolute -bottom-4 -left-4 hidden h-28 w-28 select-none sm:block"
          />
        </div>
      </div>
    </section>
  );
}

/* ------------------------- Menu ------------------------- */

const DIET_META: Record<Diet, { icon: React.ComponentType<{ className?: string }>; key: string }> = {
  vegan: { icon: Leaf, key: "diet_vegan" },
  gf: { icon: Wheat, key: "diet_gf" },
  nuts: { icon: Nut, key: "diet_nuts" },
  veg: { icon: Salad, key: "diet_veg" },
};

function MenuSection() {
  const { t, lang } = useI18n();
  const [cat, setCat] = useState<Category | "all">("all");
  const items = useMemo(() => (cat === "all" ? MENU : MENU.filter((m) => m.category === cat)), [cat]);

  const pills: { id: Category | "all"; label: string }[] = [
    { id: "all", label: t("cat_all") },
    ...CATEGORIES.map((c) => ({ id: c, label: t(`cat_${c}` as any) })),
  ];

  return (
    <section id="menu" className="bg-oak-100 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-oak-700">{t("menu_eyebrow")}</p>
          <h2 className="mt-3 font-serif text-3xl sm:text-4xl lg:text-5xl">{t("menu_title")}</h2>
          <p className="mt-4 text-coffee-900/70">{t("menu_sub")}</p>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {pills.map((p) => (
            <button
              key={p.id}
              onClick={() => setCat(p.id)}
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

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => (
            <li
              key={m.id}
              className="group overflow-hidden rounded-3xl border border-oak-200 bg-oak-50 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="aspect-[5/3] overflow-hidden">
                <img
                  src={m.image}
                  alt={m.name[lang]}
                  loading="lazy"
                  className="size-full object-cover transition duration-700 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
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
                          {t(M.key as any)}
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

// (helper removed — keys cast inline)

/* ------------------------- Story ------------------------- */

function StorySection() {
  const { t } = useI18n();
  return (
    <section id="story" className="bg-oak-50 py-20 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-10">
        <img
          src={storefront}
          alt="Cafetería Baratto storefront in Valencia"
          loading="lazy"
          className="h-[400px] w-full rounded-3xl object-cover shadow-xl lg:h-[520px]"
        />
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-oak-700">{t("story_eyebrow")}</p>
          <h2 className="mt-3 font-serif text-3xl sm:text-4xl lg:text-5xl">{t("story_title")}</h2>
          <p className="mt-5 text-coffee-900/75">{t("story_body")}</p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------- Visit ------------------------- */

function VisitSection() {
  const { t } = useI18n();
  return (
    <section id="visit" className="bg-oak-100 py-20 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr,1.1fr] lg:items-center lg:gap-12 lg:px-10">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-oak-700">{t("visit_eyebrow")}</p>
          <h2 className="mt-3 font-serif text-3xl sm:text-4xl lg:text-5xl">{t("visit_title")}</h2>

          <div className="mt-8 space-y-5">
            <Detail icon={MapPin} label={t("visit_address")}>
              <address className="not-italic">{ADDRESS}</address>
            </Detail>
            <Detail icon={Clock} label={t("visit_hours")}>
              <p>{t("hours_weekday")}</p>
              <p>{t("hours_weekend")}</p>
              <OpenStatusBadge className="mt-2" />
            </Detail>
            <Detail icon={Phone} label={t("visit_phone")}>
              <a href={`tel:${PHONE_TEL}`} className="underline-offset-4 hover:underline">
                {PHONE}
              </a>
            </Detail>
          </div>

          <a
            href={MAPS_DIR}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-coffee-900 px-5 py-3 text-sm font-medium text-oak-50 transition hover:bg-coffee-950"
          >
            <Navigation className="h-4 w-4" />
            {t("visit_directions")}
          </a>
        </div>

        <div className="overflow-hidden rounded-3xl border border-oak-200 shadow-xl">
          <iframe
            title="Cafetería Baratto map"
            src={MAPS_EMBED}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="block h-[360px] w-full lg:h-[480px]"
          />
        </div>
      </div>
    </section>
  );
}

function Detail({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-oak-300 text-coffee-900">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-widest text-oak-700">{label}</p>
        <div className="mt-1 leading-relaxed text-coffee-900/85">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------- Newsletter ------------------------- */

function Newsletter() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "done" | "error">("idle");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
    setState(ok ? "done" : "error");
  }

  return (
    <section className="bg-coffee-900 py-20 text-oak-50 lg:py-24">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-10">
        <p className="text-xs uppercase tracking-[0.25em] text-oak-300">{t("news_eyebrow")}</p>
        <h2 className="mt-3 font-serif text-3xl sm:text-4xl lg:text-5xl">{t("news_title")}</h2>
        <p className="mt-4 text-oak-100/80">{t("news_sub")}</p>

        <form onSubmit={submit} className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="news-email">Email</label>
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-coffee-900/50" />
            <input
              id="news-email"
              type="email"
              required
              maxLength={120}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (state !== "idle") setState("idle");
              }}
              placeholder={t("news_email")}
              className="w-full rounded-full bg-oak-50 py-3 pl-9 pr-4 text-sm text-coffee-900 outline-none placeholder:text-coffee-900/40"
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-oak-300 px-5 py-3 text-sm font-semibold text-coffee-900 transition hover:bg-oak-400"
          >
            {t("news_submit")}
          </button>
        </form>
        {state === "done" && <p className="mt-3 text-sm text-sage-100">{t("news_done")}</p>}
        {state === "error" && <p className="mt-3 text-sm text-oak-300">{t("news_invalid")}</p>}
      </div>
    </section>
  );
}

/* ------------------------- Footer ------------------------- */

function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="bg-coffee-950 py-12 pb-24 text-oak-100/80 md:pb-12">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-3 lg:px-10">
        <div>
          <p className="font-serif text-2xl text-oak-50">Baratto</p>
          <p className="mt-2 text-sm">{t("footer_tagline")}</p>
          <div className="mt-4"><OpenStatusBadge /></div>
        </div>

        <div className="text-sm">
          <p className="mb-2 text-xs uppercase tracking-widest text-oak-300">{t("visit_address")}</p>
          <address className="not-italic">{ADDRESS}</address>
          <p className="mt-3">
            <a href={`tel:${PHONE_TEL}`} className="hover:text-oak-50">{PHONE}</a>
          </p>
        </div>

        <div className="text-sm">
          <p className="mb-2 text-xs uppercase tracking-widest text-oak-300">{t("visit_hours")}</p>
          <p>{t("hours_weekday")}</p>
          <p>{t("hours_weekend")}</p>
          <div className="mt-4 flex gap-3">
            <a
              href="https://instagram.com/cafebaratto"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="grid h-9 w-9 place-items-center rounded-full border border-oak-100/20 hover:border-oak-300 hover:text-oak-300"
            >
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-7xl px-4 text-xs text-oak-100/50 sm:px-6 lg:px-10">
        © {new Date().getFullYear()} Cafetería Baratto. {t("footer_rights")}
      </p>
    </footer>
  );
}
