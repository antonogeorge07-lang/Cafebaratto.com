import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
  ImagePlus,
  Eye,
  EyeOff,
  Plus,
  Trash2,
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
import { BASE_CATEGORIES, categoryLabel, type MenuItem } from "@/lib/menu-data";

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
  const [draft, setDraft] = useState<{
    name: string;
    price: string;
    category: string;
    subcategory: string;
  }>({
    name: "",
    price: "",
    category: "",
    subcategory: "",
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

  const toggleStock = (id: string) => {
    const next = items.map((i) => (i.id === id ? { ...i, stock: !(i.stock ?? true) } : i));
    setItems(next);
    setMenu(next);
  };

  const toggleHidden = (id: string) => {
    const next = items.map((i) => (i.id === id ? { ...i, hidden: !(i.hidden ?? false) } : i));
    setItems(next);
    setMenu(next);
  };

  const addItem = () => {
    const id = `item-${Date.now()}`;
    const newItem: MenuItem = {
      id,
      category: "coffee",
      name: { en: "New item", es: "Nuevo" },
      desc: { en: "", es: "" },
      price: 0,
      diet: [],
      image: "",
      stock: true,
      hidden: false,
    };
    const next = [newItem, ...items];
    setItems(next);
    setMenu(next);
    setEditingId(id);
    setDraft({ name: newItem.name.en, price: "0", category: "coffee", subcategory: "" });
  };

  const deleteItem = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    if (!confirm(`Delete "${item.name.en}"? This cannot be undone.`)) return;
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    setMenu(next);
    if (editingId === id) setEditingId(null);
  };

  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const triggerUpload = (id: string) => fileInputs.current[id]?.click();

  async function handlePhoto(id: string, file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 4 * 1024 * 1024) {
      alert("Image too large — max 4 MB.");
      return;
    }
    const dataUrl = await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.onerror = () => rej(r.error);
      r.readAsDataURL(file);
    });
    const next = items.map((i) => (i.id === id ? { ...i, image: dataUrl } : i));
    setItems(next);
    setMenu(next);
  }

  const startEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setDraft({
      name: item.name.en,
      price: String(item.price),
      category: item.category,
      subcategory: item.subcategory ?? "",
    });
  };

  const saveEdit = (id: string) => {
    const next = items.map((i) =>
      i.id === id
        ? {
            ...i,
            name: { ...i.name, en: draft.name || i.name.en },
            price: Number(draft.price) || i.price,
            category: draft.category || i.category,
            subcategory: draft.subcategory.trim() || undefined,
          }
        : i,
    );
    setItems(next);
    setMenu(next);
    setEditingId(null);
  };

  const presetsFor = (key: string) =>
    BASE_CATEGORIES.find((c) => c.key === key)?.presets ?? [];

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-5 py-8">
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
            <h2 className="mt-1 text-lg font-semibold tracking-tight">Live items, stock & visibility</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Edits publish instantly to the public menu. Hidden items disappear from the site
              but stay editable here.
            </p>
          </div>
          <span className="text-xs text-zinc-500">{items.length} items</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-widest text-zinc-500">
                <th className="px-5 py-3 font-medium">Photo</th>
                <th className="px-3 py-3 font-medium">Item</th>
                <th className="px-3 py-3 font-medium">Category</th>
                <th className="px-3 py-3 font-medium">Price</th>
                <th className="px-3 py-3 font-medium">Stock</th>
                <th className="px-3 py-3 font-medium">Visible</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isEditing = editingId === item.id;
                const inStock = item.stock ?? true;
                const visible = !(item.hidden ?? false);
                return (
                  <tr key={item.id} className="border-t border-white/5 hover:bg-white/5">
                    <td className="px-5 py-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-white/10 bg-zinc-950">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name.en}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-zinc-600">
                            <ImagePlus className="h-4 w-4" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => triggerUpload(item.id)}
                          title="Upload photo"
                          className="absolute inset-0 grid place-items-center bg-black/50 opacity-0 transition hover:opacity-100"
                        >
                          <ImagePlus className="h-4 w-4 text-white" />
                        </button>
                        <input
                          ref={(el) => {
                            fileInputs.current[item.id] = el;
                          }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            void handlePhoto(item.id, e.target.files?.[0]);
                            e.target.value = "";
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-3">
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
                        <div className="min-w-[200px] space-y-1.5">
                          <select
                            value={
                              BASE_CATEGORIES.find((c) => c.key === draft.category)
                                ? draft.category
                                : "custom"
                            }
                            onChange={(e) =>
                              setDraft((d) => ({
                                ...d,
                                category: e.target.value,
                                subcategory:
                                  e.target.value === d.category ? d.subcategory : "",
                              }))
                            }
                            className="w-full rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 text-sm outline-none"
                          >
                            {BASE_CATEGORIES.map((c) => (
                              <option key={c.key} value={c.key}>
                                {c.labelEn}
                              </option>
                            ))}
                          </select>
                          {(draft.category === "custom" ||
                            !BASE_CATEGORIES.find((c) => c.key === draft.category)) && (
                            <input
                              value={draft.category === "custom" ? "" : draft.category}
                              placeholder="Custom category key (e.g. brunch)"
                              onChange={(e) =>
                                setDraft((d) => ({
                                  ...d,
                                  category: e.target.value || "custom",
                                }))
                              }
                              className="w-full rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 text-xs outline-none focus:border-amber-500/60"
                            />
                          )}
                          <input
                            value={draft.subcategory}
                            onChange={(e) =>
                              setDraft((d) => ({ ...d, subcategory: e.target.value }))
                            }
                            placeholder="Sub-category (free text)"
                            list={`presets-${item.id}`}
                            className="w-full rounded-lg border border-white/10 bg-zinc-950 px-2 py-1.5 text-xs outline-none focus:border-amber-500/60"
                          />
                          <datalist id={`presets-${item.id}`}>
                            {presetsFor(draft.category).map((p) => (
                              <option key={p} value={p} />
                            ))}
                          </datalist>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          <span className="w-fit rounded-full border border-white/10 px-2 py-0.5 text-xs text-zinc-300">
                            {categoryLabel(item.category)}
                          </span>
                          {item.subcategory && (
                            <span className="text-[10px] text-zinc-500">{item.subcategory}</span>
                          )}
                        </div>
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
                    <td className="px-3 py-3">
                      <button
                        onClick={() => toggleHidden(item.id)}
                        title={visible ? "Hide from public menu" : "Show on public menu"}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                          visible
                            ? "bg-sky-500/15 text-sky-300 hover:bg-sky-500/25"
                            : "bg-zinc-500/15 text-zinc-400 hover:bg-zinc-500/25"
                        }`}
                      >
                        {visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        {visible ? "Visible" : "Hidden"}
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
