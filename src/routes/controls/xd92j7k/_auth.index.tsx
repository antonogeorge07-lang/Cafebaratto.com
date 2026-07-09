import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  Package,
  DollarSign,
  ShoppingBag,
  Check,
  X,
  Pencil,
  PlugZap,
  AlertTriangle,
} from "lucide-react";
import { trackEvent } from "@/utils/analytics";
import { getMenu, setMenu, subscribe, FX, getCurrency } from "@/lib/admin-store";
import type { MenuItem } from "@/lib/menu-data";
import {
  getLoyverseMenu,
  getLoyverseSalesTrend,
  type IntegrationResult,
} from "@/lib/loyverse.functions";

const LOYVERSE_URL = "https://r.loyverse.com/dashboard/";

export const Route = createFileRoute("/controls/xd92j7k/_auth/")({
  component: DashboardPage,
});

function DashboardPage() {
  const [reloadKey, setReloadKey] = useState(0);
  const [items, setItems] = useState<MenuItem[]>(() => getMenu());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ name: string; price: string; category: string }>({
    name: "",
    price: "",
    category: "",
  });

  const fetchTrend = useServerFn(getLoyverseSalesTrend);
  const fetchMenu = useServerFn(getLoyverseMenu);

  const trendQuery = useQuery({
    queryKey: ["loyverse", "trend"],
    queryFn: () => fetchTrend(),
    refetchOnWindowFocus: false,
  });
  const menuQuery = useQuery({
    queryKey: ["loyverse", "menu"],
    queryFn: () => fetchMenu(),
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    trackEvent("dashboard_external_click", { tool: "loyverse_reporting" });
    const unsub = subscribe(() => setItems(getMenu()));
    return unsub;
  }, []);

  // When Loyverse returns live items, mirror them into the local store so
  // the rest of the admin (and the public site) stay in sync.
  useEffect(() => {
    if (menuQuery.data?.configured && menuQuery.data.data.length) {
      setMenu(menuQuery.data.data);
      setItems(menuQuery.data.data);
    }
  }, [menuQuery.data]);

  const currency = getCurrency();
  const sym = FX[currency].symbol;
  const rate = FX[currency].rate;

  const trend = useMemo(() => {
    const live = extract(trendQuery.data);
    if (live?.length) {
      return live.map((d) => ({
        day: new Date(d.day).toLocaleDateString("en", { month: "short", day: "numeric" }),
        sales: d.sales,
        orders: d.orders,
      }));
    }
    return [];
  }, [trendQuery.data]);

  const kpi = useMemo(() => {
    const totalSales = trend.reduce((s, d) => s + d.sales, 0);
    const totalOrders = trend.reduce((s, d) => s + d.orders, 0);
    const outOfStock = items.filter((i) => i.stock === false).length;
    return {
      totalSales,
      totalOrders,
      avgTicket: totalOrders ? totalSales / totalOrders : 0,
      outOfStock,
    };
  }, [trend, items]);

  function toggleStock(id: string) {
    // TODO(loyverse): PATCH /v1.0/items/{id} via a dedicated server fn once
    // write scopes are enabled on the API token.
    const next = items.map((i) => (i.id === id ? { ...i, stock: !(i.stock ?? true) } : i));
    setItems(next);
    setMenu(next);
  }

  function startEdit(item: MenuItem) {
    setEditingId(item.id);
    setDraft({ name: item.name.en, price: String(item.price), category: item.category });
  }

  function saveEdit(id: string) {
    const next = items.map((i) =>
      i.id === id
        ? {
            ...i,
            name: { ...i.name, en: draft.name || i.name.en },
            price: Number(draft.price) || i.price,
            category: (draft.category || i.category) as MenuItem["category"],
          }
        : i,
    );
    setItems(next);
    setMenu(next);
    setEditingId(null);
  }

  const integrationLive =
    !!trendQuery.data?.configured || !!menuQuery.data?.configured;

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 space-y-8">
      <IntegrationBanner
        trend={trendQuery.data}
        menu={menuQuery.data}
        loading={trendQuery.isFetching || menuQuery.isFetching}
        onRetry={() => {
          trendQuery.refetch();
          menuQuery.refetch();
        }}
      />

      {/* KPI row */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Sales · 30d"
          value={
            integrationLive
              ? `${sym}${(kpi.totalSales * rate).toLocaleString("en", { maximumFractionDigits: 0 })}`
              : "—"
          }
          accent="text-amber-400"
        />
        <KpiCard
          icon={<ShoppingBag className="h-4 w-4" />}
          label="Orders · 30d"
          value={integrationLive ? kpi.totalOrders.toLocaleString() : "—"}
          accent="text-emerald-400"
        />
        <KpiCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Avg ticket"
          value={integrationLive ? `${sym}${(kpi.avgTicket * rate).toFixed(2)}` : "—"}
          accent="text-sky-400"
        />
        <KpiCard
          icon={<Package className="h-4 w-4" />}
          label="Out of stock"
          value={String(kpi.outOfStock)}
          accent={kpi.outOfStock ? "text-red-400" : "text-zinc-400"}
        />
      </section>

      {/* Sales chart */}
      <section className="rounded-3xl border border-white/10 bg-zinc-900/60 p-5 shadow-2xl">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">Analytics</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">Sales trend · last 30 days</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Sourced from <code className="text-zinc-400">GET /v1.0/receipts</code>.
            </p>
          </div>
        </div>
        <div className="h-64 w-full">
          {trend.length === 0 ? (
            <EmptyChart loading={trendQuery.isFetching} />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  interval={4}
                />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#18181b",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "#fafafa",
                  }}
                  formatter={(v, name) => {
                    const num = Number(v);
                    return [
                      name === "sales" ? `${sym}${(num * rate).toFixed(0)}` : num,
                      name === "sales" ? "Sales" : "Orders",
                    ];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="url(#salesFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Inventory table */}
      <section className="rounded-3xl border border-white/10 bg-zinc-900/60 shadow-2xl">
        <div className="flex items-end justify-between gap-4 border-b border-white/5 px-5 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">Inventory</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">Live items & stock</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Sourced from <code className="text-zinc-400">GET /v1.0/items</code>. Edits are
              local until a write-scoped token is configured.
            </p>
          </div>
          <span className="text-xs text-zinc-500">{items.length} items</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-widest text-zinc-500">
                <th className="px-5 py-3 font-medium">Item</th>
                <th className="px-3 py-3 font-medium">Category</th>
                <th className="px-3 py-3 font-medium">Price</th>
                <th className="px-3 py-3 font-medium">Stock</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isEditing = editingId === item.id;
                const inStock = item.stock ?? true;
                return (
                  <tr key={item.id} className="border-t border-white/5 hover:bg-white/5">
                    <td className="px-5 py-3">
                      {isEditing ? (
                        <input
                          value={draft.name}
                          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                          className="w-full rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 text-sm outline-none focus:border-amber-500/60"
                        />
                      ) : (
                        <div>
                          <div className="font-medium text-zinc-100">{item.name.en}</div>
                          <div className="text-[11px] text-zinc-500">{item.name.es}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {isEditing ? (
                        <select
                          value={draft.category}
                          onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                          className="rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 text-sm capitalize outline-none"
                        >
                          {["coffee", "breakfast", "paninis", "cocktails", "desserts"].map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs capitalize text-zinc-300">
                          {item.category}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.1"
                          value={draft.price}
                          onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
                          className="w-24 rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 text-sm outline-none focus:border-amber-500/60"
                        />
                      ) : (
                        <span className="tabular-nums text-zinc-100">
                          {sym}
                          {(item.price * rate).toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => toggleStock(item.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                          inStock
                            ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                            : "bg-red-500/15 text-red-400 hover:bg-red-500/25"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${inStock ? "bg-emerald-400" : "bg-red-400"}`}
                        />
                        {inStock ? "In stock" : "Out of stock"}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {isEditing ? (
                        <div className="inline-flex gap-1">
                          <button
                            onClick={() => saveEdit(item.id)}
                            className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-medium text-zinc-950 hover:bg-amber-400"
                          >
                            <Check className="h-3 w-3" /> Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-zinc-400 hover:bg-white/5"
                          >
                            <X className="h-3 w-3" /> Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(item)}
                          className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-zinc-300 hover:bg-white/5"
                        >
                          <Pencil className="h-3 w-3" /> Quick edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Loyverse iframe */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">Live source</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">Loyverse Back Office</h2>
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
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-2 text-xs font-medium text-zinc-950 hover:bg-amber-400"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Open
            </a>
          </div>
        </div>
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60 shadow-2xl">
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
          </div>
        </div>
      </section>
    </main>
  );
}

function extract<T>(r: IntegrationResult<T> | undefined): T | null {
  if (!r || !r.configured) return null;
  return r.data;
}

function IntegrationBanner({
  trend,
  menu,
  loading,
  onRetry,
}: {
  trend: IntegrationResult<unknown> | undefined;
  menu: IntegrationResult<unknown> | undefined;
  loading: boolean;
  onRetry: () => void;
}) {
  const anyUnconfigured =
    (trend && !trend.configured) || (menu && !menu.configured);
  const errorMsg =
    (trend && !trend.configured && trend.reason === "error" && trend.message) ||
    (menu && !menu.configured && menu.reason === "error" && menu.message) ||
    null;

  if (!anyUnconfigured) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-300">
        <PlugZap className="h-3.5 w-3.5" />
        Loyverse connected · pulling live data from <code>/v1.0/items</code> and{" "}
        <code>/v1.0/receipts</code>.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-400" />
        <div className="flex-1 text-xs text-amber-100/90">
          <p className="font-semibold text-amber-200">
            Loyverse integration not configured
          </p>
          <p className="mt-1 text-amber-100/70">
            Add <code>LOYVERSE_API_TOKEN</code> as a server secret to stream live items and
            receipts. Optional: <code>LOYVERSE_WEBHOOK_SECRET</code> to receive push updates
            at <code>/api/public/loyverse-webhook</code>.
          </p>
          {errorMsg && (
            <p className="mt-1 text-red-300">Last error: {errorMsg}</p>
          )}
        </div>
        <button
          onClick={onRetry}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 px-3 py-1.5 text-[11px] text-amber-200 hover:bg-amber-400/10 disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Retry
        </button>
      </div>
    </div>
  );
}

function EmptyChart({ loading }: { loading: boolean }) {
  return (
    <div className="grid h-full place-items-center rounded-2xl border border-dashed border-white/10 text-xs text-zinc-500">
      {loading ? "Loading receipts…" : "No sales data yet — connect Loyverse to populate."}
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
      <div className={`flex items-center gap-2 text-xs ${accent}`}>
        {icon}
        <span className="uppercase tracking-widest text-[10px] text-zinc-500">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-100">{value}</p>
    </div>
  );
}
