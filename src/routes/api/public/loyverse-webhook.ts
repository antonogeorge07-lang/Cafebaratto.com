/**
 * Loyverse webhook receiver (public endpoint — no session gate).
 * ---------------------------------------------------------------
 * Configure on the Loyverse side:
 *   URL:     https://<project-host>/api/public/loyverse-webhook
 *   Events:  receipts.created, items.updated  (per your subscription)
 *   Secret:  set `LOYVERSE_WEBHOOK_SECRET` via add_secret and paste the
 *            same value into the provider's webhook settings.
 *
 * The handler verifies the HMAC-SHA256 signature on the RAW body BEFORE
 * doing any work (timing-safe compare). Downstream processing is left as
 * a TODO — plug into whatever store owns the admin cache (KV, DB, or an
 * in-memory revalidation channel).
 */
import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Loyverse-Signature",
} as const;

function verify(body: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) return false;
  const expected = createHmac("sha256", secret).update(body, "utf8").digest("hex");
  const a = Buffer.from(signatureHeader, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const Route = createFileRoute("/api/public/loyverse-webhook")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const secret = process.env.LOYVERSE_WEBHOOK_SECRET;
        if (!secret) {
          return new Response(
            JSON.stringify({ ok: false, error: "webhook_not_configured" }),
            { status: 503, headers: { "Content-Type": "application/json", ...CORS } },
          );
        }
        const raw = await request.text();
        const signature = request.headers.get("x-loyverse-signature");
        if (!verify(raw, signature, secret)) {
          return new Response("invalid signature", { status: 401, headers: CORS });
        }

        let event: { type?: string; data?: unknown } = {};
        try {
          event = JSON.parse(raw);
        } catch {
          return new Response("bad json", { status: 400, headers: CORS });
        }

        // TODO: dispatch event.type → cache invalidation / DB write.
        //   e.g. "receipts.created"  → prepend to sales trend
        //        "items.updated"     → invalidate menu query
        console.log("[loyverse] webhook received:", event.type ?? "unknown");

        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...CORS },
        });
      },
    },
  },
});
