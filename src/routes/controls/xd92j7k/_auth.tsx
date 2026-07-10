import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useAdminSession } from "@/context/AdminSessionContext";

export const Route = createFileRoute("/controls/xd92j7k/_auth")({
  head: () => ({
    meta: [
      { title: "Baratto · Controls" },
      { name: "robots", content: "noindex,nofollow,noarchive" },
    ],
  }),
  component: AuthLayout,
});

function AuthLayout() {
  const { isAuthenticated, isLoading, signOut } = useAdminSession();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-zinc-950 text-zinc-500">
        <span className="text-xs">Loading…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="grid min-h-screen place-items-center bg-zinc-950 px-4 text-zinc-100">
        <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-900/80 p-6 text-center shadow-2xl">
          <span className="mx-auto mb-4 grid h-10 w-10 place-items-center rounded-2xl bg-amber-500/20 text-amber-400">
            <Lock className="h-5 w-5" />
          </span>
          <p className="text-sm font-semibold">Owner access required</p>
          <p className="mt-2 text-xs text-zinc-500">
            Sign in with your owner account to open Controls.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/owner" })}
            className="mt-5 w-full rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400"
          >
            Go to sign in
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="mt-2 w-full rounded-xl border border-white/10 py-2 text-xs text-zinc-400 hover:bg-white/5"
          >
            Back to site
          </button>
        </div>
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
            onClick={async () => {
              await signOut();
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
