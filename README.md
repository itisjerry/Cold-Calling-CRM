# Helio CRM — Calling Command Center

A state-of-the-art outbound calling CRM purpose-built for a web/design agency cold-calling team. Timezone-aware queue, one-click dispositions, smart follow-up rhythm, and a clean handoff from qualified lead to active project.

## ✨ What's new — Admin/Agent + Branded Reports release

- **Admin & Agent dual interface.** Switch users from the top-right picker. Admins get `/admin/*` (dashboard, users, all leads, all projects, activity feed, leaderboard, reports). Agents see only their own leads, tasks, reminders, and inbox.
- **Push work to agents.** Admins can push leads (single or round-robin), assign tasks, send reminders, and request updates on any lead/project. Agents get notifications and an inbox banner.
- **Branded PDF reports.** Flexible date range (Today, last 7/30 days, MTD, custom range, etc.). Eight templates — daily activity, weekly performance, monthly leadership, pipeline health, lead source ROI, agent scorecard, all-agents comparison, custom. Reports use the org branding from Settings → Branding (logo, colors, footer, signoff).
- **Live leaderboards.** Today / week / month tabs with podium for top 3.
- **Flexible views.** Date-range chip on Leads, Activity, Leaderboard; per-owner scope; saved filter state.
- **Per-agent drill-in.** Click any agent in Users to see their full scorecard, leads, history, tasks, reminders, and update requests — plus "Generate PDF" deep-link to the report builder.
- **Settings → Customize.** Edit dispositions and pipeline stages per org.

## ⚡ Quick start (5 minutes)

```bash
# 1. Install deps
npm install

# 2. Run dev server
npm run dev

# 3. Open the app
# Visit http://localhost:3000 → click "Skip — try demo mode" on login →
# click "Load demo data" on the welcome banner → 40 demo leads appear.
```

That gets you a fully working CRM in demo mode (data lives in `localStorage`).

## 🔐 Production setup with Supabase (multi-user, cloud)

```bash
# 1. Create a free project at https://supabase.com
# 2. Copy your URL, anon key, and service role key.
# 3. Create .env.local from the template
cp .env.example .env.local
#    Then edit .env.local with your Supabase credentials.

# 4. Run the migrations in your Supabase SQL editor:
#    Open: supabase/migrations/0001_init.sql → paste → Run.

# 5. (Optional) Seed sample data:
#    Open: supabase/seed.sql → paste → Run after you've signed up a user.

# 6. Start dev server
npm run dev
```

Visit `/signup`, create your account, log in. You'll automatically be attached to the demo org from the seed file (or create your own org).

## 🚀 Deploy to Vercel (no backend needed)

You can deploy right now without Supabase. The app runs in demo mode, persisting data per-user in their browser's localStorage. Perfect for previewing, testing the UX, and onboarding callers.

```bash
# Option A — Vercel CLI
npm i -g vercel
vercel              # follow prompts, defaults are fine
vercel --prod       # deploy to production URL
```

Or push to GitHub and import the repo on [vercel.com/new](https://vercel.com/new) — Vercel auto-detects Next.js and builds with zero config.

**No environment variables required.** Without `NEXT_PUBLIC_SUPABASE_URL`, Helio automatically runs in demo mode:
- Login/signup pages auto-redirect to the app (no auth gate)
- Data lives in each user's browser localStorage
- All features work — call mode, queue, dispositions, pipeline, analytics, CSV import, etc.

### Later: switch on Supabase (multi-user cloud)

When you're ready to make it a real multi-user product:

1. Create a free project at [supabase.com](https://supabase.com)
2. In your Vercel project → **Settings → Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. In the Supabase SQL editor, paste & run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
4. Redeploy on Vercel — the auth gate activates automatically

That's the entire upgrade path. The frontend code doesn't change.

## 📦 What's inside

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn-style components · Supabase (Postgres + Auth + RLS + Realtime) · TanStack Query · Recharts · @dnd-kit · PapaParse · Zustand

**Features:**

- **Dashboard** — KPIs, today's priority queue, weekly call chart, pipeline snapshot
- **Call Mode** — three-pane workhorse: queue · current lead · disposition+history+notes+scripts
- **Leads** — table with advanced filters, bulk actions, CSV export, full-text search
- **Import** — drop CSV, auto-map columns, dedup against existing leads, resolve timezones
- **Follow-ups** — four lanes: Hot/Unanswered, Callbacks Due, Today's Best Day (Tue/Thu boost), Revival (4+ attempts)
- **Pipeline** — drag-and-drop kanban: New → Contacted → Qualified → Proposal → Won → Lost. Moving to "Won" prompts to create a Project.
- **Projects** — drag kanban for delivery: Discovery → Proposal → Contract → Kickoff → Active → Delivered → On Hold
- **Tasks & Reminders** — four lanes: Overdue / Today / Upcoming / Done, with priorities
- **Calendar** — month view of callbacks, tasks, and project due-dates
- **Analytics** — activity over 30 days, disposition mix, status funnel, best hours to connect, weekly + monthly summaries
- **Settings** — calling window, scoring weights, revival threshold, sample data reload, full wipe

## ⌨️ Keyboard shortcuts

- `/` or `Cmd/Ctrl + K` — open command palette / global search
- `1`–`9` — dispositions in the Quick Log modal (Answered, Voicemail, No Answer, Busy, Callback Requested, Qualified, Send Info, Not Interested, Wrong Number)

## 🧠 How the queue is ordered

Every lead gets a live score:

```
score = temperatureWeight (Hot=100, Warm=60, Cold=30)
      + recencyBoost (max 30, decays over 30 days)
      + callbackDueBoost (today: +80, overdue: +60)
      + tueThuBoost (Tue/Thu Follow-up: +25)
      + inWindowBoost (lead's local time in calling window: +20)
      − attemptPenalty (×5 per attempt over 1)
      − staleAgePenalty (lead older than 60 days: −20)
```

All weights tunable in **Settings**.

## 🌍 Timezone awareness

On import, each lead's city + state is mapped to an IANA timezone (USA ~120 metros plus international fallbacks). The local time displays live next to every lead in the queue. Leads outside their 9am–6pm window are gray-flagged "Off-hours" and dropped from the live queue.

## 🗃️ Data model

See `types/index.ts` for full TypeScript types, and `supabase/migrations/0001_init.sql` for the Postgres schema with RLS. Multi-tenant from day one via `org_id` on every row + `current_org_id()` helper.

**Roles:** `admin` · `manager` · `caller` — UI-gated and RLS-enforced.

## 🧪 Trying every feature on day one

1. **Load demo data** from the welcome banner.
2. Open **Call Mode** → click any lead → press `1` → save the disposition.
3. Open **Leads** → filter "Hot · 1–3 attempts" → bulk-select 3 → mark Hot.
4. Open **Pipeline** → drag a lead from "Contacted" → "Qualified" → "Won" → accept the "create project" prompt.
5. Open **Projects** → drag your new project across stages.
6. Open **Tasks** → click "New Task" → due tomorrow → see it on **Calendar**.
7. Open **Analytics** → all four charts render against demo history.
8. Open **Settings** → change calling window to 10–17 → save → return to Dashboard → queue recomputes.

## 📁 File map

```
app/
├─ (auth)/login, signup        ← email/password (Supabase auth)
├─ (app)/                       ← protected app
│  ├─ dashboard
│  ├─ call-mode                 ← the workhorse
│  ├─ leads/[id]
│  ├─ follow-ups
│  ├─ pipeline                  ← drag kanban
│  ├─ projects                  ← agency delivery board
│  ├─ tasks
│  ├─ calendar
│  ├─ analytics
│  ├─ import                    ← CSV with dedup
│  └─ settings
components/
├─ ui/                          ← shadcn-style primitives
├─ layout/                      ← Sidebar, Topbar, Command Palette
└─ leads/                       ← LocalTime, QuickLogModal, AddLeadDialog
lib/
├─ supabase/                    ← client + server + middleware
├─ store.ts                     ← Zustand persisted store (localStorage)
├─ sample-data.ts               ← 40 demo leads + history
├─ scoring.ts                   ← lead scoring formula
├─ timezones.ts                 ← city → IANA timezone
├─ csv.ts                       ← parse + auto-map + dedup
└─ utils.ts                     ← cn, formatters, color maps
supabase/
├─ migrations/0001_init.sql     ← schema + RLS
└─ seed.sql                     ← demo org + 40 leads
types/index.ts                  ← TS types for every entity
```

## 🛣️ Roadmap (good first extensions)

- Connect a real telephony provider (Twilio Voice / RingCentral) for click-to-call + auto-log.
- Supabase Realtime channel so two callers can't dial the same lead simultaneously.
- Stripe billing for SaaS multi-tenancy.
- Email sequences in `app/api/sequences/` against Resend or Postmark.
- A11y audit pass via `design:accessibility-review`.

---

Built with care. Open `/dashboard` and ship some deals.
