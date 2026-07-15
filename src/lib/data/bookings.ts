// Bookings backed by Supabase (`bookings` table). Anon can INSERT via anon
// policy; staff read via authenticated policies.
import { supabase } from "@/integrations/supabase/client";
import type { Booking, BookingKind } from "@/lib/admin-store-types";

type Row = {
  id: string;
  kind: string;
  name: string;
  contact: string;
  when_at: string;
  party_size: number;
  notes: string | null;
  event_type: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

function rowToBooking(r: Row): Booking {
  const d = new Date(r.when_at);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return {
    id: r.id,
    kind: (r.kind as BookingKind) ?? "table",
    name: r.name,
    contact: r.contact,
    date: `${yyyy}-${mm}-${dd}`,
    time: `${hh}:${mi}`,
    partySize: r.party_size ?? 1,
    notes: r.notes ?? undefined,
    eventType: r.event_type ?? undefined,
    createdAt: r.created_at,
  };
}

export async function fetchAllBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("when_at", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data as Row[] | null)?.map(rowToBooking) ?? [];
}

export async function insertBooking(b: Omit<Booking, "id" | "createdAt">): Promise<void> {
  const whenAt = new Date(`${b.date}T${b.time}:00`).toISOString();
  const { error } = await supabase.from("bookings").insert({
    kind: b.kind,
    name: b.name,
    contact: b.contact,
    when_at: whenAt,
    party_size: b.partySize,
    notes: b.notes ?? null,
    event_type: b.eventType ?? null,
  });
  if (error) throw error;
}
