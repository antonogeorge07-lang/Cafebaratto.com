# Café Baratto

Bilingual (ES/EN) restaurant site with public menu, order + booking modals, owner console, and Kitchen Display.

Stack: TanStack Start (React 19, Vite 7) on Cloudflare Workers · Tailwind v4 + shadcn/ui · Lovable Cloud (Supabase) for auth, database, storage, realtime.

---

## Runbook

### Environments

- **Preview** — `project--2694da8b-2e39-40c7-aa7b-7862a798f940.lovable.app`
- **Production** — `cafebaratto.com` / `www.cafebaratto.com` (also `cafebaratto-com.lovable.app`)

Editing in Lovable auto-deploys preview; publish from the Lovable editor to promote to production.

### Backend surfaces

| Domain        | Table              | Public reads      | Public writes                | Realtime |
| ------------- | ------------------ | ----------------- | ---------------------------- | -------- |
| Menu          | `menu_items`       | visible items     | ✗ (staff only)               | ✓        |
| Site settings | `site_settings`    | ✓                 | ✗ (staff only)               | ✓        |
| Orders        | `orders`           | ✗                 | ✓ INSERT (bounded)           | ✓        |
| Bookings      | `bookings`         | ✗                 | ✓ INSERT (bounded)           | ✓        |
| Roles         | `user_roles`       | own row only      | ✗                            | —        |
| Email infra   | `email_*`          | service_role only | service_role only            | —        |

Anon `INSERT` on `orders` / `bookings` is constrained by `WITH CHECK` (initial status pinned, length + numeric caps, date windows). See `security-memory` for details.

### Staff / owner access

- Owner console: `/controls/xd92j7k/*` (kitchen, bookings, dashboard, menu, settings).
- Sign in with the account that has `role = 'owner'` in `public.user_roles`.
- First-time owner setup runs when `owner_exists()` returns false; after that, add owners via SQL:
  ```sql
  INSERT INTO public.user_roles (user_id, role)
  SELECT id, 'owner' FROM auth.users WHERE email = 'someone@example.com';
  ```

### Email queue

- Auth + transactional emails go through `pgmq` queues (`q_auth_emails`, `q_transactional_emails`).
- A cron job `process-email-queue` fires every 5s **only while queues are non-empty** (self-arms on enqueue via `email_queue_wake`, self-disarms via `email_queue_dispatch`).
- Sender endpoint: `POST /lovable/email/queue/process` (managed by Lovable).
- Health check:
  ```sql
  SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'process-email-queue';
  SELECT count(*) FROM pgmq.q_auth_emails;
  SELECT count(*) FROM pgmq.q_transactional_emails;
  SELECT * FROM pgmq.q_auth_emails_archive ORDER BY archived_at DESC LIMIT 20;  -- recent sends
  ```
- Dead-letter queues: `dlq_auth_emails`, `dlq_transactional_emails`. Non-empty = investigate.

### Storage

- `menu-images` bucket is **private**. Menu editor uploads via authenticated staff session; the public menu resolves signed URLs.

### Realtime

The client uses one channel per domain (`menu-items-sync`, `site-settings-sync`, `orders-sync`, `bookings-sync`) subscribed once in `src/lib/admin-store.ts`. Route components read from the in-memory cache and re-render on `subscribe()` emissions.

### Backups + restore

Lovable Cloud snapshots the database automatically. To restore:
1. From the Lovable editor, open **View Backend** → project management.
2. Pick a point-in-time restore or a daily snapshot.
3. After restore, verify: `menu_items` count, `site_settings.id = 1` exists, `user_roles` still lists the owner.

### Local dev

```
bun install
bun dev            # http://localhost:8080
```

Env vars are injected by the Lovable sandbox. When running outside Lovable:

- Client: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`
- Server functions: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`

Never commit `.env`. Never import `SUPABASE_SERVICE_ROLE_KEY` outside `.server.ts` files or server-function handlers.

### Common ops

- **Close ordering for the day** — toggle in `/controls/xd92j7k/settings` (writes `site_settings.orders_enabled`).
- **Hide a menu item** — toggle in `/controls/xd92j7k` menu editor (writes `menu_items.hidden`).
- **Change status of an order** — kitchen display buttons: Ready → Back to queue → Archive.
- **Grant owner role** — SQL snippet above.

### Known accepted linter warnings

`has_role`, `is_staff`, `owner_exists` (all `SECURITY DEFINER`) are executable by `anon`/`authenticated` on purpose — they back RLS expressions and a first-run boolean RPC. Documented in `security-memory`.
