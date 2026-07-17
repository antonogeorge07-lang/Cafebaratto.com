import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BookingModal } from "@/components/BookingModal";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import type { BookingKind } from "@/lib/admin-store-types";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Reserve a table — Café Baratto" },
      { name: "description", content: "Book a table or enquire about an event at Café Baratto. Confirmation by email." },
      { property: "og:title", content: "Reserve a table — Café Baratto" },
      { property: "og:description", content: "Book a table or enquire about an event at Café Baratto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BookPage,
});

function BookPage() {
  const [kind, setKind] = useState<BookingKind>("table");
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-oak-50 text-coffee-900">
      <SiteHeader />
      <main className="px-4 py-10">
        <div className="mx-auto max-w-xl">
          <header className="mb-6 text-center">
            <p className="text-[11px] uppercase tracking-[0.28em] text-coffee-900/50">Café Baratto</p>
            <h1 className="mt-2 font-serif text-3xl text-coffee-900">Reserve your spot</h1>
            <p className="mt-2 text-sm text-coffee-900/70">
              Pick a date, share your details, and we'll email a confirmation.
            </p>
          </header>
          <div className="mb-4 flex justify-center">
            <div className="flex rounded-full border border-coffee-900/15 bg-oak-50 p-1 text-xs">
              {(["table", "event"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setKind(k)}
                  className={`rounded-full px-4 py-1.5 capitalize transition ${
                    kind === k ? "bg-coffee-900 text-oak-50" : "text-coffee-900 hover:bg-oak-100"
                  }`}
                >
                  {k === "table" ? "Table" : "Event"}
                </button>
              ))}
            </div>
          </div>
          <BookingModal key={kind} open kind={kind} onClose={() => navigate({ to: "/" })} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
