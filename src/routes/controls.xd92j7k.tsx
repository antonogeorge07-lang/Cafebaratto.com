import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AreaChart, Area, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  LayoutDashboard, Package, ShoppingBag, Sparkles, BarChart3, Settings,
  Trash2, Plus, Bell, X, Send, MessageCircle, ChevronDown,
} from "lucide-react";

import { MENU, type MenuItem, type Category } from "@/lib/menu-data";
import {
  getMenu, setMenu, getOrders, setOrderStatus, subscribe,
  getCurrency, setCurrency, getMasterHash, setMasterHash,
  FX, type Currency, type Order,
} from "@/lib/admin-store";
import { sha256 } from "@/lib/crypto";
import { adminChat } from "@/lib/admin-chat.functions";

export const Route = createFileRoute("/controls/xd92j7k")({
  head: () => ({
    meta: [
      { title: "Baratto · Controls" },
      { name: "robots", content: "noindex,nofollow" },
      { name: "googlebot", content: "noindex,nofollow,noarchive" },
    ],
    links: [{ rel: "canonical", href: "https://www.cafebaratto.com/controls/xd92j7k" }],
  }),
  component: ControlsPage,
});

function ControlsPage() {
  return (<><Controls /><DeleteGuardMount /></>);
}

const SECTIONS = [
  { id: "menu", label: "Menu", icon: Package, color: "from-amber-400 to-orange-500" },
  { id: "orders", label: "Orders", icon: ShoppingBag, color: "from-emerald-400 to-teal-500" },
  { id: "analytics", label: "Analytics", icon: BarChart3, color: "from-sky-400 to-indigo-500" },
  { id: "assistant", label: "Assistant", icon: Sparkles, color: "from-fuchsia-400 to-pink-500" },
  { id: "settings", label: "Settings", icon: Settings, color: "from-zinc-400 to-zinc-600" },
] as const;

function Controls() {
  const [, force] = useState(0);
  useEffect(() => subscribe(() => force((n) => n + 1)), []);

  // Track unread orders for the launchpad badge.
  const [seenOrderIds, setSeenOrderIds] = useState<Set<string>>(new Set());
  const orders = getOrders();
  const unread = orders.filter((o) => !seenOrderIds.has(o.id) && o.status === "active").length;

  // Notification API + first-render acknowledgement.
  const firstRender = useRef(true);
  const prevCount = useRef(orders.length);
  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      void Notification.requestPermission();
    }
    if (firstRender.current) {
      firstRender.current = false;
      setSeenOrderIds(new Set(orders.map((o) => o.id)));
      prevCount.current = orders.length;
      return;
    }
    if (orders.length > prevCount.current) {
      const fresh = orders[0];
      if (fresh && typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("New order received", {
          body: `${fresh.lineItems.length} items · €${fresh.subtotal.toFixed(2)}`,
        });
      }
    }
    prevCount.current = orders.length;
  }, [orders.length, orders]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (id === "orders") setSeenOrderIds(new Set(orders.map((o) => o.id)));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Launchpad */}
      <div className="sticky top-0 z-30 border-b border-white/5 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2 pr-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/20 text-amber-400">
              <LayoutDashboard className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight">Baratto Controls</span>
          </div>
          <div className="ml-auto grid grid-cols-5 gap-2 sm:gap-3">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const showBadge = s.id === "orders" && unread > 0;
              return (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className="group relative flex flex-col items-center gap-1"
                  aria-label={s.label}
                >
                  <span
                    className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${s.color} text-white shadow-lg shadow-black/30 transition group-hover:scale-105 group-active:scale-95`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-[10px] text-zinc-400">{s.label}</span>
                  {showBadge && (
                    <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl space-y-12 px-4 py-8 pb-32">
        <MenuSection />
        <OrdersSection />
        <AnalyticsSection />
        <AssistantSection />
        <SettingsSection />
      </main>

      <AnalyticsFab />
    </div>
  );
}

/* ============================== MENU ============================== */

const CATEGORIES: Category[] = ["coffee", "breakfast", "paninis", "cocktails", "desserts"];

function MenuSection() {
  const items = getMenu();
  const currency = getCurrency();
  const fx = FX[currency];

  const update = (id: string, patch: Partial<MenuItem>) => {
    setMenu(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const add = () => {
    const id = `new-${Date.now()}`;
    setMenu([
      ...items,
      {
        id,
        category: "coffee",
        name: { es: "Nuevo", en: "New item" },
        desc: { es: "", en: "" },
        price: 0,
        diet: [],
        image: items[0]?.image ?? "",
        stock: true,
      },
    ]);
  };

  const remove = async (id: string) => {
    const ok = await confirmDelete();
    if (ok) setMenu(items.filter((i) => i.id !== id));
  };

  return (
    <section id="menu" className="scroll-mt-24">
      <SectionHeader title="Menu & Catalog" subtitle="Inline-edit any cell. Changes go live on the site instantly." />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">Currency</span>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className="rounded-md border border-white/10 bg-zinc-900 px-2 py-1 text-sm"
          >
            {(Object.keys(FX) as Currency[]).map((c) => (
              <option key={c} value={c}>{c} ({FX[c].symbol})</option>
            ))}
          </select>
        </div>
        <button
          onClick={add}
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-zinc-950 hover:bg-amber-400"
        >
          <Plus className="h-3.5 w-3.5" /> Add item
        </button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-white/5 bg-zinc-900/60">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-wider text-zinc-400">
            <tr>
              <th className="px-3 py-2.5">Name (EN)</th>
              <th className="px-3 py-2.5">Name (ES)</th>
              <th className="px-3 py-2.5">Category</th>
              <th className="px-3 py-2.5">Price ({fx.symbol})</th>
              <th className="px-3 py-2.5">Stock</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.map((i) => (
              <tr key={i.id} className="hover:bg-white/[0.03]">
                <td className="px-3 py-2">
                  <input
                    value={i.name.en}
                    onChange={(e) => update(i.id, { name: { ...i.name, en: e.target.value } })}
                    className="w-40 rounded bg-transparent px-1 py-0.5 outline-none focus:bg-zinc-800"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    value={i.name.es}
                    onChange={(e) => update(i.id, { name: { ...i.name, es: e.target.value } })}
                    className="w-40 rounded bg-transparent px-1 py-0.5 outline-none focus:bg-zinc-800"
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={i.category}
                    onChange={(e) => update(i.id, { category: e.target.value as Category })}
                    className="rounded bg-zinc-800 px-2 py-1 text-xs"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.1"
                    value={+(i.price * fx.rate).toFixed(2)}
                    onChange={(e) => update(i.id, { price: +(Number(e.target.value) / fx.rate).toFixed(2) })}
                    className="w-20 rounded bg-zinc-800 px-2 py-1 text-xs"
                  />
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => update(i.id, { stock: !i.stock })}
                    className={`inline-flex h-5 w-9 items-center rounded-full transition ${i.stock ? "bg-emerald-500" : "bg-zinc-600"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${i.stock ? "translate-x-4" : "translate-x-0.5"}`} />
                  </button>
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => void remove(i.id)}
                    className="rounded p-1 text-zinc-400 hover:bg-red-500/20 hover:text-red-400"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-zinc-500">No items.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ============================== ORDERS ============================== */

function OrdersSection() {
  const [tab, setTab] = useState<"active" | "history" | "fulfilled">("active");
  const orders = getOrders();
  const filtered = orders.filter((o) => o.status === tab);

  return (
    <section id="orders" className="scroll-mt-24">
      <SectionHeader title="Live Orders" subtitle="Push-notified in real time as guests check out." />
      <div className="mb-4 inline-flex rounded-lg border border-white/10 bg-zinc-900 p-1 text-xs">
        {(["active", "history", "fulfilled"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`rounded-md px-3 py-1.5 capitalize transition ${tab === s ? "bg-amber-500 text-zinc-950" : "text-zinc-400 hover:text-zinc-100"}`}
          >
            {s} {s === "active" && orders.filter((o) => o.status === "active").length > 0 && (
              <span className="ml-1 rounded-full bg-red-500 px-1.5 text-[10px] text-white">
                {orders.filter((o) => o.status === "active").length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-zinc-500">
            No {tab} orders.
          </div>
        )}
        {filtered.map((o) => <OrderRow key={o.id} order={o} />)}
      </div>
    </section>
  );
}

function OrderRow({ order }: { order: Order }) {
  const [open, setOpen] = useState(order.status === "active");
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900/60">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02]"
      >
        <span className={`h-2 w-2 rounded-full ${order.status === "active" ? "animate-pulse bg-emerald-400" : "bg-zinc-600"}`} />
        <span className="font-mono text-xs text-zinc-400">{order.id}</span>
        <span className="text-sm">{order.lineItems.length} items</span>
        <span className="ml-auto text-sm font-semibold">€{order.subtotal.toFixed(2)}</span>
        <span className="text-xs text-zinc-500">{new Date(order.placedAt).toLocaleTimeString()}</span>
        <ChevronDown className={`h-4 w-4 text-zinc-500 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-white/5 px-4 py-3">
          <ul className="mb-3 space-y-1 text-sm">
            {order.lineItems.map((l) => (
              <li key={l.id} className="flex justify-between text-zinc-300">
                <span>{l.qty}× {l.name}</span>
                <span className="text-zinc-400">€{l.lineTotal.toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            {order.status !== "fulfilled" && (
              <button
                onClick={() => setOrderStatus(order.id, "fulfilled")}
                className="rounded-md bg-emerald-500/20 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/30"
              >
                Mark fulfilled
              </button>
            )}
            {order.status !== "history" && (
              <button
                onClick={() => setOrderStatus(order.id, "history")}
                className="rounded-md bg-zinc-700 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-600"
              >
                Archive
              </button>
            )}
            {order.status !== "active" && (
              <button
                onClick={() => setOrderStatus(order.id, "active")}
                className="rounded-md bg-amber-500/20 px-3 py-1.5 text-xs text-amber-300 hover:bg-amber-500/30"
              >
                Reopen
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================== ANALYTICS ============================== */

const DAY_LABELS = Array.from({ length: 14 }, (_, i) => `D${i + 1}`);
const SALES = DAY_LABELS.map((day, i) => {
  const base = 380 + Math.sin(i / 2) * 70 + (i % 7 < 2 ? 90 : 0);
  return { day, sales: Math.round(base + ((i * 53) % 60)) };
});

function AnalyticsSection() {
  const orders = getOrders();
  const todayRevenue = orders
    .filter((o) => new Date(o.placedAt).toDateString() === new Date().toDateString())
    .reduce((s, o) => s + o.subtotal, 0);
  const totalRevenue = orders.reduce((s, o) => s + o.subtotal, 0);

  return (
    <section id="analytics" className="scroll-mt-24">
      <SectionHeader title="Analytics" subtitle="Snapshot of revenue and order volume." />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Kpi label="Today" value={`€${todayRevenue.toFixed(2)}`} />
        <Kpi label="All orders" value={orders.length.toString()} />
        <Kpi label="Lifetime revenue" value={`€${totalRevenue.toFixed(2)}`} />
      </div>
      <div className="h-64 rounded-2xl border border-white/5 bg-zinc-900/60 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={SALES} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
            <XAxis dataKey="day" stroke="#52525b" tick={{ fontSize: 11 }} />
            <YAxis stroke="#52525b" tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "#0a0a0a", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="sales" stroke="#f59e0b" strokeWidth={2} fill="url(#g2)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-zinc-900/60 p-4">
      <p className="text-xs uppercase tracking-wider text-zinc-400">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function AnalyticsFab() {
  const [open, setOpen] = useState(false);
  const orders = getOrders();
  const today = orders.filter((o) => new Date(o.placedAt).toDateString() === new Date().toDateString());
  const todayRevenue = today.reduce((s, o) => s + o.subtotal, 0);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 grid h-12 w-12 place-items-center rounded-full bg-amber-500 text-zinc-950 shadow-xl shadow-amber-500/30 transition hover:scale-105"
        aria-label="Quick analytics"
      >
        <BarChart3 className="h-5 w-5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl border-t border-white/10 bg-zinc-900 p-5 pb-8">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Quick KPIs</h3>
              <button onClick={() => setOpen(false)} className="rounded p-1 hover:bg-white/5"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Kpi label="Today revenue" value={`€${todayRevenue.toFixed(2)}`} />
              <Kpi label="Today orders" value={today.length.toString()} />
              <Kpi label="Active" value={orders.filter((o) => o.status === "active").length.toString()} />
              <Kpi label="Fulfilled" value={orders.filter((o) => o.status === "fulfilled").length.toString()} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ============================== ASSISTANT ============================== */

type ChatMsg = { role: "user" | "assistant"; content: string };

function AssistantSection() {
  const chatFn = useServerFn(adminChat);
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { role: "assistant", content: "Hi! Ask me about your menu, orders or revenue." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const buildContext = () => {
    const items = getMenu();
    const orders = getOrders().slice(0, 20);
    return [
      `MENU (${items.length} items):`,
      ...items.map((i) => `- ${i.name.en} [${i.category}] €${i.price.toFixed(2)} ${i.stock ? "in-stock" : "OUT"}`),
      ``,
      `RECENT ORDERS (${orders.length}):`,
      ...orders.map((o) => `- ${o.id} ${o.status} €${o.subtotal.toFixed(2)} (${o.lineItems.map((l) => `${l.qty}×${l.name}`).join(", ")})`),
    ].join("\n");
  };

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const next: ChatMsg[] = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setBusy(true);
    try {
      const { reply } = await chatFn({ data: { messages: next, context: buildContext() } });
      setMsgs([...next, { role: "assistant", content: reply || "(no reply)" }]);
    } catch (e) {
      setMsgs([...next, { role: "assistant", content: e instanceof Error ? e.message : "Error" }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="assistant" className="scroll-mt-24">
      <SectionHeader title="Assistant" subtitle="Context-aware AI tuned to your live menu & orders." />
      <div className="flex h-[420px] flex-col overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/60">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${m.role === "user" ? "bg-amber-500 text-zinc-950" : "bg-zinc-800 text-zinc-100"}`}>
                {m.content}
              </div>
            </div>
          ))}
          {busy && <div className="flex items-center gap-2 text-xs text-zinc-500"><MessageCircle className="h-3 w-3 animate-pulse" /> thinking…</div>}
        </div>
        <div className="flex gap-2 border-t border-white/5 p-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void send()}
            placeholder="Ask about menu, orders, revenue…"
            className="flex-1 rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-amber-500/60"
          />
          <button
            onClick={() => void send()}
            disabled={busy || !input.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-medium text-zinc-950 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" /> Send
          </button>
        </div>
      </div>
    </section>
  );
}

/* ============================== SETTINGS ============================== */

function SettingsSection() {
  const [pass, setPass] = useState("");
  const [saved, setSaved] = useState(false);
  const hasPass = !!getMasterHash();

  const save = async () => {
    if (!pass) return;
    setMasterHash(await sha256(pass));
    setPass("");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const resetAll = async () => {
    const ok = await confirmDelete();
    if (!ok) return;
    localStorage.removeItem("baratto.menu.v1");
    localStorage.removeItem("baratto.orders.v1");
    location.reload();
  };

  return (
    <section id="settings" className="scroll-mt-24">
      <SectionHeader title="Settings" subtitle="Master password gates destructive actions." />
      <div className="space-y-4 rounded-2xl border border-white/5 bg-zinc-900/60 p-5">
        <div>
          <label className="block text-xs uppercase tracking-wider text-zinc-400">
            {hasPass ? "Change master password" : "Set master password"}
          </label>
          <div className="mt-2 flex gap-2">
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
              className="flex-1 rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
            />
            <button onClick={() => void save()} className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-medium text-zinc-950">
              Save
            </button>
          </div>
          {saved && <p className="mt-2 text-xs text-emerald-400">Saved.</p>}
        </div>
        <div className="border-t border-white/5 pt-4">
          <button
            onClick={() => void resetAll()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-2 text-xs text-red-300 hover:bg-red-500/30"
          >
            <Trash2 className="h-3.5 w-3.5" /> Reset all data
          </button>
        </div>
        <p className="text-xs text-zinc-500">
          You're on the obfuscated controls path. The public site has no link here.
          <Bell className="ml-2 inline h-3 w-3" /> Browser notifications:{" "}
          {typeof Notification !== "undefined" ? Notification.permission : "n/a"}
        </p>
      </div>
    </section>
  );
}

/* ============================== Shared ============================== */

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="mb-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-xs text-zinc-400">{subtitle}</p>
    </header>
  );
}

/* ----- Delete confirmation modal (with master-password gate) ----- */

let _resolve: ((v: boolean) => void) | null = null;
let _setOpen: ((v: boolean) => void) | null = null;

function confirmDelete(): Promise<boolean> {
  if (!_setOpen) {
    // No mounted guard — fall back to native.
    return Promise.resolve(window.confirm("Delete? This cannot be undone."));
  }
  return new Promise((resolve) => {
    _resolve = resolve;
    _setOpen?.(true);
  });
}

// Mount this once on the controls page so confirmDelete works.
function DeleteGuardMount() {
  const [open, setOpen] = useState(false);
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  useEffect(() => {
    _setOpen = setOpen;
    return () => { _setOpen = null; };
  }, []);
  const close = (ok: boolean) => {
    setOpen(false);
    setPass("");
    setErr("");
    _resolve?.(ok);
    _resolve = null;
  };
  const submit = async () => {
    const stored = getMasterHash();
    if (!stored) {
      // No password set yet → first-time set and proceed.
      if (!pass) { setErr("Set a master password to proceed."); return; }
      setMasterHash(await sha256(pass));
      close(true);
      return;
    }
    const incoming = await sha256(pass);
    if (incoming === stored) close(true);
    else setErr("Wrong password.");
  };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4" onClick={() => close(false)}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900 p-5">
        <h3 className="text-sm font-semibold">Confirm destructive action</h3>
        <p className="mt-1 text-xs text-zinc-400">Enter master password to proceed.</p>
        <input
          type="password"
          autoFocus
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void submit()}
          className="mt-3 w-full rounded-lg border border-white/10 bg-zinc-950 px-3 py-2 text-sm"
        />
        {err && <p className="mt-2 text-xs text-red-400">{err}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => close(false)} className="rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/5">Cancel</button>
          <button onClick={() => void submit()} className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-400">Confirm</button>
        </div>
      </div>
    </div>
  );
}

