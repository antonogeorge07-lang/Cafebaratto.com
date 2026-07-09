import { createFileRoute } from "@tanstack/react-router";
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
  TrendingUp,
  Package,
  DollarSign,
  ShoppingBag,
  Check,
  X,
  Pencil,
} from "lucide-react";
import { trackEvent } from "@/utils/analytics";
import {
  getMenu,
  setMenu,
  subscribe,
  getOrders,
  FX,
  getCurrency,
} from "@/lib/admin-store";
import type { MenuItem } from "@/lib/menu-data";

export const Route = createFileRoute("/controls/xd92j7k/_auth/")({
  component: DashboardPage,
});

type TrendPoint = { day: string; sales: number; orders: number };

function buildTrend(): TrendPoint[] {
  const orders = getOrders();
  const days: TrendPoint[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayOrders = orders.filter((o) => o.placedAt.slice(0, 10) === key);
    days.push({
      day: d.toLocaleDateString("en", { month: "short", day: "numeric" }),
      sales: dayOrders.reduce((s, o) => s + o.subtotal, 0),
      orders: dayOrders.length,
    });
  }
  return days;
}

function DashboardPage() {
  const [items, setItems] = useState<MenuItem[]>(() => getMenu());
  const [trend, setTrend] = useState<TrendPoint[]>(() => buildTrend());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ name: string; price: string; category: string }>({
    name: "",
    price: "",
    category: "",
  });

  useEffect(() => {
    trackEvent("admin_dashboard_view", {});
    const unsub = subscribe(() => {
      setItems(getMenu());
      setTrend(buildTrend());
    });
    return unsub;
  }, []);

  const currency = getCurrency();
  const sym = FX[currency].symbol;
  const rate = FX[currency].rate;

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

  const hasSales = kpi.totalOrders > 0;

  function toggleStock(id: string) {
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

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 space-y-8">
      {/* KPI row */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Sales · 30d"
          value={
            hasSales
              ? `${sym}${(kpi.totalSales * rate).toLocaleString("en", { maximumFractionDigits: 0 })}`
              : "—"
          }
          accent="text-amber-400"
        />
        <KpiCard
          icon={<ShoppingBag className="h-4 w-4" />}
          label="Orders · 30d"
          value={hasSales ? kpi.totalOrders.toLocaleString() : "—"}
          accent="text-emerald-400"
        />
        <KpiCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Avg ticket"
          value={hasSales ? `${sym}${(kpi.avgTicket * rate).toFixed(2)}` : "—"}
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
              Aggregated from orders placed via the in-house POS.
            </p>
          </div>
        </div>
        <div className="h-64 w-full">
          {!hasSales ? (
            <div className="grid h-full place-items-center text-xs text-zinc-500">
              No sales yet — orders placed through the POS will appear here.
            </div>
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
              Edits publish instantly to the public menu.
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
    </main>
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
    <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4 shadow-lg">
      <div className={`inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest ${accent}`}>
        {icon}
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-zinc-100 tabular-nums">
        {value}
      </div>
    </div>
  );
}
