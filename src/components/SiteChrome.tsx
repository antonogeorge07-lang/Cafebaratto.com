import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Coffee, Instagram, Menu as MenuIcon, Navigation, X } from "lucide-react";
import { useI18n, type Lang } from "@/lib/i18n";
import { OpenStatusBadge } from "@/components/OpenStatusBadge";

export const ADDRESS = "C. de Vinatea, 20, 46001 València, Spain";
export const PHONE = "+34 963 00 00 00";
export const PHONE_TEL = "+34963000000";
export const MAPS_DIR = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
  "Cafeteria Baratto " + ADDRESS,
)}`;

export function SiteHeader({
  onBook,
  onOrder,
}: {
  onBook?: () => void;
  onOrder?: () => void;
}) {
  const { t, lang, setLang } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-oak-200/60 bg-oak-50/85 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-10">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-coffee-900 text-oak-50">
            <Coffee className="h-4 w-4" />
          </span>
          <span className="font-serif text-xl font-semibold tracking-tight">Baratto</span>
        </Link>

        <ul className="ml-6 hidden items-center gap-6 text-sm text-coffee-900/80 md:flex">
          <li>
            <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "text-coffee-900" }} className="hover:text-coffee-900">
              {t("nav_home")}
            </Link>
          </li>
          <li>
            <Link to="/menu" activeProps={{ className: "text-coffee-900" }} className="hover:text-coffee-900">
              {t("nav_menu")}
            </Link>
          </li>
          {onOrder && (
            <li>
              <button onClick={onOrder} className="hover:text-coffee-900">
                {t("nav_order")}
              </button>
            </li>
          )}
          {onBook && (
            <li>
              <button onClick={onBook} className="hover:text-coffee-900">
                {t("nav_book")}
              </button>
            </li>
          )}
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
            <li>
              <Link to="/" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 hover:bg-oak-100">
                Home
              </Link>
            </li>
            <li>
              <Link to="/menu" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 hover:bg-oak-100">
                {t("nav_menu")}
              </Link>
            </li>
            {onOrder && (
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
            )}
            {onBook && (
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
            )}
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

export function SiteFooter() {
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
