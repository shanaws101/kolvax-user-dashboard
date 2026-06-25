# KOLVAX

A Revenue Recovery Platform for service businesses. KOLVAX quietly recovers revenue from missed calls, after-hours inquiries, lapsed customers, no-shows, and reviews — so business owners can focus on running the business.

## What's in this MVP

- **Public landing** at `/` — marketing site
- **Auth** at `/auth` — email + password sign in/up
- **Customer Portal** at `/app` — Command Center, Revenue Engines, Customers, Activity, Reports, Settings
- **Operations Portal** at `/ops` — internal-only, role-gated; manages businesses, deployments, and logs

## Stack

- TanStack Start (React 19 + Vite, SSR-capable, Cloudflare Workers)
- TypeScript (strict)
- Tailwind CSS v4 + shadcn/ui
- Supabase (via Lovable Cloud) — Postgres, Auth, RLS
- TanStack Query, React Hook Form, Zod, Lucide

## Architecture

- **Multi-tenancy**: every business has its own row in `businesses`; users join via `profiles.business_id`.
- **Roles** are stored in a separate `user_roles` table (security best practice) with enum `customer_owner | customer_staff | ops_admin | ops_staff`.
- **RLS** uses `security definer` helpers (`is_member_of_business`, `is_ops`, `has_role`) to avoid recursive policies.
- **Auth**: managed `_authenticated` layout (`ssr: false`) gates the entire `/app` and `/ops` subtree. The Ops portal additionally checks for an ops role in its own `beforeLoad`.
- **Server data**: customer reads use the browser Supabase client (RLS-scoped). Privileged ops mutations would use `createServerFn` with `requireSupabaseAuth` and an explicit `has_role` check.
- **Service-role usage**: none in v1 customer flows. Reserved for future ops mutations (loaded with `await import("@/integrations/supabase/client.server")` inside handler bodies).

## Database

All tables live in `public`, every table has RLS enabled and explicit `GRANT`s. Schema:

- `profiles`, `user_roles` — identity & access
- `businesses`, `locations` — tenant
- `revenue_engines` — five recovery engines per business
- `customers`, `activities`, `attention_items` — operational data shown to customers
- `reports`, `notifications`, `notification_preferences` — periodic + ad-hoc comms
- `integrations` — connection status (config hidden from customers)
- `engine_deployments` — internal-only, ops-readable

A demo business (**Bella Beauty Studio**) is seeded with 2 locations, 40 customers, 5 live engines, ~40 activities, attention items, weekly + monthly reports, and 4 connected integrations.

## Demo access

1. Sign up at `/auth` with any email (auto-confirms).
2. Your account starts with no business attached and the `customer_owner` role.
3. To see the seeded data, an ops admin attaches your profile to the demo business `00000000-0000-4000-a000-000000000001`. For demo purposes, you can update directly from the Lovable Cloud table editor:
   - Set `profiles.business_id` to `00000000-0000-4000-a000-000000000001` for your user.
   - Optionally add a row to `user_roles` with `role = 'ops_admin'` to access `/ops`.

## Customer language rules

No customer-facing copy uses the words "AI", "agent", "prompt", "LLM", "automation", or "voice settings". Everything is business-outcome language: *recovered, returned, confirmed, generated, in motion, needs your input*.

## Environment

All Supabase credentials are managed by Lovable Cloud and live in `.env`:

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` — browser
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` — server functions
- `SUPABASE_SERVICE_ROLE_KEY` — server-only (admin), not used in v1 customer flows

## Out of scope (intentionally)

- Real phone/CRM/calendar integrations (status-only UI)
- Billing
- Dark mode
- Customer-facing engine configuration (operations team handles it)
