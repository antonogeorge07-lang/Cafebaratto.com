import { useEffect, useState } from "react";
import { X, UtensilsCrossed, ShoppingBag, CalendarDays, PartyPopper } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useLiveMenu } from "@/lib/useLiveMenu";
import { OrderModal } from "@/components/OrderModal";
import { BookingModal } from "@/components/BookingModal";
import mascot from "@/assets/mascot-cutout.png";


const MESSAGES: Record<string, { title: string; body: string }> = {
  top: { title: "¡Hola! I'm Vito 👋", body: "Order, reserve a table or plan an event tap me." },
  ritual: { title: "My morning ritual ☕", body: "Espresso pulled to order. Try the cortado." },
  menu: { title: "Hungry?", body: "Peek the menu or send an order straight to the bar." },
  story: { title: "Our little corner", body: "Steps from the Central Market. Locals call it home." },
  visit: { title: "Come say hi!", body: "Reserve a table so I can save you a seat." },
};

const SECTION_IDS = ["top", "ritual", "menu", "story", "visit"];

type Sheet = null | "menu-actions" | "order" | "table" | "event";

export function MascotCompanion() {
  const { lang } = useI18n();
  const live = useLiveMenu();
  const navigate = useNavigate();
  const [section, setSection] = useState("top");
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(true);
  const [sheet, setSheet] = useState<Sheet>(null);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.35) {
            setSection(id);
          }
        },
        { threshold: [0.35, 0.6] },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  if (hidden) return null;
  const msg = MESSAGES[section] ?? MESSAGES.top;

  const scrollToMenu = () => {
    setSheet(null);
    const el = document.getElementById("menu");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate({ to: "/menu" });
    }
  };


  return (
    <>
      <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex items-end gap-2 sm:bottom-6 sm:right-6">
        {open && sheet !== "menu-actions" && (
          <div className="pointer-events-auto relative mb-2 hidden max-w-[260px] animate-fade-in rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ring-oak-200 sm:block">
            <button
              aria-label="Dismiss"
              onClick={() => setOpen(false)}
              className="absolute -right-2 -top-2 rounded-full bg-coffee-900 p-1 text-oak-50 shadow hover:bg-coffee-950"
            >
              <X className="h-3 w-3" />
            </button>
            <p className="font-serif text-base text-coffee-900">{msg.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-coffee-900/70">{msg.body}</p>
            <span className="absolute -bottom-2 right-8 h-4 w-4 rotate-45 bg-white ring-1 ring-oak-200 [clip-path:polygon(100%_0,100%_100%,0_100%)]" />
          </div>
        )}

        {sheet === "menu-actions" && (
          <div className="pointer-events-auto mb-2 w-[260px] animate-fade-in rounded-2xl bg-white p-3 shadow-2xl ring-1 ring-oak-200">
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="font-serif text-sm text-coffee-900">How can I help?</p>
              <button
                aria-label="Close"
                onClick={() => setSheet(null)}
                className="rounded-full p-1 text-coffee-900/60 hover:bg-oak-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ActionTile
                icon={<UtensilsCrossed className="h-4 w-4" />}
                label="See menu"
                onClick={scrollToMenu}
              />
              <ActionTile
                icon={<ShoppingBag className="h-4 w-4" />}
                label="Order"
                onClick={() => setSheet("order")}
                primary
              />
              <ActionTile
                icon={<CalendarDays className="h-4 w-4" />}
                label="Book table"
                onClick={() => setSheet("table")}
              />
              <ActionTile
                icon={<PartyPopper className="h-4 w-4" />}
                label="Book event"
                onClick={() => setSheet("event")}
              />
            </div>
            <span className="absolute -bottom-2 right-10 h-4 w-4 rotate-45 bg-white ring-1 ring-oak-200 [clip-path:polygon(100%_0,100%_100%,0_100%)]" />
          </div>
        )}

        <button
          aria-label="Open Vito quick actions"
          onClick={() => {
            setOpen(true);
            setSheet((s) => (s === "menu-actions" ? null : "menu-actions"));
          }}
          className="group pointer-events-auto relative h-24 w-24 transition-transform hover:scale-105 sm:h-32 sm:w-32"
        >
          <span className="absolute inset-2 rounded-full bg-oak-300/40 blur-xl transition group-hover:bg-oak-300/70" />
          <img
            src={mascot}
            alt="Vito the Baratto mascot"
            width={256}
            height={256}
            className="relative h-full w-full object-contain mascot-bob drop-shadow-[0_10px_25px_rgba(0,0,0,0.25)]"
          />
          {!open && (
            <span className="absolute -top-1 right-0 inline-flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-oak-500 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-oak-500" />
            </span>
          )}
        </button>
      </div>

      <OrderModal
        open={sheet === "order"}
        onClose={() => setSheet(null)}
        lang={lang}
        items={live.items}
      />
      <BookingModal
        open={sheet === "table"}
        onClose={() => setSheet(null)}
        kind="table"
      />
      <BookingModal
        open={sheet === "event"}
        onClose={() => setSheet(null)}
        kind="event"
      />
    </>
  );
}

function ActionTile({
  icon,
  label,
  onClick,
  primary,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-xs font-medium transition ${
        primary
          ? "bg-coffee-900 text-oak-50 hover:bg-coffee-950"
          : "bg-oak-100 text-coffee-900 hover:bg-oak-200"
      }`}
    >
      <span
        className={`grid h-8 w-8 place-items-center rounded-full ${
          primary ? "bg-white/10" : "bg-white"
        }`}
      >
        {icon}
      </span>
      {label}
    </button>
  );
}
