import { useCallback, useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useAdminSession } from "@/context/AdminSessionContext";
import { trackEvent } from "@/utils/analytics";


const CONTENT_KEY = "baratto.cms.v1";

type ContentMap = Record<string, string>;

function readAll(): ContentMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(CONTENT_KEY) || "{}") as ContentMap;
  } catch {
    return {};
  }
}

function writeAll(map: ContentMap) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONTENT_KEY, JSON.stringify(map));
}

/** Read an overridden value for `id`, falling back to `initial`. */
export function useContent(id: string, initial: string) {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    const stored = readAll()[id];
    // If an admin has saved an override, honour it. Otherwise mirror the
    // latest `initial` so language toggles (which change the source string)
    // propagate to the rendered copy instead of freezing the first value.
    setValue(typeof stored === "string" ? stored : initial);
  }, [id, initial]);
  return [value, setValue] as const;
}

/**
 * Editable text: renders a span when not in edit mode, a focus-ring input
 * when the admin session enables edit mode. Debounced save + analytics.
 */
export function EditableText({
  id,
  initial,
  as = "span",
  className = "",
}: {
  id: string;
  initial: string;
  as?: "span" | "h1" | "h2" | "h3" | "p";
  className?: string;
}) {
  const { isEditMode } = useAdminSession();
  const [value, setValue] = useContent(id, initial);
  const capsule = useSaveCapsule();
  const timer = useRef<number | null>(null);

  const commit = useCallback(
    (next: string) => {
      const map = readAll();
      map[id] = next;
      writeAll(map);
      capsule.setSyncing();
      trackEvent("content_updated", { id, length: next.length });
      window.setTimeout(() => capsule.setSynced(), 350);
    },
    [id, capsule],
  );

  const onChange = (next: string) => {
    setValue(next);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => commit(next), 500);
  };

  if (!isEditMode) {
    const Tag = as as keyof React.JSX.IntrinsicElements;
    return <Tag className={className}>{value}</Tag>;
  }

  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${className} rounded-md bg-transparent px-1 outline-none ring-2 ring-blue-500/40 focus:ring-blue-500/70`}
    />
  );
}

/* ---------- Saving capsule (singleton status bar) ---------- */

type CapsuleState = "idle" | "saving" | "synced";
const listeners = new Set<(s: CapsuleState) => void>();
let capsuleState: CapsuleState = "idle";
function emit(s: CapsuleState) {
  capsuleState = s;
  listeners.forEach((l) => l(s));
}

export function useSaveCapsule() {
  return {
    setSyncing: () => emit("saving"),
    setSynced: () => {
      emit("synced");
      window.setTimeout(() => emit("idle"), 1400);
    },
  };
}

export function SaveCapsule() {
  const [state, setState] = useState<CapsuleState>(capsuleState);
  useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);
  if (state === "idle") return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center md:bottom-8">
      <div className="pointer-events-auto rounded-full border border-white/10 bg-zinc-900/90 px-4 py-2 text-xs font-medium text-oak-50 shadow-2xl backdrop-blur">
        {state === "saving" ? "Saving updates…" : "Changes synced"}
      </div>
    </div>
  );
}

/* ---------- Edit-mode toggle (only shown to signed-in admins) ---------- */

export function EditModeToggle() {
  const { isAuthenticated, isOwner, isEditMode, setEditMode } = useAdminSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Only expose the inline editor to signed-in owners while they're inside
  // the admin console — never on public marketing / menu pages.
  const inAdmin = pathname.startsWith("/controls/");
  if (!isAuthenticated || !isOwner || !inAdmin) return null;
  return (
    <button
      onClick={() => setEditMode(!isEditMode)}
      className={`fixed bottom-24 right-4 z-40 rounded-full px-3.5 py-2 text-xs font-semibold shadow-xl transition md:bottom-8 ${
        isEditMode
          ? "bg-blue-500 text-white hover:bg-blue-400"
          : "bg-zinc-900 text-oak-50 hover:bg-zinc-800"
      }`}
    >
      {isEditMode ? "Editing · Done" : "Edit page"}
    </button>
  );
}

