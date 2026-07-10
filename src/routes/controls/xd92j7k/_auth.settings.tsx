import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, KeyRound, UserCog, Trash2, ShieldCheck } from "lucide-react";
import { trackEvent } from "@/utils/analytics";
import { useAdminSession } from "@/context/AdminSessionContext";
import { RecoveryCodeCard } from "@/components/RecoveryCodeCard";

export const Route = createFileRoute("/controls/xd92j7k/_auth/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">Setup</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">System settings</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Manage your owner account. All menu, pricing, POS, orders, bookings and
        inventory changes are made from their dedicated admin sections.
      </p>

      <AccountSection />
    </main>
  );
}

function AccountSection() {
  const { profile, updateProfile, changePassword, deleteAccount, signOut } = useAdminSession();
  const navigate = useNavigate();

  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [profileSaved, setProfileSaved] = useState(false);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [danger, setDanger] = useState("");
  const [dangerErr, setDangerErr] = useState("");

  useEffect(() => {
    setName(profile.name);
    setEmail(profile.email);
  }, [profile.name, profile.email]);

  const saveProfile = () => {
    updateProfile({ name: name.trim(), email: email.trim() });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 1600);
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (next.length < 6) return setPwMsg({ ok: false, text: "New password must be at least 6 characters." });
    if (next !== confirm) return setPwMsg({ ok: false, text: "Passwords do not match." });
    const ok = await changePassword(current, next);
    if (!ok) return setPwMsg({ ok: false, text: "Current password is incorrect." });
    setCurrent(""); setNext(""); setConfirm("");
    setPwMsg({ ok: true, text: "Password updated." });
    trackEvent("owner_password_changed", {});
  };

  const submitDelete = async () => {
    setDangerErr("");
    if (!confirm && !danger) return setDangerErr("Enter your password to confirm.");
    const ok = await deleteAccount(danger);
    if (!ok) return setDangerErr("Incorrect password.");
    navigate({ to: "/" });
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
            <p className="text-xs text-zinc-500">Displayed only to you on this device.</p>
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
              className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-amber-500/60"
            />
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
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-zinc-900/60 p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-amber-500/20 text-amber-400">
            <KeyRound className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">Change password</p>
            <p className="text-xs text-zinc-500">Update the password used to unlock Controls.</p>
          </div>
        </div>

        <form onSubmit={submitPassword} className="mt-6 grid gap-3">
          <input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="Current password"
            className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-amber-500/60"
          />
          <input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder="New password (min 6 characters)"
            className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-amber-500/60"
          />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new password"
            className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-amber-500/60"
          />
          {pwMsg && (
            <p className={`text-xs ${pwMsg.ok ? "text-emerald-400" : "text-red-400"}`}>{pwMsg.text}</p>
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
              onClick={() => { signOut(); navigate({ to: "/" }); }}
              className="rounded-xl border border-white/10 px-4 py-2 text-xs text-zinc-400 hover:bg-white/5"
            >
              Sign out
            </button>
          </div>
        </form>
      </section>

      <section className="mt-6 rounded-3xl border border-red-500/20 bg-red-500/5 p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-red-500/20 text-red-400">
            <Trash2 className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-red-200">Delete owner account</p>
            <p className="text-xs text-red-300/70">
              Removes the master password and profile from this device. Cannot be undone.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="password"
            value={danger}
            onChange={(e) => setDanger(e.target.value)}
            placeholder="Enter current password to confirm"
            className="w-full rounded-xl border border-red-500/20 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-red-500/60"
          />
          <button
            type="button"
            onClick={submitDelete}
            className="rounded-xl bg-red-500/90 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
          >
            Delete account
          </button>
        </div>
        {dangerErr && <p className="mt-2 text-xs text-red-300">{dangerErr}</p>}
      </section>
    </>
  );
}
