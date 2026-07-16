import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X, Check } from "lucide-react";
import { addBooking, getBookingsForDate, type BookingKind } from "@/lib/admin-store";

const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00",
  "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00",
];

const EVENT_TYPES = [
  "Birthday", "Anniversary", "Business meeting", "Private tasting", "Live music night", "Other",
];

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildCalendar(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const startWeekday = (first.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function BookingModal({
  open,
  onClose,
  kind,
}: {
  open: boolean;
  onClose: () => void;
  kind: BookingKind;
}) {
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<Date | null>(today);
  const [time, setTime] = useState<string>("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [party, setParty] = useState(2);
  const [notes, setNotes] = useState("");
  const [eventType, setEventType] = useState(EVENT_TYPES[0]);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const cells = useMemo(() => buildCalendar(month), [month]);
  const selectedKey = selected ? fmtDate(selected) : "";
  const dayBookings = selectedKey ? getBookingsForDate(selectedKey) : [];

  if (!open) return null;

  const canSubmit = !!selected && !!time && name.trim().length > 1 && contact.trim().length > 3 && !submitting;

  const submit = async () => {
    if (!canSubmit || !selected) return;
    setSubmitting(true);
    try {
      await addBooking({
        kind,
        name: name.trim(),
        contact: contact.trim(),
        date: fmtDate(selected),
        time,
        partySize: party,
        notes: notes.trim() || undefined,
        eventType: kind === "event" ? eventType : undefined,
        email: email.trim() || undefined,
      });
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setDone(false);
    setTime("");
    setName("");
    setContact("");
    setEmail("");
    setParty(2);
    setNotes("");
  };

  const title = kind === "table" ? "Reserve a table" : "Book an event";
  const subtitle =
    kind === "table"
      ? "Pick a date & time — we'll have your table ready."
      : "Private tastings, birthdays, live nights. Tell us a little more.";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-coffee-900/60 px-4 py-6 backdrop-blur-sm sm:items-center">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-3xl bg-oak-50 shadow-2xl">
        <div className="flex items-start justify-between border-b border-oak-200 p-5">
          <div>
            <h3 className="font-serif text-2xl text-coffee-900">{title}</h3>
            <p className="mt-1 text-xs text-coffee-900/60">{subtitle}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1 hover:bg-oak-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {done ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-sage-100 text-sage-700">
              <Check className="h-6 w-6" />
            </div>
            <p className="font-serif text-xl text-coffee-900">Reservation confirmed</p>
            <p className="mt-1 text-sm text-coffee-900/70">
              {selected?.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })} · {time}
              {" "}for {party}
            </p>
            <p className="mt-1 text-xs text-coffee-900/50">
              We'll be in touch at {contact}. See you soon, {name.split(" ")[0]}!
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={reset}
                className="rounded-full border border-coffee-900/20 px-4 py-2 text-xs text-coffee-900 hover:bg-oak-200"
              >
                Book another
              </button>
              <button
                onClick={onClose}
                className="rounded-full bg-coffee-900 px-4 py-2 text-xs text-oak-50 hover:bg-coffee-950"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="grid flex-1 gap-5 overflow-y-auto p-5 md:grid-cols-2">
            {/* Calendar */}
            <div className="rounded-2xl border border-oak-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <button
                  onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                  className="rounded-full p-1.5 hover:bg-oak-100"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <p className="font-serif text-sm text-coffee-900">
                  {month.toLocaleDateString("en", { month: "long", year: "numeric" })}
                </p>
                <button
                  onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                  className="rounded-full p-1.5 hover:bg-oak-100"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="mb-1 grid grid-cols-7 gap-1 text-[10px] uppercase tracking-widest text-coffee-900/40">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <div key={i} className="text-center">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {cells.map((d, i) => {
                  if (!d) return <div key={i} />;
                  const key = fmtDate(d);
                  const isPast = d < today;
                  const isSel = selectedKey === key;
                  const count = getBookingsForDate(key).length;
                  return (
                    <button
                      key={i}
                      disabled={isPast}
                      onClick={() => setSelected(d)}
                      className={`relative aspect-square rounded-lg text-xs transition ${
                        isSel
                          ? "bg-coffee-900 text-oak-50"
                          : isPast
                            ? "text-coffee-900/25"
                            : "text-coffee-900 hover:bg-oak-100"
                      }`}
                    >
                      {d.getDate()}
                      {count > 0 && !isSel && (
                        <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-oak-500" />
                      )}
                    </button>
                  );
                })}
              </div>
              {selected && (
                <div className="mt-4">
                  <p className="mb-2 text-[10px] uppercase tracking-widest text-coffee-900/50">
                    Time · {selected.toLocaleDateString("en", { month: "short", day: "numeric" })}
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {TIME_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setTime(slot)}
                        className={`rounded-lg py-1.5 text-[11px] transition ${
                          time === slot
                            ? "bg-coffee-900 text-oak-50"
                            : "bg-oak-100 text-coffee-900 hover:bg-oak-200"
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                  {dayBookings.length > 0 && (
                    <p className="mt-3 text-[11px] text-coffee-900/50">
                      {dayBookings.length} other reservation{dayBookings.length > 1 ? "s" : ""} that day.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Form */}
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-coffee-900/50">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className="mt-1 w-full rounded-xl border border-oak-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-coffee-900/40"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-coffee-900/50">
                  Phone
                </label>
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="+34 ..."
                  className="mt-1 w-full rounded-xl border border-oak-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-coffee-900/40"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-coffee-900/50">
                  Email (for confirmation)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1 w-full rounded-xl border border-oak-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-coffee-900/40"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-coffee-900/50">
                  Party size
                </label>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                    <button
                      key={n}
                      onClick={() => setParty(n)}
                      className={`h-9 min-w-9 rounded-full px-3 text-xs transition ${
                        party === n
                          ? "bg-coffee-900 text-oak-50"
                          : "border border-oak-200 text-coffee-900 hover:bg-oak-100"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              {kind === "event" && (
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-coffee-900/50">
                    Event type
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-oak-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-coffee-900/40"
                  >
                    {EVENT_TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-coffee-900/50">
                  Notes {kind === "event" ? "" : "(optional)"}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder={
                    kind === "event"
                      ? "Tell us about your event — dietary needs, timing, décor..."
                      : "Highchair, dog-friendly seat, quiet corner..."
                  }
                  className="mt-1 w-full resize-none rounded-xl border border-oak-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-coffee-900/40"
                />
              </div>
              <button
                onClick={submit}
                disabled={!canSubmit}
                className="mt-auto w-full rounded-full bg-coffee-900 py-3 text-sm font-medium text-oak-50 transition hover:bg-coffee-950 disabled:opacity-40"
              >
                Confirm reservation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
