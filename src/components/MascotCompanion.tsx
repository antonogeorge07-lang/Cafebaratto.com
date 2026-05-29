import { useEffect, useState } from "react";
import { X } from "lucide-react";
import mascot from "@/assets/mascot-cutout.png";

const MESSAGES: Record<string, { title: string; body: string }> = {
  top: { title: "¡Hola! I'm Vito 👋", body: "Welcome to Baratto. Scroll on — I'll show you around." },
  ritual: { title: "My morning ritual ☕", body: "Espresso pulled to order. Try the cortado." },
  menu: { title: "Hungry?", body: "Tostadas, pastries, the works. I recommend everything." },
  story: { title: "Our little corner", body: "Steps from the Central Market. Locals call it home." },
  visit: { title: "Come say hi!", body: "I'll be on the terrace. The sun is perfect today." },
};

const SECTION_IDS = ["top", "ritual", "menu", "story", "visit"];

export function MascotCompanion() {
  const [section, setSection] = useState("top");
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(true);

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

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex items-end gap-2 sm:bottom-6 sm:right-6">
      {open && (
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
      <button
        aria-label="Talk to Vito the mascot"
        onClick={() => setOpen((o) => !o)}
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
  );
}
