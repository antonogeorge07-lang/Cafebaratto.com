// Shared type definitions kept separate so data modules can import them
// without pulling the full admin-store surface.

export type OrderStatus = "active" | "fulfilled" | "history";
export type OrderLine = {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};
export type Order = {
  id: string;
  placedAt: string;
  lineItems: OrderLine[];
  subtotal: number;
  currency: string;
  status: OrderStatus;
  customer?: string;
  contact?: string;
  email?: string;
  notes?: string;
};


export type BookingKind = "table" | "event";
export type BookingStatus = "pending" | "confirmed" | "cancelled";
export type Booking = {
  id: string;
  kind: BookingKind;
  name: string;
  contact: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  partySize: number;
  notes?: string;
  eventType?: string;
  status: BookingStatus;
  createdAt: string;
};



export type OfferSlot = {
  visible: boolean;
  title: string;
  price: number;
  imageUrl: string;
};

export const OFFER_SLOT_COUNT = 5;

export const EMPTY_OFFER_SLOT: OfferSlot = {
  visible: false,
  title: "",
  price: 0,
  imageUrl: "",
};

export type SiteSettings = {
  offerEnabled: boolean;
  offerHeadline: string;
  offerBody: string;
  offerCode: string;
  offerCtaLabel: string;
  offerCtaHref: string;
  offerSlots: OfferSlot[];
  menuVisible: boolean;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  offerEnabled: false,
  offerHeadline: "Happy Hour · 2×1 on Spritz",
  offerBody: "Every Thursday, 6-8pm. Show this code at the counter to unlock the deal.",
  offerCode: "SPRITZ2X1",
  offerCtaLabel: "Book a table",
  offerCtaHref: "#book",
  offerSlots: Array.from({ length: OFFER_SLOT_COUNT }, () => ({ ...EMPTY_OFFER_SLOT })),
  menuVisible: true,
};

export function normalizeOfferSlots(input: unknown): OfferSlot[] {
  const arr = Array.isArray(input) ? input : [];
  return Array.from({ length: OFFER_SLOT_COUNT }, (_, i) => {
    const raw = (arr[i] ?? {}) as Partial<OfferSlot>;
    return {
      visible: Boolean(raw.visible),
      title: typeof raw.title === "string" ? raw.title : "",
      price: typeof raw.price === "number" && Number.isFinite(raw.price) ? raw.price : 0,
      imageUrl: typeof raw.imageUrl === "string" ? raw.imageUrl : "",
    };
  });
}

