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
  items?: OrderLine[];
  subtotal?: number;
  currency?: string;
  notes?: string;
}

const OrderCustomerEmail = ({
  code = "ORD-000",
  customerName,
  items = [],
  subtotal = 0,
  currency = "EUR",
  notes,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>We received your Cafetería Baratto order {code}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Grazie, {customerName || "friend"} ☕</Heading>
        <Text style={p}>
          We&apos;ve received your order and our team is getting it ready. We&apos;ll
          reach out shortly to confirm timing.
        </Text>

        <Section style={card}>
          <Text style={label}>Order code</Text>
          <Text style={code_}>{code}</Text>
        </Section>

        <Heading as="h2" style={h2}>Your items</Heading>
        {items.map((l, i) => (
          <Text key={i} style={line}>
            <span>
              {l.qty}× {l.name}
            </span>
            <span style={{ float: "right" }}>
              {currency} {l.lineTotal.toFixed(2)}
            </span>
          </Text>
        ))}

        <Hr style={hr} />
        <Text style={total}>
          <strong>Total</strong>
          <span style={{ float: "right" }}>
            <strong>
              {currency} {subtotal.toFixed(2)}
            </strong>
          </span>
        </Text>

        {notes ? (
          <>
            <Heading as="h2" style={h2}>Your notes</Heading>
            <Text style={p}>{notes}</Text>
          </>
        ) : null}

        <Text style={footer}>
          Cafetería Baratto · C. de Vinatea 20, València
        </Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: OrderCustomerEmail,
  subject: (d: Record<string, unknown>) =>
    `We received your order ${(d.code as string) ?? ""}`.trim(),
  displayName: "Order confirmation (customer)",
  previewData: {
    code: "ORD-1234",
    customerName: "Sofia",
    items: [
      { name: "Espresso", qty: 2, lineTotal: 4 },
      { name: "Panini Caprese", qty: 1, lineTotal: 8.5 },
    ],
    subtotal: 12.5,
    currency: "EUR",
  },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container = { padding: "24px", maxWidth: "560px" };
const h1 = { fontSize: "22px", color: "#3b2a1c", margin: "0 0 12px" };
const h2 = { fontSize: "15px", color: "#3b2a1c", margin: "24px 0 8px" };
const p = { fontSize: "14px", color: "#4a3a2c", lineHeight: "22px" };
const card = {
  backgroundColor: "#f6efe4",
  padding: "16px 20px",
  borderRadius: "12px",
  margin: "16px 0",
};
const label = { fontSize: "11px", color: "#8a7a68", textTransform: "uppercase" as const, letterSpacing: "1px", margin: 0 };
const code_ = { fontSize: "20px", color: "#3b2a1c", margin: "4px 0 0", fontWeight: 600 };
const line = { fontSize: "14px", color: "#4a3a2c", margin: "6px 0" };
const total = { fontSize: "15px", color: "#3b2a1c", margin: "8px 0 0" };
const hr = { borderColor: "#e6dccd", margin: "16px 0" };
const footer = { fontSize: "12px", color: "#8a7a68", marginTop: "24px" };
