import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  Coffee,
  Search,
  ChevronLeft,
  Plug,
} from "lucide-react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { MENU, type MenuItem } from "@/lib/menu-data";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Baratto · Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: Admin,
});

/* ------------------------- Mock data ------------------------- */

// 30 days of simulated sales (EUR)
const SALES = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  const base = 380 + Math.sin(i / 3) * 70 + (i % 7 < 2 ? 90 : 0);
  const noise = Math.round(Math.random() * 60);
  return {
    day: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    sales: Math.max(120, Math.round(base + noise)),
    tickets: Math.round((base + noise) / 6),
  };
});

const TOTAL = SALES.reduce((s, r) => s + r.sales, 0);
const TICKETS = SALES.reduce((s, r) => s + r.tickets, 0);
const AVG = TOTAL / TICKETS;

/* ------------------------- Component ------------------------- */

function Admin() {
  const [tab, setTab] = useState<"overview" | "inventory" | "integrations">("overview");
  const [items, setItems] = useState<MenuItem[]>(() => MENU.map((m) => ({ ...m })));
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      items.filter((i) =>
        (i.name.en + " " + i.name.es + " " + i.category)
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [items, query],
  );

  const toggleStock = (id: string) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, stock: !i.stock } : i)));

  const updatePrice = (id: string, price: number) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, price } : i)));

  return (
    <div className="min-h-screen bg-[#0e1117] text-zinc-100">
      <aside className="fixed inset-x-0 top-0 z-30 border-b border-white/5 bg-[#0e1117]/95 backdrop-blur lg:inset-y-0 lg:right-auto lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-2 px-5 py-4">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-amber-500/20 text-amber-400">
            <Coffee className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Baratto · Back Office</p>
            <p className="truncate text-[11px] text-zinc-500">Loyverse-style POS</p>
          </div>
          <Link
            to="/"
            className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-400 hover:bg-white/5 hover:text-zinc-100 lg:hidden"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Site
          </Link>
        </div>
        <nav className="flex gap-1 px-3 pb-3 lg:flex-col lg:px-3 lg:pb-3">
          <SideLink active={tab === "overview"} onClick={() => setTab("overview")} icon={LayoutDashboard}>
            Overview
          </SideLink>
          <SideLink active={tab === "inventory"} onClick={() => setTab("inventory")} icon={Package}>
            Items
          </SideLink>
          <SideLink active={tab === "integrations"} onClick={() => setTab("integrations")} icon={Plug}>
            Integrations
          </SideLink>
          <Link
            to="/"
            className="mt-auto hidden items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-400 hover:bg-white/5 hover:text-zinc-100 lg:flex"
          >
            <ChevronLeft className="h-4 w-4" /> Back to site
          </Link>
        </nav>
      </aside>

      <main className="pt-28 lg:ml-64 lg:pt-0">
        <div className="mx-auto max-w-6xl space-y-6 p-5 lg:p-8">
          {tab === "overview" && (
            <>
              <header>
                <h1 className="text-2xl font-semibold">Overview</h1>
                <p className="text-sm text-zinc-400">Sales performance over the last 30 days.</p>
              </header>

              <div className="grid gap-4 sm:grid-cols-3">
                <Kpi label="Gross sales" value={`€${TOTAL.toLocaleString()}`} delta="+12.4%" />
                <Kpi label="Tickets" value={TICKETS.toString()} delta="+8.1%" />
                <Kpi label="Avg ticket" value={`€${AVG.toFixed(2)}`} delta="+3.9%" />
              </div>

              <section className="rounded-2xl border border-white/5 bg-[#151a23] p-5">
                <div className="mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-400" />
                  <h2 className="text-sm font-medium">Sales trend (30 days)</h2>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={SALES} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                      <defs>
                        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                      <XAxis dataKey="day" stroke="#52525b" tick={{ fontSize: 11 }} interval={4} />
                      <YAxis stroke="#52525b" tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          background: "#0e1117",
                          border: "1px solid #27272a",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        labelStyle={{ color: "#a1a1aa" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="sales"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        fill="url(#g)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </>
          )}

          {tab === "inventory" && (
            <>
              <header className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-semibold">Items</h1>
                  <p className="text-sm text-zinc-400">Edit price and toggle stock in real time.</p>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search items…"
                    className="w-full rounded-lg border border-white/10 bg-[#151a23] py-2 pl-9 pr-3 text-sm outline-none focus:border-amber-500/60"
                  />
                </div>
              </header>

              <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#151a23]">
                <table className="w-full text-sm">
                  <thead className="bg-white/5 text-left text-xs uppercase tracking-wider text-zinc-400">
                    <tr>
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filtered.map((i) => (
                      <tr key={i.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 font-medium">{i.name.en}</td>
                        <td className="px-4 py-3 capitalize text-zinc-400">{i.category}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.1"
                            min={0}
                            value={i.price}
                            onChange={(e) => updatePrice(i.id, Number(e.target.value) || 0)}
                            className="w-20 rounded-md border border-white/10 bg-[#0e1117] px-2 py-1 text-sm outline-none focus:border-amber-500/60"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleStock(i.id)}
                            aria-pressed={i.stock}
                            className={`inline-flex h-6 w-11 items-center rounded-full transition ${
                              i.stock ? "bg-emerald-500" : "bg-zinc-600"
                            }`}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                                i.stock ? "translate-x-5" : "translate-x-0.5"
                              }`}
                            />
                          </button>
                          <span className="ml-3 text-xs text-zinc-400">
                            {i.stock ? "In stock" : "Out of stock"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-zinc-500">
                          No items match "{query}".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === "integrations" && (
            <>
              <header>
                <h1 className="text-2xl font-semibold">Integrations</h1>
                <p className="text-sm text-zinc-400">
                  Wire this admin to your POS. Architectural hooks are ready for Loyverse REST API.
                </p>
              </header>

              <section className="rounded-2xl border border-white/5 bg-[#151a23] p-6">
                <h2 className="text-sm font-medium">Loyverse REST API</h2>
                <p className="mt-1 text-xs text-zinc-400">
                  Replace mock state with live calls. Suggested endpoints below.
                </p>
                <pre className="mt-4 overflow-x-auto rounded-lg bg-[#0b0e13] p-4 text-xs leading-relaxed text-zinc-300">
{`// .env
LOYVERSE_API_TOKEN=...

// Items     → GET https://api.loyverse.com/v1.0/items
// Receipts  → GET https://api.loyverse.com/v1.0/receipts?created_at_min=...
// Webhooks  → POST /api/public/loyverse-webhook  (verify signature server-side)

// src/lib/loyverse.functions.ts  (createServerFn)
//   .handler reads process.env.LOYVERSE_API_TOKEN
//   fetch('https://api.loyverse.com/v1.0/items', {
//     headers: { Authorization: 'Bearer ' + token }
//   })`}
                </pre>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs text-amber-300">
                    Mock data
                  </span>
                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-400">
                    POS sync · ready to wire
                  </span>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function SideLink({
  active,
  icon: Icon,
  onClick,
  children,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition ${
        active ? "bg-amber-500/15 text-amber-300" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
      }`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function Kpi({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#151a23] p-5">
      <p className="text-xs uppercase tracking-wider text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-emerald-400">{delta} vs prev period</p>
    </div>
  );
}
