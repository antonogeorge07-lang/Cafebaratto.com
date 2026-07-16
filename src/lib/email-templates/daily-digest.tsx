import React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface TopItem {
  name: string;
  qty: number;
}

interface Props {
  date?: string;
  orders_total?: number;
  orders_fulfilled?: number;
  orders_cancelled?: number;
  revenue?: number;
  currency?: string;
  bookings_new?: number;
  bookings_confirmed?: number;
  top_items?: TopItem[];
}

const DailyDigestEmail = ({
  date = "",
  orders_total = 0,
  orders_fulfilled = 0,
  orders_cancelled = 0,
  revenue = 0,
  currency = "EUR",
  bookings_new = 0,
  bookings_confirmed = 0,
  top_items = [],
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      {`Daily digest ${date} · ${orders_total} orders · ${currency} ${Number(revenue).toFixed(2)}`}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Daily digest · {date}</Heading>
        <Text style={p}>Yesterday's activity at Café Baratto.</Text>

        <Section style={card}>
          <Heading as="h2" style={h2}>Orders</Heading>
          <Text style={row}><strong>Total:</strong> {String(orders_total)}</Text>
          <Text style={row}><strong>Fulfilled:</strong> {String(orders_fulfilled)}</Text>
          <Text style={row}><strong>Cancelled:</strong> {String(orders_cancelled)}</Text>
          <Text style={row}><strong>Revenue:</strong> {`${currency} ${Number(revenue).toFixed(2)}`}</Text>
        </Section>

        <Section style={card}>
          <Heading as="h2" style={h2}>Bookings</Heading>
          <Text style={row}><strong>New:</strong> {String(bookings_new)}</Text>
          <Text style={row}><strong>Confirmed:</strong> {String(bookings_confirmed)}</Text>
        </Section>


        {top_items.length > 0 ? (
          <>
            <Heading as="h2" style={h2}>Top items</Heading>
            {top_items.map((t, i) => (
              <Text key={i} style={line}>
                <span>{t.name}</span>
                <span style={{ float: "right" }}>{String(t.qty)}</span>
              </Text>
            ))}
            <Hr style={hr} />
          </>
        ) : null}

        <Text style={muted}>
          Automated daily summary. Reply to this email to reach the site.
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: DailyDigestEmail,
  subject: (d: Record<string, unknown>) =>
    `Daily digest · ${(d.date as string) ?? ""}`.trim(),
  displayName: "Daily digest (owner)",
  previewData: {
    date: "2026-07-15",
    orders_total: 12,
    orders_fulfilled: 10,
    orders_cancelled: 2,
    revenue: 184.5,
    currency: "EUR",
    bookings_new: 3,
    bookings_confirmed: 2,
    top_items: [
      { name: "Espresso", qty: 14 },
      { name: "Panini prosciutto", qty: 6 },
    ],
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container = { padding: "24px", maxWidth: "560px" };
const h1 = { fontSize: "22px", color: "#3b2a1c", margin: "0 0 12px" };
const h2 = { fontSize: "15px", color: "#3b2a1c", margin: "0 0 8px" };
const p = { fontSize: "14px", color: "#4a3a2c", lineHeight: "22px" };
const card = { backgroundColor: "#f6efe4", padding: "16px 20px", borderRadius: "12px", margin: "12px 0" };
const row = { fontSize: "14px", color: "#3b2a1c", margin: "4px 0" };
const line = { fontSize: "14px", color: "#4a3a2c", margin: "6px 0" };
const hr = { borderColor: "#e6dccd", margin: "16px 0" };
const muted = { fontSize: "12px", color: "#8a7a67", marginTop: "16px" };
