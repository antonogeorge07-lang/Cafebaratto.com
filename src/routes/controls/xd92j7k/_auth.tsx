import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { useAdminSession, isAuthenticatedClient } from "@/context/AdminSessionContext";

export const Route = createFileRoute("/controls/xd92j7k/_auth")({
  head: () => ({
    meta: [
      { title: "Baratto · Controls" },
      { name: "robots", content: "noindex,nofollow,noarchive" },
    ],
  }),
  beforeLoad: () => {
    // localStorage/sessionStorage aren't available during SSR — skip and
    // let the client-side guard below take over.
    if (typeof window === "undefined") return;
    if (!isAuthenticatedClient()) {
      throw redirect({ to: "/" });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  const { isAuthenticated, validateToken, signOut } = useAdminSession();
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [err, setErr] = useState("");
  const [ready, setReady] = useState(false);

  // Second-pass client guard: covers the case where beforeLoad ran on the
  // server (no window) and let us through.
  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) return null;

  if (!isAuthenticated) {
    return (
      <div className="grid min-h-screen place-items-center bg-zinc-950 px-4 text-zinc-100">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setErr("");
            const ok = await validateToken(token.trim());
            if (!ok) setErr("Invalid token.");
            else setToken("");
          }}
          className="w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-900/80 p-6 shadow-2xl backdrop-blur"
        >
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-amber-500/20 text-amber-400">
              <Lock className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">Baratto Controls</p>
              <p className="text-xs text-zinc-500">Owner access required</p>
            </div>
          </div>
          <label className="text-[11px] uppercase tracking-widest text-zinc-500">Access token</label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoFocus
            placeholder="••••••••"
            className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-amber-500/60"
          />
          {err && <p className="mt-2 text-xs text-red-400">{err}</p>}
          <button
            type="submit"
            className="mt-4 w-full rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400"
          >
            Unlock
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="mt-2 w-full rounded-xl border border-white/10 py-2 text-xs text-zinc-400 hover:bg-white/5"
          >
            Cancel
          </button>
          <p className="mt-4 text-[11px] text-zinc-600">
            First-time setup uses your first entry as the master token.
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-zinc-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3">
          <span className="text-sm font-semibold tracking-tight">Baratto Controls</span>
          <nav className="ml-4 flex items-center gap-1 text-xs">
            <button
              onClick={() => navigate({ to: "/controls/xd92j7k" })}
              className="rounded-full px-3 py-1.5 text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate({ to: "/controls/xd92j7k/settings" })}
              className="rounded-full px-3 py-1.5 text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
            >
              Settings
            </button>
          </nav>
          <button
            onClick={() => {
              signOut();
              navigate({ to: "/" });
            }}
            className="ml-auto rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/5"
          >
            Sign out
          </button>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
