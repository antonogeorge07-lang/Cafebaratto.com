import { useMemo, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import { useI18n, type Lang } from "@/lib/i18n";
import { MENU } from "@/lib/menu-data";

export function OrderModal({ open, onClose, lang }: { open: boolean; onClose: () => void; lang: Lang }) {
  const { t } = useI18n();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);

  const subtotal = useMemo(
    () => MENU.reduce((s, m) => s + (qty[m.id] ?? 0) * m.price, 0),
    [qty],
  );
  const hasItems = subtotal > 0;

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-coffee-900/60 px-4 py-6 backdrop-blur-sm sm:items-center">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl bg-oak-50 shadow-2xl">
        <div className="flex items-center justify-between border-b border-oak-200 p-5">
          <h3 className="font-serif text-2xl text-coffee-900">{t("order_title")}</h3>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1 hover:bg-oak-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {done ? (
          <div className="m-5 rounded-2xl bg-sage-100 px-4 py-8 text-center text-sage-700">
            {t("order_done")}
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto p-5">
              {MENU.map((m) => {
                const n = qty[m.id] ?? 0;
                return (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-3 border-b border-oak-100 py-3 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-coffee-900">{m.name[lang]}</p>
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
                        className="grid h-8 w-8 place-items-center rounded-full bg-coffee-900 text-oak-50"
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
                onClick={() => hasItems && setDone(true)}
                disabled={!hasItems}
                className="w-full rounded-full bg-coffee-900 py-3 text-sm font-medium text-oak-50 transition hover:bg-coffee-950 disabled:opacity-40"
              >
                {hasItems ? t("order_checkout") : t("order_empty")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
