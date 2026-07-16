import React from "react";
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";

interface Props {
  customerName?: string;
  contact?: string;
  kind?: "table" | "event";
  date?: string;
  time?: string;
  partySize?: number;
  eventType?: string;
  notes?: string;
}

const BookingOwnerEmail = ({
  customerName = "—",
  contact = "—",
  kind = "table",
  date = "",
  time = "",
  partySize = 2,
  eventType,
  notes,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New {kind} booking · {date} {time}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New {kind === "event" ? "event enquiry" : "table booking"}</Heading>
        <Section style={card}>
          <Text style={row}><strong>Guest:</strong> {customerName}</Text>
          <Text style={row}><strong>Contact:</strong> {contact}</Text>
          <Text style={row}><strong>When:</strong> {date} · {time}</Text>
          <Text style={row}><strong>Party size:</strong> {partySize}</Text>
          {kind === "event" && eventType ? (
            <Text style={row}><strong>Occasion:</strong> {eventType}</Text>
          ) : null}
          {notes ? <Text style={row}><strong>Notes:</strong> {notes}</Text> : null}
        </Section>
        <Text style={footer}>Confirm or cancel in the admin dashboard.</Text>
      </Container>
    </Body>
  </Html>
);

export const template = {
  component: BookingOwnerEmail,
  subject: (d: Record<string, unknown>) =>
    `New ${(d.kind as string) === "event" ? "event" : "table"} booking · ${(d.date as string) ?? ""} ${(d.time as string) ?? ""}`.trim(),
  displayName: "New booking (owner notification)",
  previewData: { customerName: "Sofia Rossi", contact: "+34 600 000 000", kind: "table", date: "2026-07-20", time: "19:00", partySize: 4 },
} satisfies TemplateEntry;

const main = { backgroundColor: "#ffffff", fontFamily: "Arial, sans-serif" };
const container = { padding: "24px", maxWidth: "560px" };
const h1 = { fontSize: "22px", color: "#3b2a1c", margin: "0 0 12px" };
const card = { backgroundColor: "#f6efe4", padding: "16px 20px", borderRadius: "12px", margin: "16px 0" };
const row = { fontSize: "14px", color: "#3b2a1c", margin: "4px 0" };
const footer = { fontSize: "12px", color: "#8a7a68", marginTop: "24px" };
