import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Baratto · Reset Password" },
      { name: "robots", content: "noindex,nofollow,noarchive" },
      { name: "description", content: "Reset password for the Café Baratto management account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const verifyRecoveryAccess = async () => {
      try {
        // 1. Production Safe-Guard: Instantly read raw window properties
        // to check if this is an authentic incoming recovery redirect link.
        const rawUrl = window.location.href;
        const rawHash = window.location.hash;

        const hasRecoveryContext =
          rawUrl.includes("type=recovery") || rawHash.includes("access_token=") || rawUrl.includes("access_token=");

        // 2. Check if Supabase has already mapped this to an active session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session || hasRecoveryContext) {
          setIsAuthorized(true);
        }
      } catch (e) {
        console.error("Auth initialization error:", e);
      } finally {
        setCheckingAuth(false);
      }
    };

    verifyRecoveryAccess();

    // Secondary backup listener in case session maps a fraction of a second later
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setIsAuthorized(true);
      }
    });

    return () => {
      if (sub?.subscription) sub.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");

    if (password.length < 6) {
      return setErr("Password must be at least 6 characters.");
    }
    if (password !== confirm) {
      return setErr("Passwords do not match.");
    }

    setBusy(true);

    // Updates the authenticated user profile password instantly
    const { error } = await supabase.auth.updateUser({ password });

    setBusy(false);

    if (error) {
      return setErr(error.message);
    }

    setSuccess(true);

    // Secure live platform destination routing
    setTimeout(() => {
      navigate({ to: "/controls/xd92j7k" });
    }, 1000);
  };

  if (checkingAuth) {
    return (
      <div className="grid min-h-screen place-items-center bg-zinc-950 text-zinc-500 text-xs tracking-wider uppercase font-medium">
        Validating secure session...
      </div>
    );
  }

  return (
    <div className="grid min-h-screen place-items-center bg-zinc-950 px-4 text-zinc-100 select-none">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-900/80 p-6 shadow-2xl backdrop-blur"
      >
        {/* Header Block */}
        <div className="mb-5 flex items-center gap-3">
          <span
            className={`grid h-9 w-9 place-items-center rounded-2xl text-sm ${
              !isAuthorized
                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                : success
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
            }`}
          >
            {success ? <Check className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight">{success ? "Password updated!" : "Reset Password"}</p>
            <p className="text-xs text-zinc-500">
              {success
                ? "Redirecting to your panel..."
                : isAuthorized
                  ? "Choose a secure new master key."
                  : "Unidentified entry blocked."}
            </p>
          </div>
        </div>

        {/* Access Blocker */}
        {!isAuthorized ? (
          <div className="mt-2 space-y-3">
            <div className="flex gap-3 rounded-xl bg-red-500/5 p-3.5 text-xs text-zinc-400 border border-red-500/10 leading-relaxed">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
              <p>
                This route can only be initiated via the secure email link requested from your sign-in portal.
                Unidentified access is denied.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate({ to: "/owner" })}
              className="w-full rounded-xl bg-zinc-800 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition active:scale-[0.98]"
            >
              Return to Portal
            </button>
          </div>
        ) : (
          /* Locked Control Form */
          !success && (
            <>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoFocus
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-500/50 transition"
                />
              </div>

              <div className="mt-3.5 space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-500/50 transition"
                />
              </div>

              {err && (
                <div className="mt-3 text-xs text-red-400 flex items-center gap-1.5 bg-red-500/5 border border-red-500/10 px-3 py-2 rounded-lg">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                  {err}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="mt-5 w-full rounded-xl bg-amber-500 py-2.5 text-sm font-bold text-zinc-950 hover:bg-amber-400 active:scale-[0.99] disabled:opacity-50 transition"
              >
                {busy ? "Applying Changes..." : "Apply New Password"}
              </button>
            </>
          )
        )}
      </form>
    </div>
  );
}
