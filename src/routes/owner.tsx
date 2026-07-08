import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, UserPlus, LogIn } from "lucide-react";
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

function OwnerGate() {
  const navigate = useNavigate();
  const { hasAccount, isAuthenticated, validateToken, createAccount } = useAdminSession();
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  // form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) setMode(hasAccount ? "signin" : "signup");
  }, [ready, hasAccount]);

  useEffect(() => {
    if (ready && isAuthenticated) {
      navigate({ to: "/controls/xd92j7k" });
    }
  }, [ready, isAuthenticated, navigate]);

  if (!ready) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      if (mode === "signup") {
        if (!name.trim() || !email.trim()) return setErr("Name and email are required.");
        if (password.length < 6) return setErr("Password must be at least 6 characters.");
        if (password !== confirm) return setErr("Passwords do not match.");
        const ok = await createAccount({ name, email, password });
        if (!ok) return setErr("Could not create account. One may already exist on this device.");
      } else {
        const ok = await validateToken(password);
        if (!ok) return setErr("Incorrect password.");
      }
      navigate({ to: "/controls/xd92j7k" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-zinc-950 px-4 text-zinc-100">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-900/80 p-6 shadow-2xl backdrop-blur"
      >
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-amber-500/20 text-amber-400">
            {mode === "signup" ? <UserPlus className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          </span>
          <div>
            <p className="text-sm font-semibold">
              {mode === "signup" ? "Create owner account" : "Owner sign in"}
            </p>
            <p className="text-xs text-zinc-500">
              {mode === "signup"
                ? "Set up access to the Baratto control panel."
                : "Enter your password to access controls."}
            </p>
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
            <label className="text-[11px] uppercase tracking-widest text-zinc-500">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@cafebaratto.com"
              className="mb-3 mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-amber-500/60"
            />
          </>
        )}

        <label className="text-[11px] uppercase tracking-widest text-zinc-500">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus={mode === "signin"}
          placeholder="••••••••"
          className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-amber-500/60"
        />

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
          {mode === "signup" ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
          {mode === "signup" ? "Create account" : "Sign in"}
        </button>

        {hasAccount && (
          <button
            type="button"
            onClick={() => {
              setErr("");
              setMode(mode === "signin" ? "signup" : "signin");
            }}
            className="mt-2 w-full rounded-xl border border-white/10 py-2 text-xs text-zinc-400 hover:bg-white/5"
          >
            {mode === "signin" ? "Need to create an account?" : "Back to sign in"}
          </button>
        )}

        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="mt-2 w-full rounded-xl py-2 text-[11px] text-zinc-500 hover:text-zinc-300"
        >
          Back to site
        </button>

        <p className="mt-4 text-[11px] text-zinc-600">
          Credentials are stored on this device only. Manage your account from Controls → Settings after sign in.
        </p>
      </form>
    </div>
  );
}
