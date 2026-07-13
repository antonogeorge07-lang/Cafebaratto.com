import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, UserPlus, LogIn, Mail, Check } from "lucide-react";
import { useAdminSession } from "@/context/AdminSessionContext";

export const Route = createFileRoute("/owner")({
  head: () => ({
    meta: [
      { title: "Baratto · Owner access" },
      { name: "robots", content: "noindex,nofollow,noarchive" },
      { name: "description", content: "Owner sign in for Café Baratto." },
    ],
  }),
  component: OwnerGate,
});

type Mode = "signin" | "signup" | "forgot";

function OwnerGate() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, ownerExists, signIn, signUp, sendPasswordResetEmail } =
    useAdminSession();

  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate({ to: "/controls/xd92j7k" });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-zinc-950 text-zinc-500">
        <span className="text-xs">Loading…</span>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      if (mode === "signup") {
        if (!name.trim() || !email.trim()) return setErr("Name and email are required.");
        if (password.length < 6) return setErr("Password must be at least 6 characters.");
        if (password !== confirm) return setErr("Passwords do not match.");
        const res = await signUp({ name, email, password });
        if (!res.ok) return setErr(res.error ?? "Could not create account.");
        // Auto-confirm is enabled — user is signed in immediately.
      } else if (mode === "signin") {
        const res = await signIn(email, password);
        if (!res.ok) return setErr(res.error ?? "Incorrect email or password.");
      } else {
        // forgot: send magic reset link
        if (!email.trim()) return setErr("Enter your email address.");
        const res = await sendPasswordResetEmail(email);
        if (!res.ok) return setErr(res.error ?? "Could not send reset link.");
        setResetSent(true);
      }
    } finally {
      setBusy(false);
    }
  };

  if (resetSent) {
    return (
      <div className="grid min-h-screen place-items-center bg-zinc-950 px-4 text-zinc-100">
        <div className="w-full max-w-sm rounded-3xl border border-emerald-500/30 bg-zinc-900/80 p-6 text-center shadow-2xl">
          <span className="mx-auto mb-4 grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-400">
            <Check className="h-5 w-5" />
          </span>
          <p className="text-sm font-semibold">Check your inbox</p>
          <p className="mt-2 text-xs text-zinc-400">
            If an account exists for <span className="text-zinc-200">{email}</span>, we've
            sent a password reset link. Click the link in the email to set a new password —
            no codes to copy.
          </p>
          <button
            type="button"
            onClick={() => {
              setResetSent(false);
              setMode("signin");
              setPassword("");
              setErr("");
            }}
            className="mt-5 w-full rounded-xl border border-white/10 py-2 text-xs text-zinc-300 hover:bg-white/5"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  const title =
    mode === "signup"
      ? "Create owner account"
      : mode === "forgot"
      ? "Reset password"
      : "Owner sign in";
  const subtitle =
    mode === "signup"
      ? "Set up access to the Baratto control panel."
      : mode === "forgot"
      ? "We'll email you a secure link to set a new password."
      : "Enter your credentials to access controls.";

  return (
    <div className="grid min-h-screen place-items-center bg-zinc-950 px-4 text-zinc-100">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-900/80 p-6 shadow-2xl backdrop-blur"
      >
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-amber-500/20 text-amber-400">
            {mode === "signup" ? (
              <UserPlus className="h-4 w-4" />
            ) : mode === "forgot" ? (
              <Mail className="h-4 w-4" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
          </span>
          <div>
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-xs text-zinc-500">{subtitle}</p>
          </div>
        </div>

        {mode === "signup" && (
          <>
            <label className="text-[11px] uppercase tracking-widest text-zinc-500">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              placeholder="Owner name"
              className="mb-3 mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-amber-500/60"
            />
          </>
        )}

        <label className="text-[11px] uppercase tracking-widest text-zinc-500">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus={mode !== "signup"}
          placeholder="owner@cafebaratto.com"
          autoComplete="email"
          className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-amber-500/60"
        />

        {mode !== "forgot" && (
          <>
            <label className="mt-3 block text-[11px] uppercase tracking-widest text-zinc-500">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-amber-500/60"
            />
          </>
        )}

        {mode === "signup" && (
          <>
            <label className="mt-3 block text-[11px] uppercase tracking-widest text-zinc-500">
              Confirm password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-amber-500/60"
            />
          </>
        )}

        {err && <p className="mt-2 text-xs text-red-400">{err}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-60"
        >
          {mode === "signup" ? (
            <UserPlus className="h-4 w-4" />
          ) : mode === "forgot" ? (
            <Mail className="h-4 w-4" />
          ) : (
            <LogIn className="h-4 w-4" />
          )}
          {busy
            ? "Please wait…"
            : mode === "signup"
            ? "Create account"
            : mode === "forgot"
            ? "Send reset link"
            : "Sign in"}
        </button>

        {mode === "signin" && (
          <button
            type="button"
            onClick={() => {
              setErr("");
              setPassword("");
              setMode("forgot");
            }}
            className="mt-2 w-full rounded-xl py-2 text-xs text-amber-400 hover:text-amber-300"
          >
            Forgot password?
          </button>
        )}

        {(mode === "forgot" || mode === "signup") && (
          <button
            type="button"
            onClick={() => {
              setErr("");
              setPassword("");
              setConfirm("");
              setMode("signin");
            }}
            className="mt-2 w-full rounded-xl border border-white/10 py-2 text-xs text-zinc-400 hover:bg-white/5"
          >
            Back to sign in
          </button>
        )}

        {mode === "signin" && (
          <button
            type="button"
            onClick={() => {
              setErr("");
              setMode("signup");
            }}
            className="mt-2 w-full rounded-xl border border-white/10 py-2 text-xs text-zinc-400 hover:bg-white/5"
          >
            First time here? Create the owner account
          </button>
        )}

        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="mt-2 w-full rounded-xl py-2 text-[11px] text-zinc-500 hover:text-zinc-300"
        >
          Back to site
        </button>
      </form>
    </div>
  );
}
