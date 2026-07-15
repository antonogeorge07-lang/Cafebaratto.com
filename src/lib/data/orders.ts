// Orders backed by Supabase (`orders` table). Anonymous customers can INSERT
// via the anon policy; staff read/update via authenticated policies.
import { supabase } from "@/integrations/supabase/client";
import type { Order, OrderStatus, OrderLine } from "@/lib/admin-store-types";

type Row = {
  id: string;
  code: string;
  currency: string;
  customer_contact: string | null;
  customer_name: string | null;
  items: unknown;
  notes: string | null;
  placed_at: string;
  status: string;
  subtotal: number;
  updated_at: string;
};

function rowToOrder(r: Row): Order {
  const items = Array.isArray(r.items) ? (r.items as OrderLine[]) : [];
  return {
    id: r.code || r.id,
    placedAt: r.placed_at,
    lineItems: items,
    subtotal: Number(r.subtotal ?? 0),
    currency: r.currency ?? "EUR",
    status: (r.status as OrderStatus) ?? "active",
    customer: r.customer_name ?? undefined,
  };
}

export async function fetchAllOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("placed_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data as Row[] | null)?.map(rowToOrder) ?? [];
}

export async function insertOrder(order: Omit<Order, "status">): Promise<void> {
  const { error } = await supabase.from("orders").insert({
    code: order.id,
    placed_at: order.placedAt,
    items: order.lineItems as unknown as never,
    subtotal: order.subtotal,
    currency: order.currency,
    status: "active",
    customer_name: order.customer ?? null,
  });
  if (error) throw error;
}

export async function updateOrderStatus(code: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("code", code);
  if (error) throw error;
}
