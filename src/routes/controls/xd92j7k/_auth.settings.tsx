import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Check, KeyRound, UserCog, Eye, EyeOff, Sparkles, ListChecks, Image as ImageIcon, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/utils/analytics";
import { useAdminSession } from "@/context/AdminSessionContext";
import {
  getSettings,
  setSettings,
  subscribe,
  DEFAULT_SETTINGS,
  type SiteSettings,
} from "@/lib/admin-store";
import { OFFER_SLOT_COUNT, normalizeOfferSlots, type OfferSlot } from "@/lib/admin-store-types";


export const Route = createFileRoute("/controls/xd92j7k/_auth/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">Setup</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">System settings</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Manage your owner account and control what visitors see on the public site.
      </p>

      <AccountSection />
      <LandingVisibilitySection />
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Account                                                             */
/* ------------------------------------------------------------------ */

function AccountSection() {
  const { profile, updateProfile, changePassword, signOut } = useAdminSession();
  const navigate = useNavigate();

  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [nextPw, setNextPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    setName(profile.name);
    setEmail(profile.email);
  }, [profile.name, profile.email]);

  const saveProfile = async () => {
    setProfileSaved(false);
    setProfileMsg(null);
    try {
      const emailChanged = email.trim().toLowerCase() !== profile.email.trim().toLowerCase();
      await updateProfile({ name: name.trim(), email: email.trim() });
      if (emailChanged) {
        setProfileMsg({
          ok: true,
          text: `Confirmation link sent to ${email.trim()}. Click it to activate this address — password resets will then be sent there.`,
        });
      } else {
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 1600);
      }
    } catch (err) {
      setProfileMsg({
        ok: false,
        text: err instanceof Error ? err.message : "Could not update email.",
      });
    }
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (nextPw.length < 6)
      return setPwMsg({ ok: false, text: "New password must be at least 6 characters." });
    if (nextPw !== confirm) return setPwMsg({ ok: false, text: "Passwords do not match." });
    const res = await changePassword(nextPw);
    if (!res.ok) return setPwMsg({ ok: false, text: res.error ?? "Could not update password." });
    setNextPw("");
    setConfirm("");
    setPwMsg({ ok: true, text: "Password updated." });
    trackEvent("owner_password_changed", {});
  };

  return (
    <>
      <section className="mt-6 rounded-3xl border border-white/10 bg-zinc-900/60 p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-amber-500/20 text-amber-400">
            <UserCog className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">Owner profile</p>
            <p className="text-xs text-zinc-500">Your account details.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-[11px] uppercase tracking-widest text-zinc-500">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-amber-500/60"
            />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-widest text-zinc-500">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-500/60"
            />
            <p className="mt-1.5 text-[11px] text-zinc-500">
              Password reset emails are sent to this address. Changing it requires confirming a link from your new inbox.
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={saveProfile}
            className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400"
          >
            Save profile
          </button>
          {profileSaved && (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
              <Check className="h-3.5 w-3.5" /> Saved.
            </span>
          )}
        </div>
        {profileMsg && (
          <p className={`mt-3 text-xs ${profileMsg.ok ? "text-emerald-400" : "text-red-400"}`}>
            {profileMsg.text}
          </p>
        )}
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-zinc-900/60 p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-amber-500/20 text-amber-400">
            <KeyRound className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">Change password</p>
            <p className="text-xs text-zinc-500">
              You're already signed in — pick a new password below. To reset a forgotten
              password, use the magic link on the sign-in page.
            </p>
          </div>
        </div>

        <form onSubmit={submitPassword} className="mt-6 grid gap-3">
          <input
            type="password"
            value={nextPw}
            onChange={(e) => setNextPw(e.target.value)}
            placeholder="New password (min 6 characters)"
            autoComplete="new-password"
            className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-amber-500/60"
          />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new password"
            autoComplete="new-password"
            className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-amber-500/60"
          />
          {pwMsg && (
            <p className={`text-xs ${pwMsg.ok ? "text-emerald-400" : "text-red-400"}`}>
              {pwMsg.text}
            </p>
          )}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400"
            >
              Update password
            </button>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                navigate({ to: "/" });
              }}
              className="rounded-xl border border-white/10 px-4 py-2 text-xs text-zinc-400 hover:bg-white/5"
            >
              Sign out
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Landing visibility (Special Offer + Menu)                           */
/* ------------------------------------------------------------------ */

function LandingVisibilitySection() {
  const [s, setS] = useState<SiteSettings>(() => getSettings());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setS(getSettings());
    const unsub = subscribe(() => setS(getSettings()));
    return unsub;
  }, []);

  const update = (patch: Partial<SiteSettings>) => {
    setSettings(patch);
    setS((prev) => ({ ...prev, ...patch }));
    setSaved(true);
    trackEvent("site_settings_updated", { keys: Object.keys(patch) });
    setTimeout(() => setSaved(false), 1200);
  };

  return (
    <>
      {/* Special Offer */}
      <section className="mt-6 rounded-3xl border border-white/10 bg-zinc-900/60 p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-amber-500/20 text-amber-400">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">Special Offer banner</p>
              <p className="text-xs text-zinc-500">
                Shown on the landing page only when enabled.
              </p>
            </div>
          </div>
          <ToggleSwitch
            checked={s.offerEnabled}
            onChange={(v) => update({ offerEnabled: v })}
            label={s.offerEnabled ? "Visible" : "Hidden"}
          />
        </div>

        <div className="mt-6 grid gap-3">
          <LabeledInput
            label="Headline"
            value={s.offerHeadline}
            onChange={(v) => update({ offerHeadline: v })}
            placeholder={DEFAULT_SETTINGS.offerHeadline}
          />
          <LabeledTextarea
            label="Description"
            value={s.offerBody}
            onChange={(v) => update({ offerBody: v })}
            placeholder={DEFAULT_SETTINGS.offerBody}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <LabeledInput
              label="Coupon code"
              value={s.offerCode}
              onChange={(v) => update({ offerCode: v.toUpperCase() })}
              placeholder={DEFAULT_SETTINGS.offerCode}
              className="font-mono uppercase tracking-widest"
            />
            <LabeledInput
              label="CTA label"
              value={s.offerCtaLabel}
              onChange={(v) => update({ offerCtaLabel: v })}
              placeholder={DEFAULT_SETTINGS.offerCtaLabel}
            />
          </div>
          <LabeledInput
            label="CTA link (URL or #anchor)"
            value={s.offerCtaHref}
            onChange={(v) => update({ offerCtaHref: v })}
            placeholder={DEFAULT_SETTINGS.offerCtaHref}
          />

          <OfferSlotsEditor
            slots={normalizeOfferSlots(s.offerSlots)}
            onChange={(slots) => update({ offerSlots: slots })}
          />
        </div>

      </section>

      {/* Menu visibility */}
      <section className="mt-6 rounded-3xl border border-white/10 bg-zinc-900/60 p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-amber-500/20 text-amber-400">
              {s.menuVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </span>
            <div>
              <p className="text-sm font-semibold">Public menu</p>
              <p className="text-xs text-zinc-500">
                When hidden, /menu shows a friendly "temporarily unavailable" notice.
              </p>
            </div>
          </div>
          <ToggleSwitch
            checked={s.menuVisible}
            onChange={(v) => update({ menuVisible: v })}
            label={s.menuVisible ? "Visible" : "Hidden"}
          />
        </div>
        <p className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-950/50 px-3 py-2 text-[11px] text-zinc-400">
          <ListChecks className="h-3.5 w-3.5" />
          Per-item hide toggles are on each row of the Dashboard's inventory table.
        </p>
      </section>

      {saved && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-400">
          <Check className="h-3.5 w-3.5" /> Saved · live on the public site.
        </p>
      )}
    </>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-2 rounded-full border px-1 py-1 text-[11px] transition ${
        checked
          ? "border-amber-500/60 bg-amber-500/20 text-amber-200"
          : "border-white/10 bg-zinc-950 text-zinc-500"
      }`}
    >
      <span
        className={`grid h-5 w-5 place-items-center rounded-full transition ${
          checked ? "translate-x-4 bg-amber-400" : "translate-x-0 bg-zinc-700"
        }`}
      />
      <span className="pr-2">{label ?? (checked ? "On" : "Off")}</span>
    </button>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-widest text-zinc-500">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-amber-500/60 ${className ?? ""}`}
      />
    </label>
  );
}

function LabeledTextarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-widest text-zinc-500">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-amber-500/60"
      />
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Offer slots editor (5 fixed slots, each with image/title/price/toggle) */
/* ------------------------------------------------------------------ */

function OfferSlotsEditor({
  slots,
  onChange,
}: {
  slots: OfferSlot[];
  onChange: (slots: OfferSlot[]) => void;
}) {
  const updateSlot = (index: number, patch: Partial<OfferSlot>) => {
    const next = slots.map((slot, i) => (i === index ? { ...slot, ...patch } : slot));
    onChange(next);
  };

  const visibleCount = slots.filter((s) => s.visible).length;

  return (
    <div className="mt-2 rounded-2xl border border-white/10 bg-zinc-950/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-zinc-200">Offer slots</p>
          <p className="text-[11px] text-zinc-500">
            Up to {OFFER_SLOT_COUNT} featured items. Active slots auto-arrange on the landing page.
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] uppercase tracking-widest text-zinc-400">
          {visibleCount}/{OFFER_SLOT_COUNT} visible
        </span>
      </div>

      <ul className="mt-4 grid gap-3">
        {slots.map((slot, i) => (
          <li
            key={i}
            className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-white/10 bg-zinc-900/60 p-3"
          >
            <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-white/10 bg-zinc-950">
              {slot.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={slot.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <ImageIcon className="h-4 w-4 text-zinc-600" />
              )}
            </div>

            <div className="grid min-w-0 gap-2">
              <input
                type="text"
                value={slot.title}
                onChange={(e) => updateSlot(i, { title: e.target.value })}
                placeholder={`Slot ${i + 1} title`}
                className="w-full rounded-lg border border-white/10 bg-zinc-950 px-2.5 py-1.5 text-sm outline-none focus:border-amber-500/60"
              />
              <div className="grid grid-cols-[minmax(0,1fr)_auto_100px] gap-2">
                <input
                  type="url"
                  value={slot.imageUrl}
                  onChange={(e) => updateSlot(i, { imageUrl: e.target.value })}
                  placeholder="Image URL or upload →"
                  className="w-full min-w-0 rounded-lg border border-white/10 bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-300 outline-none focus:border-amber-500/60"
                />
                <SlotUploadButton
                  index={i}
                  onUploaded={(url) => updateSlot(i, { imageUrl: url })}
                />
                <div className="relative">
                  <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-zinc-500">
                    €
                  </span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={Number.isFinite(slot.price) ? slot.price : 0}
                    onChange={(e) =>
                      updateSlot(i, { price: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0.00"
                    className="w-full rounded-lg border border-white/10 bg-zinc-950 pl-5 pr-2 py-1.5 text-xs text-zinc-300 outline-none focus:border-amber-500/60"
                  />
                </div>
              </div>
            </div>

            <ToggleSwitch
              checked={slot.visible}
              onChange={(v) => updateSlot(i, { visible: v })}
              label={slot.visible ? "Show" : "Hide"}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

