import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/unsubscribe")({
  head: () => ({
    meta: [
      { title: "Unsubscribe · Cafetería Baratto" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: UnsubscribePage,
});

type State =
  | { kind: "loading" }
  | { kind: "invalid" }
  | { kind: "already" }
  | { kind: "ready"; email: string }
  | { kind: "working" }
  | { kind: "done" }
  | { kind: "error"; message: string };

function UnsubscribePage() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token");
    if (!t) {
      setState({ kind: "invalid" });
      return;
    }
    setToken(t);
    fetch(`/email/unsubscribe?token=${encodeURIComponent(t)}`)
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok || !body?.valid) {
          if (body?.reason === "used" || body?.alreadyUsed) return setState({ kind: "already" });
          return setState({ kind: "invalid" });
        }
        setState({ kind: "ready", email: body.email ?? "your address" });
      })
      .catch(() => setState({ kind: "invalid" }));
  }, []);

  const confirm = async () => {
    if (!token) return;
    setState({ kind: "working" });
    try {
      const res = await fetch("/email/unsubscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) throw new Error("Could not unsubscribe");
      setState({ kind: "done" });
    } catch (e) {
      setState({ kind: "error", message: e instanceof Error ? e.message : "Could not unsubscribe" });
    }
  };

  return (
    <div className="min-h-screen bg-oak-50 px-4 py-24 text-coffee-900">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.25em] text-oak-700">Cafetería Baratto</p>
        <h1 className="mt-2 font-serif text-3xl">Email preferences</h1>
        {state.kind === "loading" && <p className="mt-4 text-sm text-coffee-900/70">Checking your link…</p>}
        {state.kind === "invalid" && (
          <p className="mt-4 text-sm text-coffee-900/70">
            This unsubscribe link is invalid or has expired.
          </p>
        )}
        {state.kind === "already" && (
          <p className="mt-4 text-sm text-coffee-900/70">
            You&apos;ve already been unsubscribed. No further emails will be sent.
          </p>
        )}
        {state.kind === "ready" && (
          <>
            <p className="mt-4 text-sm text-coffee-900/70">
              Confirm you want to unsubscribe <strong>{state.email}</strong> from Cafetería Baratto emails.
            </p>
            <button
              onClick={confirm}
              className="mt-6 w-full rounded-full bg-coffee-900 py-3 text-sm font-medium text-oak-50 hover:bg-coffee-950"
            >
              Confirm unsubscribe
            </button>
          </>
        )}
        {state.kind === "working" && <p className="mt-4 text-sm">Unsubscribing…</p>}
        {state.kind === "done" && (
          <p className="mt-4 text-sm text-sage-700">You&apos;ve been unsubscribed. Grazie!</p>
        )}
        {state.kind === "error" && (
          <p className="mt-4 text-sm text-red-700">{state.message}</p>
        )}
      </div>
    </div>
  );
}
