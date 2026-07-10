import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock, UserPlus, LogIn, KeyRound } from "lucide-react";
import { useAdminSession } from "@/context/AdminSessionContext";
import { RecoveryCodeCard } from "@/components/RecoveryCodeCard";

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
  const {
    hasAccount,
    isAuthenticated,
    validateToken,
    createAccount,
    resetPasswordWithCode,
    hasRecoveryCode,
  } = useAdminSession();
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<Mode>("signin");

  // form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [recoveryInput, setRecoveryInput] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // one-time recovery code display (after signup or reset)
  const [issuedCode, setIssuedCode] = useState<string | null>(null);
  const [issuedContext, setIssuedContext] = useState<"signup" | "reset">("signup");

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) setMode(hasAccount ? "signin" : "signup");
  }, [ready, hasAccount]);

  useEffect(() => {
    if (ready && isAuthenticated && !issuedCode) {
      navigate({ to: "/controls/xd92j7k" });
    }
  }, [ready, isAuthenticated, issuedCode, navigate]);

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
        const res = await createAccount({ name, email, password });
        if (!res.ok) return setErr("Could not create account. One may already exist on this device.");
        if (res.recoveryCode) {
          setIssuedContext("signup");
          setIssuedCode(res.recoveryCode);
          return;
        }
        navigate({ to: "/controls/xd92j7k" });
      } else if (mode === "signin") {
        const ok = await validateToken(password);
        if (!ok) return setErr("Incorrect password.");
        navigate({ to: "/controls/xd92j7k" });
      } else {
        // forgot
        if (password !== confirm) return setErr("Passwords do not match.");
        const res = await resetPasswordWithCode(recoveryInput, password);
        if (!res.ok) return setErr(res.error ?? "Could not reset password.");
        if (res.recoveryCode) {
          setIssuedContext("reset");
          setIssuedCode(res.recoveryCode);
          return;
        }
        navigate({ to: "/controls/xd92j7k" });
      }
    } finally {
      setBusy(false);
    }
  };

  if (issuedCode) {
    return (
      <div className="grid min-h-screen place-items-center bg-zinc-950 px-4 text-zinc-100">
        <div className="w-full max-w-sm">
          <RecoveryCodeCard
            code={issuedCode}
            title={issuedContext === "signup" ? "Save your recovery code" : "Password reset — new recovery code"}
            description={
              issuedContext === "signup"
                ? "Store this somewhere safe. It's the only way to reset your password if you forget it. It will not be shown again."
                : "Your previous recovery code has been replaced. Store this new one — it won't be shown again."
            }
            onDone={() => {
              setIssuedCode(null);
              navigate({ to: "/controls/xd92j7k" });
            }}
          />
        </div>
      </div>
    );
  }

  const title =
    mode === "signup" ? "Create owner account" : mode === "forgot" ? "Reset password" : "Owner sign in";
  const subtitle =
    mode === "signup"
      ? "Set up access to the Baratto control panel."
      : mode === "forgot"
      ? "Enter your recovery code to set a new password."
      : "Enter your password to access controls.";

  return (
    <div className="grid min-h-screen place-items-center bg-zinc-950 px-4 text-zinc-100">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-900/80 p-6 shadow-2xl backdrop-blur"
      >
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-amber-500/20 text-amber-400">
            {mode === "signup" ? <UserPlus className="h-4 w-4" /> : mode === "forgot" ? <KeyRound className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
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

        {mode === "forgot" && (
          <>
            {!hasRecoveryCode && (
              <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] leading-relaxed text-amber-200">
                No recovery code exists for the account on this device (it was created before recovery codes were available). Sign in with your current password, then generate one from <span className="font-semibold">Controls → Settings → Recovery code</span>. If you've lost the password, you can reset this device's account below and create a new one.
              </div>
            )}
            <label className="text-[11px] uppercase tracking-widest text-zinc-500">Recovery code</label>
            <input
              type="text"
              value={recoveryInput}
              onChange={(e) => setRecoveryInput(e.target.value)}
              autoFocus
              placeholder="XXXX-XXXX-XXXX-XXXX"
              autoComplete="off"
              spellCheck={false}
              disabled={!hasRecoveryCode}
              className="mb-3 mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 font-mono text-sm tracking-widest outline-none focus:border-amber-500/60 disabled:opacity-50"
            />
          </>
        )}

        <label className="text-[11px] uppercase tracking-widest text-zinc-500">
          {mode === "forgot" ? "New password" : "Password"}
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus={mode === "signin"}
          placeholder="••••••••"
          disabled={mode === "forgot" && !hasRecoveryCode}
          className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-amber-500/60 disabled:opacity-50"
        />

        {(mode === "signup" || mode === "forgot") && (
          <>
            <label className="mt-3 block text-[11px] uppercase tracking-widest text-zinc-500">
              Confirm password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              disabled={mode === "forgot" && !hasRecoveryCode}
              className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-amber-500/60 disabled:opacity-50"
            />
          </>
        )}

        {err && <p className="mt-2 text-xs text-red-400">{err}</p>}

        <button
          type="submit"
          disabled={busy || (mode === "forgot" && !hasRecoveryCode)}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-60"
        >
          {mode === "signup" ? <UserPlus className="h-4 w-4" /> : mode === "forgot" ? <KeyRound className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
          {mode === "signup" ? "Create account" : mode === "forgot" ? "Reset password" : "Sign in"}
        </button>

        {mode === "forgot" && !hasRecoveryCode && (
          <button
            type="button"
            onClick={() => {
              const sure = window.confirm(
                "Reset this device's owner account? This wipes the stored password and profile so you can create a new account. App data (menu, orders, bookings) is not affected.",
              );
              if (!sure) return;
              try {
                localStorage.removeItem("baratto.admin.masterHash");
                localStorage.removeItem("baratto.admin.profile");
                localStorage.removeItem("baratto.admin.recoveryHash");
              } catch {}
              window.location.reload();
            }}
            className="mt-2 w-full rounded-xl border border-red-500/30 bg-red-500/10 py-2 text-xs text-red-300 hover:bg-red-500/20"
          >
            Reset this device's account
          </button>
        )}

        {mode === "signin" && hasAccount && (
          <button
            type="button"
            onClick={() => {
              setErr("");
              setPassword("");
              setConfirm("");
              setMode("forgot");
            }}
            className="mt-2 w-full rounded-xl py-2 text-xs text-amber-400 hover:text-amber-300"
          >
            Forgot password?
          </button>
        )}

        {mode === "forgot" && (
          <button
            type="button"
            onClick={() => {
              setErr("");
              setPassword("");
              setConfirm("");
              setRecoveryInput("");
              setMode("signin");
            }}
            className="mt-2 w-full rounded-xl border border-white/10 py-2 text-xs text-zinc-400 hover:bg-white/5"
          >
            Back to sign in
          </button>
        )}

        {hasAccount && mode !== "forgot" && (
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
