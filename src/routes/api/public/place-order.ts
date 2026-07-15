// Public order-placement endpoint. Anonymous customers POST here from the
// order modal: we validate input, insert into `orders` (RLS anon INSERT
// policy accepts it), then fire off two async transactional emails —
// receipt to the customer and notification to the owner. Any email failure
// is logged but never blocks the order from being created.
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { render } from "@react-email/render";
import * as React from "react";
import { z } from "zod";
import { TEMPLATES } from "@/lib/email-templates/registry";


type AnyClient = any;



const LineSchema = z.object({
  id: z.string().min(1).max(120),
  name: z.string().min(1).max(200),
  qty: z.number().int().min(1).max(99),
  unitPrice: z.number().min(0).max(10000),
  lineTotal: z.number().min(0).max(100000),
});

const BodySchema = z.object({
  code: z.string().min(3).max(64),
  items: z.array(LineSchema).min(1).max(50),
  subtotal: z.number().min(0).max(100000),
  currency: z.string().min(3).max(6).default("EUR"),
  customerName: z.string().trim().min(1).max(120),
  contact: z.string().trim().min(5).max(60),
  email: z
    .string()
    .trim()
    .email()
    .max(200)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  notes: z.string().trim().max(500).optional(),
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

  // Suppression check
  const { data: suppressed } = await opts.supabase
    .from("suppressed_emails")
    .select("id")
    .eq("email", recipient)
    .maybeSingle();
  if (suppressed) return { skipped: true as const };

  // Unsubscribe token (per email)
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

async function resolveOwnerEmail(
  supabase: any,
): Promise<string | null> {
  // Owner is the first user with role='owner'; grab their profile email.
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

export const Route = createFileRoute("/api/public/place-order")({
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
        const body = parsed.data;
        const supabase: AnyClient = createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        // 1. Insert order
        const { error: insertErr } = await supabase.from("orders").insert({
          code: body.code,
          placed_at: new Date().toISOString(),
          items: body.items as unknown as never,
          subtotal: body.subtotal,
          currency: body.currency,
          status: "active",
          customer_name: body.customerName,
          customer_contact: body.contact,
          notes: body.notes ?? (body.email ? `email: ${body.email}` : null),
        });
        if (insertErr) {
          console.error("[place-order] insert failed", insertErr);
          return Response.json({ error: "insert_failed" }, { status: 500 });
        }

        // 2. Fire emails (non-blocking on individual failures)
        try {
          if (body.email) {
            await enqueueEmail({
              supabase,
              templateName: "order-customer",
              recipient: body.email,
              idempotencyKey: `order-customer-${body.code}`,
              data: {
                code: body.code,
                customerName: body.customerName,
                items: body.items,
                subtotal: body.subtotal,
                currency: body.currency,
                notes: body.notes,
              },
            });
          }
        } catch (e) {
          console.error("[place-order] customer email failed", e);
        }
        try {
          const owner = await resolveOwnerEmail(supabase);
          if (owner) {
            await enqueueEmail({
              supabase,
              templateName: "order-owner",
              recipient: owner,
              idempotencyKey: `order-owner-${body.code}`,
              data: {
                code: body.code,
                customerName: body.customerName,
                contact: body.contact,
                email: body.email,
                items: body.items,
                subtotal: body.subtotal,
                currency: body.currency,
                notes: body.notes,
              },
            });
          }
        } catch (e) {
          console.error("[place-order] owner email failed", e);
        }

        return Response.json({ ok: true, code: body.code });
      },
    },
  },
});
