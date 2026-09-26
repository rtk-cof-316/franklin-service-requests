# Franklin Service Request System

A web application for the City of Franklin, New Hampshire that lets residents report problems (potholes, code violations, trash complaints, Right-to-Know/RSA 91-A records requests, and more) and lets city staff track, route, and resolve them. It also runs three related civic workflows: a **Public Comment** module for structured resident input ahead of City Council hearings, an **MOU** module for reviewing Memoranda of Understanding with outside organizations, and a **CAR (Council Agenda Report)** module for building City Council meeting agendas/packets.

Live site: **https://franklin-service-requests-39a5.vercel.app**

For the full technical writeup (schema, module internals, routing logic), see [ARCHITECTURE.md](ARCHITECTURE.md). For a non-technical walkthrough of every screen an administrator or department user will actually use, see [ADMIN_USER_GUIDE.md](ADMIN_USER_GUIDE.md). For recurring upkeep tasks, see [MAINTENANCE.md](MAINTENANCE.md).

## Who it's for

- **Residents (the public)** — no login. Submit a request, check the status of one they already made, browse a live map of road issues and vote on repair priorities, view city-wide statistics, or weigh in on an open Public Comment topic.
- **Department staff** — log in to see and work only the cases assigned to their own department (MSD, Fire/Code, PZ, Assessing, Police/Prosecutor, Finance, Human Resources, Legal, Parks & Rec, IT, or City Manager).
- **Admin (the City Manager's Office)** — sees every case city-wide, manages department routing, moderates Public Comment, and reviews escalated cases. Currently one person, Brenda Demers.
- **Outside organizations** — no login; use a PIN-protected submission number to submit and track an MOU with the City.

> **CAR (Council Agenda Report) module — retired 2026-09-26.** The app also contains a fifth workflow for building City Council meeting agendas from department heads' reports. It's been hidden from every entry point (public nav, the homepage, and the CAR-admin nav button) via a single flag, but the code, database tables, and the one real historical submission/meeting cycle are all untouched — see [ARCHITECTURE.md §9](ARCHITECTURE.md#9-car-council-agenda-report-module-retired) for how to bring it back if it's ever needed again.

## Tech stack

| Piece | Role |
|---|---|
| [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/) | The frontend — one single-page app, no router library (page navigation is a plain `page` string in React state, optionally seeded from a `?page=` URL query param) |
| [Supabase](https://supabase.com/) | Postgres database, authentication, file storage, and server-side logic ("Edge Functions", written in Deno/TypeScript) |
| [Vercel](https://vercel.com/) | Hosts the built site and runs the one daily scheduled job (Vercel Cron) |
| [Brevo](https://www.brevo.com/) | Sends every transactional email (confirmations, referral notices, reminders, escalations, MOU/CAR notifications) |
| [docx](https://www.npmjs.com/package/docx) | Generates the one true `.docx` export in the app (a CAR submission's Word copy) — everything else that looks like a PDF export is actually the browser's native "Print to PDF," not a real PDF library |
| [Leaflet](https://leafletjs.com/) / react-leaflet | The map on the public Road Watch page |

## Running it locally

**Prerequisites:** Node.js, and access to the project's Supabase credentials.

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env.local` file in the project root (this file is gitignored — never commit it) with:
   ```
   VITE_SUPABASE_URL=https://sdibtkmmcegthmytmzvy.supabase.co
   VITE_SUPABASE_ANON_KEY=<the project's anon/public key>
   ```
   Get both values from the Supabase dashboard → Project Settings → API. These are the only two variables the app actually reads at runtime (see [ARCHITECTURE.md](ARCHITECTURE.md) for a note on a third, unused legacy variable that sometimes appears in this file).
3. Start the dev server:
   ```bash
   npm run dev
   ```
   Vite prints a local URL (typically `http://localhost:5173`).
4. Other available scripts:
   ```bash
   npm run build     # production build to dist/
   npm run preview   # locally preview a production build
   npm run lint       # ESLint
   ```

Running locally against the **live production Supabase project** means you're reading and writing real city data — there is no separate staging database. Be careful with anything that inserts, updates, or deletes rows while developing (this project's own convention, used throughout its history, is to do risky testing through a *temporary* Supabase Edge Function deployed and deleted in the same session, rather than clicking through the live UI with real data).

Editing server-side logic (Edge Functions) or the database schema (migrations) requires the [Supabase CLI](https://supabase.com/docs/guides/cli) and is a separate, manual deploy step — see below.

## Deployment

**Frontend (this repo → Vercel):** fully automatic. Any push to `main` on GitHub (`github.com/rtk-cof-316/franklin-service-requests`) triggers a Vercel build; a successful build goes live at the URL above within about a minute. A failed build leaves the previous version live — it cannot take the site down.

**Database & Edge Functions (this repo → Supabase):** *not* automatic. Migrations (`supabase/migrations/*.sql`) and Edge Functions (`supabase/functions/*/index.ts`) have to be pushed manually with the Supabase CLI, e.g.:
```bash
npx supabase db push
npx supabase functions deploy <function-name>
```
Pushing code to GitHub does not, by itself, change anything in the database or in any Edge Function — those are separate actions a developer has to remember to do.

**The one scheduled job:** Vercel Cron calls `/api/daily-case-check` once a day (`vercel.json`), which is a thin relay to the real logic in the Supabase `daily-case-check` Edge Function — see [ARCHITECTURE.md](ARCHITECTURE.md) for what that job actually does.

## Further reading

- [ARCHITECTURE.md](ARCHITECTURE.md) — schema, folder structure, routing engine, RSA 91-A/tax calculation, Public Comment, MOU, and CAR module internals. Start here before making any code change.
- [ADMIN_USER_GUIDE.md](ADMIN_USER_GUIDE.md) — a plain-language walkthrough of every screen, button, and workflow, written for a non-technical administrator.
- [MAINTENANCE.md](MAINTENANCE.md) — what needs periodic attention, and known fragile spots.
