import { useEffect, useState } from "react";
import { Copy, Check, Sparkles } from "lucide-react";
import { getSettings, subscribe, type SiteSettings } from "@/lib/admin-store";
import { trackEvent } from "@/utils/analytics";

/**
 * Landing-page Special Offer banner. Renders nothing unless the admin has
 * toggled it on in Controls → Settings → Landing visibility.
 */
export function SpecialOffer({ onBook }: { onBook?: () => void } = {}) {
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
  } = settings;

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

  return (
    <section
      aria-labelledby="special-offer-heading"
      className="bg-oak-50 py-8 lg:py-10"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-10">
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-100 via-oak-50 to-oak-100 p-6 shadow-lg sm:p-8">
          <span className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-amber-500/20 blur-3xl" />
          <div className="relative grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
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
                onClick={() => trackEvent("special_offer_cta_click", { href: ctaHref })}
                className="inline-flex shrink-0 items-center justify-center rounded-full bg-coffee-900 px-5 py-3 text-sm font-semibold text-oak-50 shadow-sm transition hover:bg-coffee-950"
              >
                {ctaLabel}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
