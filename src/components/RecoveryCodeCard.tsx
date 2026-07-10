import { useState } from "react";
import { Copy, Check, ShieldAlert } from "lucide-react";

/**
 * One-time display of a freshly generated recovery code.
 * The code is shown to the owner exactly once and cannot be retrieved later.
 */
export function RecoveryCodeCard({
  code,
  onDone,
  title = "Save your recovery code",
  description = "Store this somewhere safe. It's the only way to reset your password if you forget it. It will not be shown again.",
  doneLabel = "I've saved it",
}: {
  code: string;
  onDone: () => void;
  title?: string;
  description?: string;
  doneLabel?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [ack, setAck] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-2xl bg-amber-500/20 text-amber-400">
          <ShieldAlert className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-amber-100">{title}</p>
          <p className="text-xs text-amber-200/80">{description}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-zinc-950 px-3 py-3">
        <code className="flex-1 select-all font-mono text-sm tracking-widest text-amber-200">
          {code}
        </code>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <label className="mt-4 flex items-start gap-2 text-xs text-amber-100/90">
        <input
          type="checkbox"
          checked={ack}
          onChange={(e) => setAck(e.target.checked)}
          className="mt-0.5 h-3.5 w-3.5 accent-amber-500"
        />
        I've stored this recovery code somewhere safe.
      </label>

      <button
        type="button"
        disabled={!ack}
        onClick={onDone}
        className="mt-4 w-full rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
      >
        {doneLabel}
      </button>
    </div>
  );
}
