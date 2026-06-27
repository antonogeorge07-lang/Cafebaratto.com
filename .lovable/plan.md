# Lite-Speed Admin UI — Build Plan

Frontend-only implementation (no backend yet). State persists in `localStorage` so it survives reloads; orders flow from the public site to the admin via a shared store + `BroadcastChannel` for real-time push between tabs. Cloud/Supabase can be wired in later without changing the UI.

## 1. Hide admin from the public
- Move `src/routes/admin.tsx` → `src/routes/controls._xd92j.tsx` (URL `/controls/_xd92j`, unindexed, `robots: noindex,nofollow` already set).
- Delete old `/admin` route file so it 404s.
- Remove any nav references; no link from public site.

## 2. Launchpad single-page shell
Inside the new admin route, replace sidebar tabs with:
- Sticky top **icon grid** (Overview, Menu, Orders, Analytics, Assistant, Settings) — iOS-launchpad style.
- Each icon triggers `scrollIntoView({behavior:'smooth'})` to its section.
- All sections live on one page; no route changes.
- Floating **Analytics FAB** (bottom-right) opens a slide-up drawer with KPIs + sparkline.

## 3. Menu & Catalog manager (inline CRUD)
- Editable table: name (ES/EN), category, price, stock toggle, dietary tags, delete.
- "Add item" row; changes persist to `localStorage` (`baratto.menu`).
- Public `/` menu reads from the same store via `useLiveMenu` (updated to subscribe).
- Currency dropdown (EUR / USD / GBP) with fixed FX multipliers — affects displayed price only.

## 4. Secured master actions
- Delete button opens confirm modal.
- First use prompts admin to set a master password → stored as SHA-256 hash in `localStorage`.
- Subsequent deletes require password; hashed client-side via `crypto.subtle` and compared.

## 5. Live order queue + push
- Public `OrderModal` submits orders into shared store (`baratto.orders`) + posts to `BroadcastChannel('baratto-orders')`.
- Admin "Orders" tab: three sub-tabs (Active / History / Fulfilled), live-updating list with customer, items, total, timestamp, status toggle.
- On new order: ping `Notification` API (request permission on first admin load) + in-app toast + unread badge on the launchpad Orders icon.

## 6. Context-aware chatbot
- Chat widget pinned bottom of admin page.
- Uses Lovable AI Gateway (`google/gemini-3-flash-preview`) via a new `createServerFn` (`src/lib/admin-chat.functions.ts`).
- Each request serializes current menu + recent orders + KPIs as a system-prompt context block so answers reflect live state.
- Requires `LOVABLE_API_KEY` (auto-provisioned).

## Technical notes
- New files: `src/lib/admin-store.ts` (shared menu+orders store w/ subscribe), `src/lib/crypto.ts` (hash helper), `src/components/admin/*` (Launchpad, MenuTable, OrdersPanel, AnalyticsDrawer, ChatWidget, DeleteGuard), `src/lib/admin-chat.functions.ts`.
- Edits: `src/components/OrderModal.tsx` (write to store), `src/lib/useLiveMenu.ts` (subscribe to store), route rename.
- No DB / no auth changes in this pass. Cloud wiring can replace `localStorage` later with a 1:1 store swap.

## Out of scope for now
- Real server-side web-push (needs service worker + VAPID); using in-tab `Notification` + BroadcastChannel as the "push" surrogate.
- Vector store; the chatbot uses fresh-context injection per message instead, which is simpler and equally accurate for this dataset size.

Confirm and I'll build it.
