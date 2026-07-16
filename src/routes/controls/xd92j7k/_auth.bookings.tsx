import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Users, Phone, StickyNote, Check, X, Loader2 } from "lucide-react";
import {
  getBookings,
  subscribe,
  updateBookingStatus,
  type Booking,
  type BookingStatus,
} from "@/lib/admin-store";

export const Route = createFileRoute("/controls/xd92j7k/_auth/bookings")({
  component: BookingsPage,
});

function todayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>(() => getBookings());
  const [dateFilter, setDateFilter] = useState<string>(todayKey());
  const [kindFilter, setKindFilter] = useState<"all" | "table" | "event">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | BookingStatus>("all");
  const [pending, setPending] = useState<Record<string, BookingStatus | undefined>>({});
  const [toast, setToast] = useState<{ tone: "ok" | "err"; msg: string } | null>(null);

  useEffect(() => {
    const unsub = subscribe(() => setBookings(getBookings()));
    return unsub;
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const transition = async (id: string, next: BookingStatus) => {
    setPending((p) => ({ ...p, [id]: next }));
    try {
      updateBookingStatus(id, next);
      setToast({ tone: "ok", msg: next === "confirmed" ? "Booking confirmed" : "Booking cancelled" });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setToast({ tone: "err", msg: "Update failed. Try again." });
    } finally {
      setTimeout(() => setPending((p) => ({ ...p, [id]: undefined })), 500);
    }
  };

  const filtered = useMemo(() => {
    return bookings
      .filter((b) => (dateFilter ? b.date === dateFilter : true))
      .filter((b) => (kindFilter === "all" ? true : b.kind === kindFilter))
      .filter((b) => (statusFilter === "all" ? true : b.status === statusFilter))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [bookings, dateFilter, kindFilter, statusFilter]);

  const upcoming = useMemo(() => {
    const key = todayKey();
    return bookings
      .filter((b) => b.date >= key)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
      .slice(0, 8);
  }, [bookings]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-5 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">Bookings</p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight">Reservations & events</h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            Live from the public booking form. Updates arrive in real time.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <label className="inline-flex items-center gap-1.5 text-zinc-500">
            <CalendarDays className="h-3.5 w-3.5" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-lg border border-white/10 bg-zinc-950 px-2 py-1 text-zinc-200 outline-none focus:border-amber-500/60"
            />
          </label>
          <button
            type="button"
            onClick={() => setDateFilter("")}
            className="rounded-full border border-white/10 px-2.5 py-1 text-zinc-400 hover:bg-white/5"
          >
            All dates
          </button>
          <div className="ml-2 flex rounded-full border border-white/10 p-0.5">
            {(["all", "table", "event"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKindFilter(k)}
                className={`rounded-full px-2.5 py-1 capitalize ${
                  kindFilter === k
                    ? "bg-amber-500 text-zinc-950"
                    : "text-zinc-400 hover:text-zinc-100"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
          <div className="ml-2 flex rounded-full border border-white/10 p-0.5">
            {(["all", "pending", "confirmed", "cancelled"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-2.5 py-1 capitalize ${
                  statusFilter === s
                    ? "bg-emerald-500 text-zinc-950"
                    : "text-zinc-400 hover:text-zinc-100"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="rounded-3xl border border-white/10 bg-zinc-900/60 shadow-2xl">
        <header className="flex items-center justify-between border-b border-white/5 px-5 py-3">
          <span className="text-xs font-medium uppercase tracking-widest text-zinc-400">
            {dateFilter ? `Day view · ${dateFilter}` : "All reservations"}
          </span>
          <span className="text-[11px] text-zinc-500">{filtered.length} total</span>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-widest text-zinc-500">
                <th className="px-5 py-3 font-medium">Time</th>
                <th className="px-3 py-3 font-medium">Guest</th>
                <th className="px-3 py-3 font-medium">Party</th>
                <th className="px-3 py-3 font-medium">Kind</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Contact</th>
                <th className="px-3 py-3 font-medium">Notes</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-xs text-zinc-500">
                    No reservations for this view.
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.id} className="border-t border-white/5 hover:bg-white/5">
                    <td className="px-5 py-3">
                      <div className="font-mono text-zinc-100">{b.time}</div>
                      {!dateFilter && (
                        <div className="text-[11px] text-zinc-500">{b.date}</div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-zinc-100">{b.name}</div>
                      {b.eventType && (
                        <div className="text-[11px] text-zinc-500">{b.eventType}</div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1 text-zinc-300">
                        <Users className="h-3.5 w-3.5 text-zinc-500" />
                        {b.partySize}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] ${
                          b.kind === "event"
                            ? "border-amber-500/40 text-amber-300"
                            : "border-white/10 text-zinc-300"
                        }`}
                      >
                        {b.kind}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill status={b.status} />
                    </td>
                    <td className="px-3 py-3 text-xs text-zinc-400">
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3 text-zinc-500" />
                        {b.contact}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-zinc-400">
                      {b.notes ? (
                        <span className="inline-flex items-start gap-1">
                          <StickyNote className="mt-0.5 h-3 w-3 shrink-0 text-zinc-500" />
                          <span className="line-clamp-2">{b.notes}</span>
                        </span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {b.status !== "confirmed" && (
                          <button
                            type="button"
                            disabled={!!pending[b.id]}
                            onClick={() => transition(b.id, "confirmed")}
                            className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 px-2.5 py-1 text-[11px] text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50"
                          >
                            {pending[b.id] === "confirmed" ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                            Confirm
                          </button>
                        )}
                        {b.status !== "cancelled" && (
                          <button
                            type="button"
                            disabled={!!pending[b.id]}
                            onClick={() => transition(b.id, "cancelled")}
                            className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 px-2.5 py-1 text-[11px] text-rose-300 hover:bg-rose-500/10 disabled:opacity-50"
                          >
                            {pending[b.id] === "cancelled" ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <X className="h-3 w-3" />
                            )}
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-zinc-900/60 p-5 shadow-2xl">
        <header className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-widest text-zinc-400">
            Upcoming · next 8
          </span>
          <span className="text-[11px] text-zinc-500">
            {bookings.length} lifetime reservation{bookings.length === 1 ? "" : "s"}
          </span>
        </header>
        {upcoming.length === 0 ? (
          <p className="py-6 text-center text-xs text-zinc-500">Nothing on the calendar.</p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {upcoming.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-zinc-950/60 px-3 py-2"
              >
                <div>
                  <div className="text-sm font-medium text-zinc-100">{b.name}</div>
                  <div className="text-[11px] text-zinc-500">
                    {b.date} · {b.time} · party of {b.partySize}
                  </div>
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[11px] ${
                    b.kind === "event"
                      ? "border-amber-500/40 text-amber-300"
                      : "border-white/10 text-zinc-300"
                  }`}
                >
                  {b.kind}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border px-4 py-2 text-xs shadow-2xl ${
            toast.tone === "ok"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
              : "border-rose-500/40 bg-rose-500/10 text-rose-200"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </main>
  );
}

function StatusPill({ status }: { status: BookingStatus }) {
  const styles: Record<BookingStatus, string> = {
    pending: "border-zinc-500/40 text-zinc-300",
    confirmed: "border-emerald-500/40 text-emerald-300",
    cancelled: "border-rose-500/40 text-rose-300",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}
