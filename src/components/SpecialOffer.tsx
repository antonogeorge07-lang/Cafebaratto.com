import { useEffect, useState } from "react";
import { Copy, Check, Sparkles } from "lucide-react";
import { getSettings, subscribe, type SiteSettings } from "@/lib/admin-store";
import { useI18n } from "@/lib/i18n";
import { trackEvent } from "@/utils/analytics";

/**
 * Landing-page Special Offer banner. Renders nothing unless the admin has
 * toggled it on in Controls → Settings → Landing visibility. Shows up to
 * 5 configurable slots (image + title + price), each individually visible.
 */
export function SpecialOffer({ onBook }: { onBook?: () => void } = {}) {
  const { t } = useI18n();
  const [settings, setSettings] = useState<SiteSettings>(() => getSettings());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSettings(getSettings());
    const unsub = subscribe(() => setSettings(getSettings()));
    return unsub;
  }, []);

  if (!settings.offerEnabled) return null;

  const {
    offerHeadline: headline,
    offerBody: body,
    offerCode: code,
    offerCtaLabel: ctaLabel,
    offerCtaHref: ctaHref,
    offerSlots,
  } = settings;

  const activeSlots = (offerSlots ?? []).filter(
    (s) => s.visible && (s.title.trim() || s.imageUrl.trim() || s.price > 0),
  );

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      trackEvent("special_offer_code_copied", { code });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const priceFormatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });

  return (
    <section
      aria-labelledby="special-offer-heading"
      className="bg-oak-50 py-8 lg:py-10"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10">
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-100 via-oak-50 to-oak-100 p-6 shadow-lg sm:p-8">
          <span className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-amber-500/20 blur-3xl" />
          <div className="relative grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-coffee-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-oak-50">
                <Sparkles className="h-3 w-3" /> Special offer
              </p>
              <h2
                id="special-offer-heading"
                className="mt-3 font-serif text-2xl leading-tight text-coffee-900 sm:text-3xl"
              >
                {headline}
              </h2>
              {body && (
                <p className="mt-2 max-w-xl text-sm text-coffee-900/75">{body}</p>
              )}

              {code && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-dashed border-coffee-900/40 bg-oak-50 px-3 py-1.5">
                  <span className="text-[11px] uppercase tracking-widest text-coffee-900/60">
                    Code
                  </span>
                  <code className="select-all font-mono text-sm font-semibold tracking-wider text-coffee-900">
                    {code}
                  </code>
                  <button
                    type="button"
                    onClick={copyCode}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] text-coffee-900/70 hover:bg-oak-200"
                    aria-label={copied ? "Code copied" : "Copy code"}
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              )}
            </div>

            {ctaLabel && ctaHref && (
              <a
                href={ctaHref}
                onClick={(e) => {
                  trackEvent("special_offer_cta_click", { href: ctaHref });
                  if (ctaHref === "#book" && onBook) {
                    e.preventDefault();
                    onBook();
                  }
                }}
                className="inline-flex shrink-0 items-center justify-center rounded-full bg-coffee-900 px-5 py-3 text-sm font-semibold text-oak-50 shadow-sm transition hover:bg-coffee-950"
              >
                {ctaLabel}
              </a>
            )}
          </div>

          {activeSlots.length > 0 && (
            <ul
              className="relative mt-6 grid gap-4"
              style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              }}
            >
              {activeSlots.map((slot, i) => (
                <li
                  key={i}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-coffee-900/10 bg-oak-50/80 backdrop-blur-sm transition hover:border-coffee-900/25"
                >
                  {slot.imageUrl ? (
                    <div className="aspect-[4/3] w-full overflow-hidden bg-oak-100">
                      <img
                        src={slot.imageUrl}
                        alt={slot.title || "Offer"}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="grid aspect-[4/3] w-full place-items-center bg-oak-100 text-coffee-900/30">
                      <Sparkles className="h-6 w-6" />
                    </div>
                  )}
                  <div className="flex flex-1 items-start justify-between gap-3 p-3">
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-coffee-900">
                      {slot.title || "Untitled"}
                    </p>
                    {slot.price > 0 && (
                      <span className="shrink-0 text-sm font-semibold text-coffee-900">
                        {priceFormatter.format(slot.price)}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
