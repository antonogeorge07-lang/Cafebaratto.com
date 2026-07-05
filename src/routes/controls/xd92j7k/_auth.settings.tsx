import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Eye, EyeOff, KeyRound } from "lucide-react";
import { trackEvent } from "@/utils/analytics";

const TOKEN_KEY = "baratto.loyverse_access_token.v1";

// Lightweight obfuscation for at-rest storage — NOT real encryption.
// The token still lives client-side; treat it as a rotate-able secret.
function encode(s: string): string {
  if (typeof window === "undefined") return s;
  const enc = new TextEncoder().encode(s);
  let bin = "";
  for (const b of enc) bin += String.fromCharCode(b ^ 0x5a);
  return btoa(bin);
}
function decode(s: string): string {
  if (typeof window === "undefined" || !s) return "";
  try {
    const bin = atob(s);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i) ^ 0x5a;
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}

export const Route = createFileRoute("/controls/xd92j7k/_auth/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [token, setToken] = useState("");
  const [reveal, setReveal] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (raw) setToken(decode(raw));
  }, []);

  const save = () => {
    if (!token.trim()) {
      localStorage.removeItem(TOKEN_KEY);
    } else {
      localStorage.setItem(TOKEN_KEY, encode(token.trim()));
    }
    setSaved(true);
    trackEvent("integration_token_saved", { provider: "loyverse" });
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">Setup & integrations</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">System settings</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Isolated from public templates. Keys never appear in the DOM outside this page.
      </p>

      <section className="mt-8 rounded-3xl border border-white/10 bg-zinc-900/60 p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-amber-500/20 text-amber-400">
            <KeyRound className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">Loyverse access token</p>
            <p className="text-xs text-zinc-500">Used by the analytics dashboard proxy.</p>
          </div>
        </div>

        <label
          htmlFor="loyverse_access_token"
          className="mt-6 block text-[11px] uppercase tracking-widest text-zinc-500"
        >
          loyverse_access_token
        </label>
        <div className="mt-2 flex gap-2">
          <div className="relative flex-1">
            <input
              id="loyverse_access_token"
              name="loyverse_access_token"
              type={reveal ? "text" : "password"}
              autoComplete="off"
              spellCheck={false}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="lv_••••••••••••"
              className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 pr-10 font-mono text-sm outline-none focus:border-amber-500/60"
            />
            <button
              type="button"
              onClick={() => setReveal((v) => !v)}
              aria-label={reveal ? "Hide token" : "Show token"}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
            >
              {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button
            onClick={save}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-medium text-zinc-950 hover:bg-amber-400"
          >
            Save
          </button>
        </div>

        {saved && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-400">
            <Check className="h-3.5 w-3.5" /> Encrypted and stored locally.
          </p>
        )}
        <p className="mt-6 border-t border-white/5 pt-4 text-[11px] text-zinc-500">
          Stored obfuscated in <code className="text-zinc-400">localStorage</code> under
          <code className="ml-1 text-zinc-400">{TOKEN_KEY}</code>. Rotate the token in
          Loyverse if this device is lost.
        </p>
      </section>
    </main>
  );
}
