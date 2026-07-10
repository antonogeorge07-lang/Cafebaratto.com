import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Baratto · Set new password" },
      { name: "robots", content: "noindex,nofollow,noarchive" },
      { name: "description", content: "Set a new password for your Café Baratto owner account." },
    ],
  }),
  component: ResetPasswordPage,
});

/**
 * Magic-link landing page. Supabase places the recovery token in the URL hash
 * on arrival; the JS client picks it up automatically on load. We wait for the
 * PASSWORD_RECOVERY event (or an existing session) and then let the user set a
 * new password with `supabase.auth.updateUser({ password })`.
 */
function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setReady(true);
    // If Supabase already established a session from the URL fragment, we're good.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setRecoveryReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setRecoveryReady(true);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (password.length < 6) return setErr("Password must be at least 6 characters.");
    if (password !== confirm) return setErr("Passwords do not match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setErr(error.message);
    setDone(true);
    // Redirect into controls after a brief confirmation.
    setTimeout(() => navigate({ to: "/controls/xd92j7k" }), 800);
  };

  return (
    <div className="grid min-h-screen place-items-center bg-zinc-950 px-4 text-zinc-100">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-900/80 p-6 shadow-2xl backdrop-blur"
      >
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-amber-500/20 text-amber-400">
            {done ? <Check className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
          </span>
          <div>
            <p className="text-sm font-semibold">
              {done ? "Password updated" : "Set a new password"}
            </p>
            <p className="text-xs text-zinc-500">
              {done
                ? "Signing you in to controls…"
                : recoveryReady
                ? "Choose a new password to finish signing in."
                : "Waiting for your secure recovery link…"}
            </p>
          </div>
        </div>

        {!done && (
          <>
            <label className="text-[11px] uppercase tracking-widest text-zinc-500">
              New password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
              autoComplete="new-password"
              disabled={!recoveryReady}
              className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-amber-500/60 disabled:opacity-50"
            />
            <label className="mt-3 block text-[11px] uppercase tracking-widest text-zinc-500">
              Confirm password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={!recoveryReady}
              className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-amber-500/60 disabled:opacity-50"
            />

            {err && <p className="mt-2 text-xs text-red-400">{err}</p>}

            <button
              type="submit"
              disabled={busy || !recoveryReady}
              className="mt-4 w-full rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-60"
            >
              {busy ? "Updating…" : "Set password & sign in"}
            </button>

            {!recoveryReady && (
              <p className="mt-3 text-[11px] text-zinc-500">
                Open this page from the reset link in your email. If the link expired,{" "}
                <button
                  type="button"
                  onClick={() => navigate({ to: "/owner" })}
                  className="text-amber-400 underline-offset-2 hover:underline"
                >
                  request a new one
                </button>
                .
              </p>
            )}
          </>
        )}
      </form>
    </div>
  );
}
