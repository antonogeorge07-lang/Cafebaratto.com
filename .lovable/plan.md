
# Café Baratto — Production Handover Plan

Goal: keep every existing UI, route, and flow exactly as-is, and replace the browser-local data layer (`localStorage` + `BroadcastChannel` in `src/lib/admin-store.ts`) with Supabase as the single source of truth. Add the missing operational surfaces (kitchen, analytics, automation) on top of the real backend.

## Audit summary (what's already done)

- Owner auth: email/password + magic-link reset, role check via `user_roles` + `has_role('owner'/'admin')`.
- Public site: landing, menu, i18n, mascot, special offer, booking + order modals.
- Admin shell: `/controls/xd92j7k/*` with settings, dashboard, menu editor — all reading/writing `localStorage`.
- Transactional email queue (pgmq + cron + `/lovable/email/queue/process`).
- Tables that exist: `profiles`, `user_roles`, email infra tables. **No** `menu_items`, `orders`, `bookings`, or `site_settings`.

## Gap → phase mapping

```text
Phase 1  Schema + RLS + Realtime + Storage       (unblocks 2-8)
Phase 2  Menu management on Supabase              (replaces MENU + localStorage overrides)
Phase 3  Site settings on Supabase                (offer + menu visibility)
Phase 4  Orders end-to-end                        (customer submit → DB → admin live)
Phase 5  Reservations end-to-end                  (booking modal → DB → admin)
Phase 6  Kitchen Display (KDS) + status lifecycle
Phase 7  Owner notifications (email on new order/booking) + optional Telegram hook
Phase 8  Dashboard analytics from DB              (revenue, top items, prep time)
Phase 9  Automation                               (auto-close ordering window, stock-aware hide, scheduled digests)
Phase 10 Hardening + handover                     (RLS audit, error/empty/loading states, docs, runbook)
```

Every phase ends with: build check, targeted smoke test in preview, and a short status update.

## Phase 1 — Backend foundation (single migration)

New tables (all in `public`, all with `GRANT` + RLS + `updated_at` trigger):

- `menu_items(id, category_key, category_custom, name_es, name_en, desc_es, desc_en, price numeric, diet text[], image_url, stock bool, hidden bool, sort int)`
- `site_settings` — singleton row `id=1` with offer + menu visibility fields matching `SiteSettings` in `admin-store.ts`.
- `orders(id, code text unique, items jsonb, subtotal numeric, currency text, status text check in ('active','preparing','ready','fulfilled','cancelled'), customer_name, customer_contact, notes, placed_at)`
- `bookings(id, kind text check in ('table','event'), name, contact, party_size int, when_at timestamptz, notes, event_type, status text check in ('pending','confirmed','cancelled'))`

RLS:
- `menu_items`, `site_settings`: `SELECT` to `anon` + `authenticated` where `hidden=false` (menu) / always (settings); write only `has_role(auth.uid(),'owner' or 'admin')`.
- `orders`, `bookings`: `INSERT` to `anon` (customer submit); `SELECT/UPDATE` owner-only.
- Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE menu_items, site_settings, orders, bookings`.

Storage: create `menu-images` public bucket + owner-only write policy on `storage.objects`.

Seed `site_settings` row and seed `menu_items` from current `MENU` constant in the same migration so the public site keeps rendering.

## Phase 2-9 — thin, per-domain slices

Each phase follows the same shape:

1. Add typed data helpers in `src/lib/data/<domain>.ts` (list/get/insert/update + `useRealtime<Domain>()` hook using `supabase.channel(...).on('postgres_changes',...)` inside `useEffect`).
2. Swap the existing `admin-store` reader/writer call sites (`getMenu`, `addOrder`, `getSettings`, `addBooking`, `getBookings`, `setOrderStatus`, …) to the new helpers. Keep `admin-store.ts` as a thin re-export shim during the swap so the UI files don't churn.
3. Delete the localStorage/BroadcastChannel path once every call site is migrated.
4. New surfaces added only where missing:
   - **KDS** (`/controls/xd92j7k/_auth.kitchen.tsx`): card lanes for `active → preparing → ready → fulfilled` with big touch targets and audio ping on new order.
   - **Notifications**: server fn triggered by order/booking insert enqueues an owner email via existing pgmq `transactional_emails` queue.
   - **Dashboard**: replace localStorage KPIs with SQL views / server fns (`revenue_by_day`, `top_items`, `avg_prep_minutes`).
   - **Automation**: pg_cron jobs — auto-cancel `active` orders older than N minutes when service closes; auto-hide items with `stock=false` from public menu (already handled at query level); daily owner digest email.

## Phase 10 — hardening + handover

- Supabase linter pass + fix findings.
- Loading/empty/error states on every DB-backed surface.
- Mobile QA on `/`, `/menu`, order + booking modals, KDS.
- `README.md` runbook: env, secrets, restoring from Supabase backup, cron/queue health, how to grant `owner` role.

## Technical notes

- Client reads use TanStack Query; realtime channels invalidate the relevant query key on change.
- Server writes that must be trusted (status transitions, notification dispatch) go through `createServerFn` with `requireSupabaseAuth` and `has_role` check.
- Customer-side inserts (`orders`, `bookings`) go through the anon publishable client with `INSERT`-only policies and Zod validation on both client and a `.functions.ts` wrapper.
- No UI redesign: components keep their current props; only their data source changes.

## Deliverable per phase

At the end of each phase I'll post:
- What shipped, what tables/policies changed
- Build status + smoke test result
- Ticked checkboxes against the milestone list
- Concrete next-phase task list

Reply **go** and I'll start with Phase 1 (schema migration).
