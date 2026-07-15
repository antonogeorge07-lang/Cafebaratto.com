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
};


export type SiteSettings = {
  offerEnabled: boolean;
  offerHeadline: string;
  offerBody: string;
  offerCode: string;
  offerCtaLabel: string;
  offerCtaHref: string;
  menuVisible: boolean;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  offerEnabled: false,
  offerHeadline: "Happy Hour · 2×1 on Spritz",
  offerBody: "Every Thursday, 6-8pm. Show this code at the counter to unlock the deal.",
  offerCode: "SPRITZ2X1",
  offerCtaLabel: "Book a table",
  offerCtaHref: "#book",
  menuVisible: true,
};
