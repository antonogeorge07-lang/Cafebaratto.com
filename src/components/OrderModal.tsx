import { useMemo, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import { useI18n, type Lang } from "@/lib/i18n";
import { MENU, type MenuItem } from "@/lib/menu-data";

export function OrderModal({
  open,
  onClose,
  lang,
  items,
}: {
  open: boolean;
  onClose: () => void;
  lang: Lang;
  items?: MenuItem[];
}) {
  const { t } = useI18n();
  const list = items && items.length > 0 ? items : MENU;
  const [qty, setQty] = useState<Record<string, number>>({});
  const [step, setStep] = useState<"cart" | "contact">("cart");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ code: string } | null>(null);

  const subtotal = useMemo(
    () => list.reduce((s, m) => s + (qty[m.id] ?? 0) * m.price, 0),
    [qty, list],
  );
  const hasItems = subtotal > 0;

  const reset = () => {
    setQty({});
    setName("");
    setPhone("");
    setEmail("");
    setNotes("");
    setStep("cart");
    setConfirmation(null);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim()) return setError("Please enter your name");
    if (phone.trim().length < 5) return setError("Please enter a phone number we can reach you on");
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim()))
      return setError("That email doesn't look right");

    const code = `ORD-${Date.now().toString(36).toUpperCase()}`;
    const lineItems = list
      .filter((m) => (qty[m.id] ?? 0) > 0)
      .map((m) => ({
        id: m.id,
        name: m.name.en,
        qty: qty[m.id] ?? 0,
        unitPrice: m.price,
        lineTotal: +(m.price * (qty[m.id] ?? 0)).toFixed(2),
      }));

    setSubmitting(true);
    try {
      const res = await fetch("/api/public/place-order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          code,
          items: lineItems,
          subtotal: +subtotal.toFixed(2),
          currency: "EUR",
          customerName: name.trim(),
          contact: phone.trim(),
          email: email.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Could not place order");
      }
      setConfirmation({ code });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not place order");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-coffee-900/60 px-4 py-6 backdrop-blur-sm sm:items-center">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl bg-oak-50 shadow-2xl">
        <div className="flex items-center justify-between border-b border-oak-200 p-5">
          <h3 className="font-serif text-2xl text-coffee-900">
            {confirmation
              ? "Order received"
              : step === "contact"
                ? "Your details"
                : t("order_title")}
          </h3>
          <button onClick={handleClose} aria-label="Close" className="rounded-full p-1 hover:bg-oak-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {confirmation ? (
          <div className="space-y-4 p-6 text-center">
            <div className="mx-auto rounded-2xl bg-sage-100 px-4 py-6 text-sage-700">
              <p className="text-sm">Thank you! We'll call you shortly to confirm.</p>
              <p className="mt-2 text-xs uppercase tracking-widest text-sage-700/70">Order code</p>
              <p className="mt-1 font-mono text-lg text-coffee-900">{confirmation.code}</p>
            </div>
            {email.trim() && (
              <p className="text-xs text-coffee-900/60">
                A confirmation email is on its way to {email.trim()}.
              </p>
            )}
            <button
              onClick={handleClose}
              className="w-full rounded-full bg-coffee-900 py-3 text-sm font-medium text-oak-50 hover:bg-coffee-950"
            >
              Done
            </button>
          </div>
        ) : step === "cart" ? (
          <>
            <ul className="flex-1 overflow-y-auto p-5">
              {list.map((m) => {
                const n = qty[m.id] ?? 0;
                const oos = m.stock === false;
                return (
                  <li
                    key={m.id}
                    className={`flex items-center justify-between gap-3 border-b border-oak-100 py-3 last:border-b-0 ${
                      oos ? "opacity-50" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-coffee-900">
                        {m.name[lang]}
                        {oos && (
                          <span className="ml-2 rounded-full bg-oak-200 px-2 py-0.5 text-[10px] uppercase tracking-wider text-coffee-900/60">
                            {t("out_of_stock")}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-coffee-900/60">€{m.price.toFixed(2)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        aria-label="Decrease"
                        onClick={() => setQty((q) => ({ ...q, [m.id]: Math.max(0, n - 1) }))}
                        className="grid h-8 w-8 place-items-center rounded-full border border-oak-200 text-coffee-900 disabled:opacity-30"
                        disabled={n === 0}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-6 text-center text-sm tabular-nums">{n}</span>
                      <button
                        type="button"
                        aria-label="Increase"
                        onClick={() => setQty((q) => ({ ...q, [m.id]: n + 1 }))}
                        disabled={oos}
                        className="grid h-8 w-8 place-items-center rounded-full bg-coffee-900 text-oak-50 disabled:cursor-not-allowed disabled:bg-oak-300 disabled:text-coffee-900/40"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-oak-200 p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-coffee-900/70">{t("order_subtotal")}</span>
                <span className="font-serif text-2xl text-coffee-900">€{subtotal.toFixed(2)}</span>
              </div>
              <button
                onClick={() => setStep("contact")}
                disabled={!hasItems}
                className="w-full rounded-full bg-coffee-900 py-3 text-sm font-medium text-oak-50 transition hover:bg-coffee-950 disabled:opacity-40"
              >
                {hasItems ? "Continue" : t("order_empty")}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5">
              <div className="space-y-3">
                <Field label="Your name*">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-oak-200 bg-white px-3 py-2 text-sm text-coffee-900 outline-none focus:border-coffee-900"
                    autoComplete="name"
                  />
                </Field>
                <Field label="Phone / WhatsApp*">
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    inputMode="tel"
                    placeholder="+34 …"
                    className="w-full rounded-xl border border-oak-200 bg-white px-3 py-2 text-sm text-coffee-900 outline-none focus:border-coffee-900"
                    autoComplete="tel"
                  />
                </Field>
                <Field label="Email (for confirmation)">
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    className="w-full rounded-xl border border-oak-200 bg-white px-3 py-2 text-sm text-coffee-900 outline-none focus:border-coffee-900"
                    autoComplete="email"
                  />
                </Field>
                <Field label="Notes for the kitchen">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    maxLength={500}
                    className="w-full rounded-xl border border-oak-200 bg-white px-3 py-2 text-sm text-coffee-900 outline-none focus:border-coffee-900"
                  />
                </Field>
              </div>
              <div className="mt-5 rounded-2xl bg-oak-100 p-4 text-sm">
                <div className="flex justify-between text-coffee-900/70">
                  <span>Subtotal</span>
                  <span className="font-serif text-xl text-coffee-900">€{subtotal.toFixed(2)}</span>
                </div>
                <p className="mt-2 text-xs text-coffee-900/60">
                  Payment on collection. We'll contact you to confirm timing.
                </p>
              </div>
              {error && (
                <p role="alert" className="mt-3 rounded-xl bg-red-100 px-3 py-2 text-sm text-red-800">
                  {error}
                </p>
              )}
            </div>
            <div className="flex gap-2 border-t border-oak-200 p-5">
              <button
                onClick={() => setStep("cart")}
                disabled={submitting}
                className="rounded-full border border-oak-300 px-5 py-3 text-sm font-medium text-coffee-900 hover:bg-oak-100 disabled:opacity-40"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 rounded-full bg-coffee-900 py-3 text-sm font-medium text-oak-50 transition hover:bg-coffee-950 disabled:opacity-40"
              >
                {submitting ? "Placing order…" : `Place order · €${subtotal.toFixed(2)}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-coffee-900/70">
        {label}
      </span>
      {children}
    </label>
  );
}
