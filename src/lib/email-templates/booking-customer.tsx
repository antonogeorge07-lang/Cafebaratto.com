import React from "react";
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  customerName?: string;
  kind?: "table" | "event";
  date?: string;
  time?: string;
  partySize?: number;
  eventType?: string;
  notes?: string;
}

const BookingCustomerEmail = ({
  customerName = "there",
  kind = "table",
  date = "",
  time = "",
  partySize = 2,
  eventType,
  notes,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>We've received your {kind === "event" ? "event enquiry" : "reservation"}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Hi {customerName.split(" ")[0]}, we've got your request</Heading>
        <Text style={p}>
          Thanks for choosing Café Baratto. Your {kind === "event" ? "event enquiry" : "table reservation"} is
          pending confirmation — we'll reply shortly to confirm.
        </Text>
        <Section style={card}>
          <Text style={label}>Date</Text>
          <Text style={val}>{date} · {time}</Text>
          <Text style={label}>Party</Text>
          <Text style={val}>{partySize} guest{partySize === 1 ? "" : "s"}</Text>
          {kind === "event" && eventType ? (
            <>
              <Text style={label}>Occasion</Text>
              <Text style={val}>{eventType}</Text>
            </>
          ) : null}
          {notes ? (
            <>
              <Text style={label}>Your notes</Text>
              <Text style={val}>{notes}</Text>
            </>
          ) : null}
        </Section>
        <Text style={footer}>See you soon — Café Baratto</Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: BookingCustomerEmail,
  subject: (d: Record<string, unknown>) =>
    `We've received your ${(d.kind as string) === "event" ? "event enquiry" : "reservation"}`,
  displayName: "Booking received (customer)",
  previewData: { customerName: "Sofia", kind: "table", date: "2026-07-20", time: "19:00", partySize: 2 },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container = { padding: "24px", maxWidth: "560px" };
const h1 = { fontSize: "22px", color: "#3b2a1c", margin: "0 0 12px" };
const p = { fontSize: "14px", color: "#4a3a2c", lineHeight: "22px" };
const card = { backgroundColor: "#f6efe4", padding: "16px 20px", borderRadius: "12px", margin: "16px 0" };
const label = { fontSize: "11px", color: "#8a7a68", textTransform: "uppercase" as const, letterSpacing: "1px", margin: "8px 0 2px" };
const val = { fontSize: "15px", color: "#3b2a1c", margin: "0 0 4px" };
const footer = { fontSize: "12px", color: "#8a7a68", marginTop: "24px" };
