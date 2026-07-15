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

interface OrderLine {
  name: string;
  qty: number;
  lineTotal: number;
}

interface Props {
  code?: string;
  customerName?: string;
  contact?: string;
  email?: string;
  items?: OrderLine[];
  subtotal?: number;
  currency?: string;
  notes?: string;
}

const OrderOwnerEmail = ({
  code = "ORD-000",
  customerName = "—",
  contact = "—",
  email,
  items = [],
  subtotal = 0,
  currency = "EUR",
  notes,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New order {code} · {customerName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New order · {code}</Heading>

        <Section style={card}>
          <Text style={row}><strong>Name:</strong> {customerName}</Text>
          <Text style={row}><strong>Phone:</strong> {contact}</Text>
          {email ? <Text style={row}><strong>Email:</strong> {email}</Text> : null}
        </Section>

        <Heading as="h2" style={h2}>Items</Heading>
        {items.map((l, i) => (
          <Text key={i} style={line}>
            <span>{l.qty}× {l.name}</span>
            <span style={{ float: "right" }}>{currency} {l.lineTotal.toFixed(2)}</span>
          </Text>
        ))}
        <Hr style={hr} />
        <Text style={line}>
          <strong>Total</strong>
          <span style={{ float: "right" }}>
            <strong>{currency} {subtotal.toFixed(2)}</strong>
          </span>
        </Text>

        {notes ? (
          <>
            <Heading as="h2" style={h2}>Customer notes</Heading>
            <Text style={p}>{notes}</Text>
          </>
        ) : null}
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: OrderOwnerEmail,
  subject: (d: Record<string, unknown>) =>
    `New order ${(d.code as string) ?? ""} · ${(d.customerName as string) ?? ""}`.trim(),
  displayName: "New order (owner notification)",
  previewData: {
    code: "ORD-1234",
    customerName: "Sofia Rossi",
    contact: "+34 600 000 000",
    email: "sofia@example.com",
    items: [{ name: "Espresso", qty: 2, lineTotal: 4 }],
    subtotal: 4,
    currency: "EUR",
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container = { padding: "24px", maxWidth: "560px" };
const h1 = { fontSize: "22px", color: "#3b2a1c", margin: "0 0 12px" };
const h2 = { fontSize: "15px", color: "#3b2a1c", margin: "24px 0 8px" };
const p = { fontSize: "14px", color: "#4a3a2c", lineHeight: "22px" };
const card = { backgroundColor: "#f6efe4", padding: "16px 20px", borderRadius: "12px", margin: "16px 0" };
const row = { fontSize: "14px", color: "#3b2a1c", margin: "4px 0" };
const line = { fontSize: "14px", color: "#4a3a2c", margin: "6px 0" };
const hr = { borderColor: "#e6dccd", margin: "16px 0" };
