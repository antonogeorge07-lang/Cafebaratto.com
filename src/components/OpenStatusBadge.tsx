import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

// Mon-Fri 07-22, Sat-Sun 09-22 (Europe/Madrid approximated via local time)
function isOpen(d = new Date()) {
  const day = d.getDay(); // 0 sun
  const h = d.getHours() + d.getMinutes() / 60;
  const openH = day === 0 || day === 6 ? 9 : 7;
  return h >= openH && h < 22;
}

export function OpenStatusBadge({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(() => isOpen());
  useEffect(() => {
    const id = setInterval(() => setOpen(isOpen()), 60_000);
    return () => clearInterval(id);
  }, []);
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
        open ? "bg-sage-100 text-sage-700" : "bg-oak-200 text-coffee-900/70"
      } ${className}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${open ? "bg-sage-500 animate-pulse" : "bg-coffee-900/40"}`}
        aria-hidden
      />
      {open ? t("open_now") : t("closed_now")}
    </span>
  );
}
