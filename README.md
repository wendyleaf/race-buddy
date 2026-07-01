# Race Buddy

A personal race build tracker and running diary. Plan the training block for
each race, log how every workout actually went, keep all the race-weekend
logistics in one place, and journal the build as you go.

## Why

Strava and Garmin record your runs, but they don't track your *build*: whether
you completed what the plan called for, whether you executed it well, and how
the plan needs to shift as life happens. Race Buddy is the layer on top —
a living training plan plus a running diary.

## What It Does

- **Races** — Track the races you're targeting: date, distance, location,
  goal, official race page, and (afterwards) your result and race report.
- **Builds** — Sketch the workouts of a training block week by week. Each
  workout has a type (easy, long, tempo, intervals, race pace, cross, rest),
  planned mileage, and plan details.
- **Logging** — Mark each workout completed or skipped, record actual miles,
  rate your execution (1–5), and note how it went. Weekly planned-vs-actual
  mileage rolls up automatically.
- **Evolving plans** — Edit, reschedule, or delete workouts at any time; the
  plan is meant to change as the build unfolds.
- **Logistics** — Per-race checklist for hotel, travel, expo & packet pickup,
  race-weekend schedule, and gear, with dates, links, and done states.
- **Diary** — Free-form journal entries with mood, either tied to a race
  build or standalone. The dashboard surfaces recent entries.
- **Dashboard** — Countdown to your next race, current build week, and this
  week's workouts with inline logging.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router) with React 19
- **Styling:** Tailwind CSS, Shadcn UI / Radix UI
- **Database:** [Supabase](https://supabase.com/) (PostgreSQL, RLS)

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [npm](https://www.npmjs.com/)
- A [Supabase](https://supabase.com/) project

### 1. Clone and install

```bash
git clone <repository-url>
cd race-buddy
npm install
```

### 2. Environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Get these values from your [Supabase Dashboard](https://app.supabase.com/) →
Project Settings → API. The service role key is used server-side for writes
(RLS allows public reads only).

### 3. Supabase database

Run `supabase-migrations.sql` against your Supabase project (SQL Editor in
the Supabase Dashboard). It creates the `races`, `workouts`,
`logistics_items`, and `diary_entries` tables.

> Migrating from the old race-discovery version of this app? Drop the old
> `races` table first — see the note at the top of the migration file.

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Other scripts

- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — Run ESLint

## Project Structure

```
race-buddy/
├── src/
│   ├── app/                # App Router pages
│   │   ├── page.tsx        # Dashboard
│   │   ├── races/          # Race list, detail (build/logistics/journal), new/edit
│   │   ├── diary/          # Running diary
│   │   └── api/[resource]/ # Generic CRUD mutation routes
│   ├── components/         # Feature components + ui/ primitives
│   ├── lib/                # Supabase client, dates, constants, resource allowlist
│   └── types/              # Shared TypeScript types
└── supabase-migrations.sql # Database schema
```

## License

Private project.
