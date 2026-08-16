# KOLVAX User Dashboard

A Revenue Recovery Platform customer portal for local service businesses (salons, clinics, med-spas, dental, home services). KOLVAX quietly recovers revenue from missed calls, after-hours inquiries, lapsed customers, no-shows, and reviews.

---

## 🎨 Design System (Cursor-Inspired)

- **Canvas & Palette:** Warm cream canvas (`#f7f7f4`), white cards (`#ffffff`), warm near-black ink (`#26251e`), and **Cursor Orange** (`#f54e00`) for primary CTAs and active indicators.
- **Hairline-Only Depth:** 1px borders (`#e6e5e0`) with zero drop shadows.
- **Typography:** Inter 400 with negative tracking for magazine-style editorial headlines. JetBrains Mono for code surfaces and IDs.
- **Radii:** 8px for buttons/inputs, 12px for cards, 9999px for pills.

---

## 🚀 Customer Portal Routes

- **Marketing Landing:** `/` — Editorial 72px headline, 5-engine feature grid, pre-footer CTA band
- **Auth:** `/auth` — Editorial split layout, 44px inputs, 8px button radius
- **Command Center:** `/app` — Hero recovery card, 4 KPI trend tiles, "Revenue in motion" cards, action items, live timeline
- **Revenue Engines:** `/app/engines` — 5 recovery engines (Missed Call, After-Hours, Reactivation, No-Show, Reputation)
- **Customers:** `/app/customers` — Customer relationships table, LTV, and open opportunities
- **Activity Timeline:** `/app/activity` — Plain-language outcome stream grouped by day
- **Reports:** `/app/reports` — Weekly & monthly summaries
- **Settings:** `/app/settings` — Business profile, locations, notification preferences, connected integrations

---

## 🛠️ Stack

- **Framework:** TanStack Start v1 (React 19, SSR-capable)
- **Bundler:** Vite 8 / Nitro Edge Runtime
- **Router:** TanStack Router (file-based routing)
- **Data & State:** TanStack Query v5
- **Styling:** Tailwind CSS v4 via `@theme` tokens in `src/styles.css`
- **Database / Auth:** Supabase (Postgres, Row Level Security, Auth) + rich standalone mock layer

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Build for production
npm run build
```

---

## 🔌 Standalone Mock Layer & Supabase Migration

- **Standalone Mode:** Works out of the box with rich fixtures for the demo tenant (**Bella Beauty Studio**).
- **Personal Supabase Setup:** To connect your personal Supabase project, follow the SQL migration files in `supabase/migrations/` and update `.env` with your new Supabase Project URL and Anon Key.
