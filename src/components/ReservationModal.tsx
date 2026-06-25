import { useState } from "react";
import { X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function ReservationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const [done, setDone] = useState(false);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-coffee-900/60 px-4 py-6 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-3xl bg-oak-50 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-2xl text-coffee-900">{t("reserve_title")}</h3>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1 hover:bg-oak-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {done ? (
          <div className="rounded-2xl bg-sage-100 px-4 py-6 text-center text-sage-700">{t("reserve_done")}</div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setDone(true);
            }}
            className="space-y-4"
          >
            <Field label={t("reserve_name")}>
              <input required maxLength={80} className={fieldCls} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("reserve_date")}>
                <input required type="date" className={fieldCls} />
              </Field>
              <Field label={t("reserve_time")}>
                <input required type="time" className={fieldCls} />
              </Field>
            </div>
            <Field label={t("reserve_guests")}>
              <input required type="number" min={1} max={20} defaultValue={2} className={fieldCls} />
            </Field>
            <Field label={t("reserve_notes")}>
              <textarea rows={3} maxLength={300} className={fieldCls} />
            </Field>
            <button
              type="submit"
              className="w-full rounded-full bg-coffee-900 py-3 text-sm font-medium text-oak-50 transition hover:bg-coffee-950"
            >
              {t("reserve_submit")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const fieldCls =
  "w-full rounded-xl border border-oak-200 bg-white px-3 py-2.5 text-sm text-coffee-900 outline-none focus:border-coffee-900";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-widest text-oak-700">{label}</span>
      {children}
    </label>
  );
}
