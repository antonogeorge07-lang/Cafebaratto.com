// Daily digest endpoint invoked by pg_cron at 04:00 UTC. Computes yesterday's
// stats via the daily_digest_stats() DB helper and enqueues an owner email.
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { render } from "@react-email/render";
import * as React from "react";
import { TEMPLATES } from "@/lib/email-templates/registry";

const SITE_NAME = "cafebaratto-com";
const SENDER_DOMAIN = "notify.cafebaratto.com";
const FROM_DOMAIN = "cafebaratto.com";
const OWNER_EMAIL = "cafeteriabaratto@gmail.com";

function token32() {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
}

export const Route = createFileRoute("/api/public/hooks/daily-digest")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = process.env.SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !key) {
          return Response.json({ error: "server_misconfigured" }, { status: 500 });
        }

        // Require service-role bearer token (same pattern as /lovable/email/queue/process).
        // pg_cron sends this Authorization header from a vault-stored secret.
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.slice("Bearer ".length).trim();
        if (token !== key) {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        const supabase: any = createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data: stats, error: statsErr } = await supabase.rpc("daily_digest_stats");
        if (statsErr || !stats) {
          console.error("[daily-digest] stats failed", statsErr);
          return Response.json({ error: "stats_failed" }, { status: 500 });
        }


        const date = (stats as any).date as string;
        const recipient = OWNER_EMAIL.toLowerCase();
        const idempotencyKey = `daily-digest-${date}`;
        const messageId = crypto.randomUUID();

        // Suppression check
        const { data: suppressed } = await supabase
          .from("suppressed_emails")
          .select("id")
          .eq("email", recipient)
          .maybeSingle();
        if (suppressed) return Response.json({ ok: true, skipped: "suppressed" });

        // Unsubscribe token
        let unsubToken = token32();
        const { data: existing } = await supabase
          .from("email_unsubscribe_tokens")
          .select("token, used_at")
          .eq("email", recipient)
          .maybeSingle();
        if (existing && !existing.used_at) {
          unsubToken = existing.token as string;
        } else {
          await supabase
            .from("email_unsubscribe_tokens")
            .upsert({ token: unsubToken, email: recipient }, { onConflict: "email", ignoreDuplicates: true });
          const { data: back } = await supabase
            .from("email_unsubscribe_tokens")
            .select("token")
            .eq("email", recipient)
            .maybeSingle();
          if (back?.token) unsubToken = back.token as string;
        }

        const tpl = TEMPLATES["daily-digest"];
        if (!tpl) return Response.json({ error: "template_missing" }, { status: 500 });
        const element = React.createElement(tpl.component, stats as any);
        const html = await render(element);
        const text = await render(element, { plainText: true });
        const subject =
          typeof tpl.subject === "function" ? tpl.subject(stats as any) : tpl.subject;

        await supabase.from("email_send_log").insert({
          message_id: messageId,
          template_name: "daily-digest",
          recipient_email: recipient,
          status: "pending",
        });

        const { error: enqErr } = await supabase.rpc("enqueue_email", {
          queue_name: "transactional_emails",
          payload: {
            message_id: messageId,
            to: recipient,
            from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
            sender_domain: SENDER_DOMAIN,
            subject,
            html,
            text,
            purpose: "transactional",
            label: "daily-digest",
            idempotency_key: idempotencyKey,
            unsubscribe_token: unsubToken,
            queued_at: new Date().toISOString(),
          },
        });
        if (enqErr) {
          console.error("[daily-digest] enqueue failed", enqErr);
          return Response.json({ error: "enqueue_failed" }, { status: 500 });
        }

        return Response.json({ ok: true, date, stats });
      },
    },
  },
});
