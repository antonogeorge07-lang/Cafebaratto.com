import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Clock, Archive } from "lucide-react";
import {
  getOrders,
  setOrderStatus,
  subscribe,
  type Order,
  type OrderStatus,
} from "@/lib/admin-store";

export const Route = createFileRoute("/controls/xd92j7k/_auth/kitchen")({
  component: KitchenPage,
});

const STATUS_LABEL: Record<OrderStatus, string> = {
  active: "In queue",
  fulfilled: "Ready / served",
  history: "Archived",
};

function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>(() => getOrders());

  useEffect(() => {
    const unsub = subscribe(() => setOrders(getOrders()));
    return unsub;
  }, []);

  const groups = useMemo(() => {
    const g: Record<OrderStatus, Order[]> = { active: [], fulfilled: [], history: [] };
    for (const o of orders) g[o.status]?.push(o);
    return g;
  }, [orders]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-5 py-8">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">Kitchen</p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight">Live order queue</h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            New orders appear here in real time. Mark as ready when served, archive when done.
          </p>
        </div>
        <div className="text-xs text-zinc-500">
          {groups.active.length} active · {groups.fulfilled.length} ready
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Column
          title={STATUS_LABEL.active}
          icon={<Clock className="h-4 w-4" />}
          accent="text-amber-400"
          orders={groups.active}
          renderActions={(o) => (
            <>
              <ActionBtn onClick={() => setOrderStatus(o.id, "fulfilled")} tone="emerald">
                <Check className="h-3.5 w-3.5" /> Mark ready
              </ActionBtn>
              <ActionBtn onClick={() => setOrderStatus(o.id, "history")} tone="zinc">
                <Archive className="h-3.5 w-3.5" /> Archive
              </ActionBtn>
            </>
          )}
        />
        <Column
          title={STATUS_LABEL.fulfilled}
          icon={<Check className="h-4 w-4" />}
          accent="text-emerald-400"
          orders={groups.fulfilled}
          renderActions={(o) => (
            <>
              <ActionBtn onClick={() => setOrderStatus(o.id, "active")} tone="amber">
                <Clock className="h-3.5 w-3.5" /> Back to queue
              </ActionBtn>
              <ActionBtn onClick={() => setOrderStatus(o.id, "history")} tone="zinc">
                <Archive className="h-3.5 w-3.5" /> Archive
              </ActionBtn>
            </>
          )}
        />
        <Column
          title={STATUS_LABEL.history}
          icon={<Archive className="h-4 w-4" />}
          accent="text-zinc-400"
          orders={groups.history.slice(0, 30)}
          renderActions={(o) => (
            <ActionBtn onClick={() => setOrderStatus(o.id, "active")} tone="amber">
              <Clock className="h-3.5 w-3.5" /> Reopen
            </ActionBtn>
          )}
        />
      </div>
    </main>
  );
}

function Column({
  title,
  icon,
  accent,
  orders,
  renderActions,
}: {
  title: string;
  icon: React.ReactNode;
  accent: string;
  orders: Order[];
  renderActions: (o: Order) => React.ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-3xl border border-white/10 bg-zinc-900/60 shadow-2xl">
      <header className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <div className={`inline-flex items-center gap-2 ${accent}`}>
          {icon}
          <span className="text-xs font-medium uppercase tracking-widest">{title}</span>
        </div>
        <span className="text-[11px] text-zinc-500">{orders.length}</span>
      </header>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {orders.length === 0 ? (
          <p className="px-2 py-8 text-center text-[11px] text-zinc-600">Nothing here.</p>
        ) : (
          orders.map((o) => (
            <article
              key={o.id}
              className="rounded-2xl border border-white/10 bg-zinc-950/60 p-3"
            >
              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                <span className="font-mono">{o.id}</span>
                <time>
                  {new Date(o.placedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
              <ul className="mt-2 space-y-0.5 text-xs text-zinc-200">
                {o.lineItems.map((li) => (
                  <li key={li.id} className="flex justify-between gap-2">
                    <span className="truncate">
                      <span className="text-zinc-500">{li.qty}×</span> {li.name}
                    </span>
                    <span className="tabular-nums text-zinc-500">
                      €{li.lineTotal.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-2">
                <span className="text-[11px] text-zinc-500">Total</span>
                <span className="text-sm font-semibold text-zinc-100">
                  €{o.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">{renderActions(o)}</div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function ActionBtn({
  children,
  onClick,
  tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone: "emerald" | "amber" | "zinc";
}) {
  const cls =
    tone === "emerald"
      ? "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
      : tone === "amber"
        ? "bg-amber-500 text-zinc-950 hover:bg-amber-400"
        : "border border-white/10 text-zinc-300 hover:bg-white/5";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${cls}`}
    >
      {children}
    </button>
  );
}
