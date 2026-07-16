// Public booking endpoint. Anonymous callers POST here from the booking
// modal or /book page. We insert into `bookings` via the service-role
// client (bypasses RLS but we enforce the same limits Zod-side) and fire
// customer + owner emails via the queue.
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { render } from "@react-email/render";
import * as React from "react";
import { z } from "zod";
import { TEMPLATES } from "@/lib/email-templates/registry";

const BodySchema = z.object({
  kind: z.enum(["table", "event"]),
  name: z.string().trim().min(1).max(200),
  contact: z.string().trim().min(3).max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  partySize: z.number().int().min(1).max(200),
  notes: z.string().trim().max(2000).optional(),
  eventType: z.string().trim().max(200).optional(),
  email: z
    .string()
    .trim()
    .email()
    .max(200)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

const SITE_NAME = "cafebaratto-com";
const SENDER_DOMAIN = "notify.cafebaratto.com";
const FROM_DOMAIN = "cafebaratto.com";

function token32() {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
}

async function enqueueEmail(opts: {
  supabase: any;
  templateName: string;
  recipient: string;
  data: Record<string, unknown>;
  idempotencyKey: string;
}) {
  const tpl = TEMPLATES[opts.templateName];
  if (!tpl) throw new Error(`template_missing:${opts.templateName}`);
  const recipient = (tpl.to || opts.recipient).toLowerCase();
  const messageId = crypto.randomUUID();

  const { data: suppressed } = await opts.supabase
    .from("suppressed_emails")
    .select("id")
    .eq("email", recipient)
    .maybeSingle();
  if (suppressed) return { skipped: true as const };

  let unsubToken: string;
  const { data: existing } = await opts.supabase
    .from("email_unsubscribe_tokens")
    .select("token, used_at")
    .eq("email", recipient)
    .maybeSingle();
  if (existing && !existing.used_at) {
    unsubToken = existing.token as string;
  } else {
    unsubToken = token32();
    await opts.supabase
      .from("email_unsubscribe_tokens")
      .upsert({ token: unsubToken, email: recipient }, { onConflict: "email", ignoreDuplicates: true });
    const { data: back } = await opts.supabase
      .from("email_unsubscribe_tokens")
      .select("token")
      .eq("email", recipient)
      .maybeSingle();
    if (back?.token) unsubToken = back.token as string;
  }

  const element = React.createElement(tpl.component, opts.data);
  const html = await render(element);
  const text = await render(element, { plainText: true });
  const subject =
    typeof tpl.subject === "function" ? tpl.subject(opts.data) : tpl.subject;

  await opts.supabase.from("email_send_log").insert({
    message_id: messageId,
    template_name: opts.templateName,
    recipient_email: recipient,
    status: "pending",
  });

  await opts.supabase.rpc("enqueue_email", {
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
      label: opts.templateName,
      idempotency_key: opts.idempotencyKey,
      unsubscribe_token: unsubToken,
      queued_at: new Date().toISOString(),
    },
  });
  return { skipped: false as const };
}

async function resolveOwnerEmail(supabase: any): Promise<string | null> {
  const { data: role } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();
  if (!role?.user_id) return null;
  const { data: prof } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", role.user_id as string)
    .maybeSingle();
  return (prof?.email as string | null) ?? null;
}

export const Route = createFileRoute("/api/public/place-booking")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = process.env.SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !key) {
          return Response.json({ error: "server_misconfigured" }, { status: 500 });
        }
        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return Response.json({ error: "invalid_json" }, { status: 400 });
        }
        const parsed = BodySchema.safeParse(raw);
        if (!parsed.success) {
          return Response.json(
            { error: "invalid_input", details: parsed.error.flatten() },
            { status: 400 },
          );
        }
        const b = parsed.data;
        const supabase: any = createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const whenAt = new Date(`${b.date}T${b.time}:00`).toISOString();
        const { data: inserted, error: insertErr } = await supabase
          .from("bookings")
          .insert({
            kind: b.kind,
            name: b.name,
            contact: b.contact,
            when_at: whenAt,
            party_size: b.partySize,
            notes: b.notes ?? null,
            event_type: b.eventType ?? null,
            status: "pending",
          })
          .select("id")
          .maybeSingle();
        if (insertErr) {
          console.error("[place-booking] insert failed", insertErr);
          return Response.json({ error: "insert_failed" }, { status: 500 });
        }
        const bookingId = (inserted?.id as string) ?? `${Date.now()}`;

        const emailData = {
          customerName: b.name,
          contact: b.contact,
          kind: b.kind,
          date: b.date,
          time: b.time,
          partySize: b.partySize,
          eventType: b.eventType,
          notes: b.notes,
        };

        const recipientCandidate = b.email ?? (b.contact.includes("@") ? b.contact : undefined);
        if (recipientCandidate) {
          try {
            await enqueueEmail({
              supabase,
              templateName: "booking-customer",
              recipient: recipientCandidate,
              idempotencyKey: `booking-customer-${bookingId}`,
              data: emailData,
            });
          } catch (e) {
            console.error("[place-booking] customer email failed", e);
          }
        }
        try {
          const owner = await resolveOwnerEmail(supabase);
          if (owner) {
            await enqueueEmail({
              supabase,
              templateName: "booking-owner",
              recipient: owner,
              idempotencyKey: `booking-owner-${bookingId}`,
              data: emailData,
            });
          }
        } catch (e) {
          console.error("[place-booking] owner email failed", e);
        }

        return Response.json({ ok: true, id: bookingId });
      },
    },
  },
});
