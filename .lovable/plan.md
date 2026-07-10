# Full migration + 4 features

This is a large change. It replaces the current device-local (`localStorage`) owner auth and menu/orders store with a real backend so magic-link email recovery works, then layers the three UI features on top. Existing features stay working end-to-end.

## Order of work

### Phase 0 — Backend foundation (prereq for #4)
1. Enable Lovable Cloud (Supabase + email domain prompt).
2. Migrations (schema + GRANTs + RLS):
   - `profiles` (id → auth.users, name, email) with signup trigger.
   - `app_role` enum + `user_roles` + `has_role()` SECURITY DEFINER.
   - `menu_items` (id, category_key, category_custom, name_es/en, desc_es/en, price, diet[], image_url, stock, hidden, sort).
   - `orders` (id, items jsonb, total, status, customer, created_at).
   - `bookings` (id, kind, name, contact, party, when, notes, status).
   - `site_settings` singleton (offer_enabled, offer_headline, offer_body, offer_code, offer_cta_label, offer_cta_href, menu_visible).
   - RLS: public SELECT on `menu_items` (only where `hidden=false`) and `site_settings`; owner-role writes; `orders`/`bookings` insert=anon, select/update=owner.
3. First-owner bootstrap: server fn that grants `admin` role to the first signup, then locks further self-promotion.

### Phase 1 — Auth swap
4. Add real Supabase email/password auth on `/owner` (sign in + sign up). Keep the same visual shell.
5. Replace `AdminSessionContext` (localStorage password + recovery code) with Supabase session + `has_role('admin')` gate.
6. Move `/controls/xd92j7k/_auth` gate to the managed `_authenticated` layout + admin role check. Public site + owner UI keep working; sign-out hygiene per Cloud rules.
7. **Delete**: recovery-code UI, `RecoveryCodeCard` usage in owner/settings flows, `masterHash`/`profile`/`recoveryHash` reads (kept as a one-time local cleanup on first load).

### Phase 2 — #4 Magic-link password reset
8. Forgot-password view: single email input → `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + '/reset-password' })`.
9. New public route `/reset-password`: detects `type=recovery`, shows new-password + confirm, calls `updateUser({ password })`, then redirects into controls.
10. Wire Lovable Emails so the reset email actually sends (needs verified sender domain — user prompted via setup dialog).

### Phase 3 — #1 Special Offer section
11. New `SpecialOffer` component on `/` landing, reads `site_settings.offer_*`. Renders only when `offer_enabled=true`. Headline + body + copy-to-clipboard coupon code + CTA button.
12. SEO/accessibility: semantic `<section>`, aria-labelled, no LCP-blocking image.

### Phase 4 — #2 Admin visibility toggles
13. Extend existing Settings section (no new page) with a "Landing visibility" card:
   - Show/hide Special Offer (+ inline edit of headline/body/code/CTA).
   - Show/hide entire public Menu.
   - Per-item Hide/Show + Out-of-stock toggles on the Menu table (item-level `hidden` already added in schema).
14. Realtime: subscribe public `Index` + `Menu` pages to `site_settings` and `menu_items` via Supabase Realtime → instant reflection without reload.

### Phase 5 — #3 Category taxonomy + free text
15. `category_key` enum: `coffee | drinks_juices | food | beverages_desserts | custom`.
16. Presets per key surfaced in the item form as chips (Coffee: Espresso/Brewed/Pour-over; Food: Snacks/Quick Bites/Breads/Croissants; others: free-text). All presets are non-binding — admin can type any `category_custom` string.
17. Public menu groups by `category_key` then by `category_custom` sub-label; existing filters keep working because they read `category_key`. Custom parent names use `category_key='custom'` + `category_custom`.
18. Data migration: map current items (`coffee → coffee`, `breakfast → food`, `paninis → food`, `cocktails → beverages_desserts`, `desserts → beverages_desserts`) with sensible `category_custom` sub-labels.

## What stays untouched
- Public landing layout, mascot, i18n, booking/order modals (rewired to Supabase inserts, same UX).
- Route paths for `/`, `/menu`, `/owner`, `/controls/xd92j7k/*`, `/reset-password` (new).
- Existing analytics + styling tokens.

## What gets removed
- `sha256` master password + recovery code flow, `RecoveryCodeCard` from auth surfaces (component file kept only if reused; otherwise deleted).
- localStorage menu/orders/bookings stores (kept as read-only fallback for one boot to migrate any pending local data, then cleared).

## Risks / heads-up
- Email domain: magic-link reset only sends real emails once a sender domain is verified. Setup dialog will appear; until then reset emails won't leave Lovable's default sender.
- First-owner bootstrap: the very first Supabase signup on the deployed project becomes admin. Any later signup needs an existing admin to grant the role in `user_roles` (I'll add a small grant UI in Settings).
- This is a one-way migration off localStorage. Existing device-local menu edits, orders, and bookings on your browser will be imported once into the DB on first admin sign-in, then the local store is cleared.

Reply "go" and I'll start with Phase 0.
