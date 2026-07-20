import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Coffee, Sparkles } from "lucide-react";

import hero from "@/assets/interior.jpg";
import mascot from "@/assets/mascot-cutout.png";
import blendBag from "@/assets/coffee.jpg";

import { useI18n } from "@/lib/i18n";
import { useLiveMenu } from "@/lib/useLiveMenu";
import { MENU } from "@/lib/menu-data";
import { OpenStatusBadge } from "@/components/OpenStatusBadge";
import { ReservationModal } from "@/components/ReservationModal";
import { OrderModal } from "@/components/OrderModal";
import { MascotCompanion } from "@/components/MascotCompanion";
import { SiteHeader, SiteFooter, MAPS_DIR } from "@/components/SiteChrome";
import { EditableText } from "@/components/EditableText";
import { SpecialOffer } from "@/components/SpecialOffer";
import { getSettings, subscribe } from "@/lib/admin-store";
import { trackEvent } from "@/utils/analytics";

const OG_IMAGE = "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4858d6c7-c750-4111-b15b-042ce66b1b72/id-preview-913363a3--2694da8b-2e39-40c7-aa7b-7862a798f940.lovable.app-1783326888662.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:image", content: OG_IMAGE },
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
          image: OG_IMAGE,
          url: "https://cafebaratto.com/",
          telephone: "+34963000000",
          priceRange: "€€",
          servesCuisine: ["Italian", "Coffee", "Cocktails"],
          address: {
            "@type": "PostalAddress",
            streetAddress: "C. de Vinatea, 20",
            addressLocality: "València",
            postalCode: "46001",
            addressCountry: "ES",
          },
          openingHoursSpecification: [
            {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
              opens: "07:00",
              closes: "22:00",
            },
            {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: ["Saturday", "Sunday"],
              opens: "09:00",
              closes: "22:00",
            },
          ],
        }),
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
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

      <main>
        <Hero onBook={() => setBookOpen(true)} />
        <SpecialOffer onBook={() => setBookOpen(true)} />
        {menuVisible && <MenuBridge />}
        <BlendsComingSoon />

      </main>

      <SiteFooter />

      <ReservationModal open={bookOpen} onClose={() => setBookOpen(false)} />
      <OrderModal
        open={orderOpen}
        onClose={() => setOrderOpen(false)}
        lang="en"
        items={live.items.length > 0 ? live.items : MENU}
      />
      <MascotCompanion />

      {/* Mobile sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-oak-200 bg-oak-50/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex gap-2">
          <Link
            to="/menu"
            className="flex-1 rounded-full border border-coffee-900/20 py-2.5 text-center text-sm font-medium text-coffee-900"
          >
            Menu
          </Link>
          <button
            onClick={() => setBookOpen(true)}
            className="flex-1 rounded-full bg-coffee-900 py-2.5 text-sm font-medium text-oak-50"
          >
            Book
          </button>
        </div>
      </div>
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
              <EditableText id="hero.eyebrow" initial={t("hero_eyebrow")} />
            </span>
          </div>
          <h1 className="font-serif text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
            <EditableText id="hero.title1" as="span" initial={t("hero_title_1")} />
            <br />
            <em className="font-normal text-oak-600">
              <EditableText id="hero.title2" initial={t("hero_title_2")} />
            </em>
          </h1>
          <p className="mt-5 max-w-lg text-base text-coffee-900/75 sm:text-lg">
            <EditableText id="hero.sub" initial={t("hero_sub")} />
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/menu"
              className="rounded-full bg-coffee-900 px-5 py-3 text-sm font-medium text-oak-50 transition hover:bg-coffee-950"
            >
              {t("hero_cta_menu")}
            </Link>
            <button
              onClick={onBook}
              className="rounded-full border border-coffee-900/25 px-5 py-3 text-sm font-medium text-coffee-900 transition hover:border-coffee-900/60"
            >
              {t("hero_cta_book")}
            </button>
            <a
              href={MAPS_DIR}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-coffee-900/15 px-5 py-3 text-sm font-medium text-coffee-900/80 transition hover:border-coffee-900/40"
            >
              {t("hero_directions")}
            </a>
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

/* ------------------------- Coming-Soon Blends + Waitlist ------------------------- */

const BLENDS = [
  { id: "vinatea", name: "Vinatea Espresso", note: "Bittersweet · cacao · orange peel" },
  { id: "carmen", name: "Carmen Blend", note: "Silky · almond · brown sugar" },
  { id: "malva", name: "Malva Filter", note: "Bright · red berry · jasmine" },
];

function BlendsComingSoon() {
  const { t } = useI18n();
  return (
    <section id="blends" className="bg-oak-100 py-8 lg:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-coffee-900 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-oak-50">
            <Sparkles className="h-3 w-3" /> {t("blends_coming")}
          </p>
          <h2 className="mt-3 font-serif text-2xl sm:text-3xl">
            <EditableText id="blends.title" initial={t("blends_title")} />
          </h2>
          <p className="mt-2 max-w-md mx-auto text-sm text-coffee-900/70">
            <EditableText id="blends.sub" initial={t("blends_sub")} />
          </p>
        </div>

        <ul className="mx-auto mt-6 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BLENDS.map((b) => (
            <li
              key={b.id}
              className="group relative overflow-hidden rounded-xl border border-oak-200 bg-oak-50 shadow-sm"
            >
              <div className="relative aspect-square overflow-hidden bg-oak-200">
                <img
                  src={blendBag}
                  alt=""
                  aria-hidden
                  className="size-full object-cover blur-md brightness-90 saturate-150 transition duration-700 group-hover:blur-sm"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-coffee-950/60 via-transparent to-transparent" />
                <span className="absolute right-2 top-2 rounded-full bg-oak-50/90 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-widest text-coffee-900">
                  {t("blends_preview")}
                </span>
              </div>
              <div className="p-2.5">
                <h3 className="font-serif text-base text-coffee-900">{b.name}</h3>
                <p className="mt-0.5 text-[11px] text-coffee-900/60">{b.note}</p>
              </div>
            </li>
          ))}
        </ul>

        <WaitlistForm />
      </div>
    </section>
  );
}

function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
    if (!ok) {
      setState("error");
      trackEvent("waitlist_signup", { status: "invalid" });
      return;
    }
    setState("loading");
    trackEvent("waitlist_signup", { status: "submitted", list: "in_house_blends" });
    // Persist locally; real integration would post to a server function.
    try {
      const raw = JSON.parse(localStorage.getItem("baratto.waitlist.v1") || "[]") as string[];
      if (!raw.includes(email.trim())) raw.push(email.trim());
      localStorage.setItem("baratto.waitlist.v1", JSON.stringify(raw));
    } catch {
      /* ignore */
    }
    await new Promise((r) => setTimeout(r, 350));
    setState("done");
    trackEvent("waitlist_signup", { status: "confirmed", list: "in_house_blends" });
  }

  return (
    <div className="mx-auto mt-6 max-w-md rounded-xl border border-oak-200 bg-oak-50 px-3 py-3 text-center shadow-md sm:px-4">
      <h3 className="font-serif text-base">
        <EditableText id="waitlist.title" initial="Be first in line" />
      </h3>
      <p className="mt-0.5 text-[11px] text-coffee-900/70">
        <EditableText
          id="waitlist.sub"
          initial="Drop your email we'll ping you the day the first bags ship."
        />
      </p>

      <form onSubmit={submit} className="mt-2 flex flex-col gap-1.5 sm:flex-row">
        <label className="sr-only" htmlFor="waitlist-email">Email</label>
        <input
          id="waitlist-email"
          type="email"
          required
          maxLength={120}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state !== "idle") setState("idle");
          }}
          placeholder="you@email.com"
          className="flex-1 rounded-full border border-oak-300 bg-oak-50 px-3 py-1.5 text-xs text-coffee-900 outline-none focus:border-coffee-900/60"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="rounded-full bg-coffee-900 px-3 py-1.5 text-xs font-semibold text-oak-50 transition hover:bg-coffee-950 disabled:opacity-60"
        >
          {state === "loading" ? "Sending…" : "Notify me"}
        </button>
      </form>
      {state === "done" && (
        <p className="mt-1.5 text-[11px] text-sage-700">You're on the list. We'll be in touch.</p>
      )}
      {state === "error" && (
        <p className="mt-1.5 text-[11px] text-oak-700">Please enter a valid email.</p>
      )}
    </div>
  );
}


/* ------------------------- Menu bridge card ------------------------- */

function MenuBridge() {
  return (
    <section className="bg-oak-50 py-20 lg:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-10">
        <Link
          to="/menu"
          onClick={() => trackEvent("nav_bridge_click", { to: "/menu", surface: "landing_card" })}
          className="group relative flex flex-col items-start gap-6 overflow-hidden rounded-3xl bg-coffee-900 p-8 text-oak-50 shadow-xl transition hover:shadow-2xl sm:flex-row sm:items-center sm:p-10"
        >
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-oak-50/10 text-oak-50">
            <Coffee className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.25em] text-oak-300">The full menu</p>
            <h3 className="mt-1 font-serif text-2xl sm:text-3xl">
              Espresso, paninis, cocktails & desserts
            </h3>
            <p className="mt-2 max-w-xl text-sm text-oak-100/80">
              Filter by category. Prices in euros. Updated live from the counter.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-oak-50 px-4 py-2.5 text-sm font-semibold text-coffee-900 transition group-hover:bg-oak-100">
            View the menu <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>
    </section>
  );
}
