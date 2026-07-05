import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BarChart3, ExternalLink, RefreshCw } from "lucide-react";
import { trackEvent } from "@/utils/analytics";

const LOYVERSE_URL = "https://r.loyverse.com/dashboard/";

export const Route = createFileRoute("/controls/xd92j7k/_auth/")({
  component: DashboardPage,
});

function DashboardPage() {
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    trackEvent("dashboard_external_click", { tool: "loyverse_reporting" });
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <section className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">Analytics</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Loyverse Business Analytics
          </h1>
          <p className="mt-1 max-w-xl text-sm text-zinc-400">
            Live sales, receipts and inventory piped from your Loyverse account.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <a
            href={LOYVERSE_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackEvent("dashboard_external_click", { tool: "loyverse_reporting", surface: "open_new_tab" })
            }
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-2 text-xs font-medium text-zinc-950 hover:bg-amber-400"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open in new tab
          </a>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60 shadow-2xl">
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2.5 text-xs text-zinc-500">
          <BarChart3 className="h-3.5 w-3.5" />
          <span>{LOYVERSE_URL}</span>
        </div>
        <div className="relative aspect-[16/10] w-full bg-zinc-950">
          <iframe
            key={reloadKey}
            title="Loyverse dashboard"
            src={LOYVERSE_URL}
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full"
          />
          <p className="pointer-events-none absolute inset-x-0 bottom-3 mx-auto max-w-md rounded-full bg-zinc-900/80 px-3 py-1.5 text-center text-[11px] text-zinc-400 backdrop-blur">
            If Loyverse blocks embedding, use “Open in new tab”.
          </p>
        </div>
      </section>
    </main>
  );
}
