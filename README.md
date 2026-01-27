# Race Buddy

A web app that scrapes the web for major international road running races and presents them to users in a clean, easy-to-navigate way.

## What It Does

Race Buddy helps runners discover, track, and plan for major road races around the world. The app aggregates race data from the web and surfaces it through an intuitive interface.

### Core Features (Planned)

- **Browse races** — Discover major international road running events in one place
- **Filter by attributes** — Narrow results by distance (5K, 10K, half-marathon, marathon), date, location, or other race attributes
- **Map view** — View races on a map for easier geographic discovery
- **Race links** — Navigate directly to official race sites from the app
- **Accounts & auth** — Create an account and sign in to unlock personalized features
- **Save races** — Bookmark races you’re interested in
- **Race alerts** — Set alerts (e.g. registration opens, price changes) for specific races
- **Race collection** — Track and “collect” races you’ve completed

---

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router) with React 19
- **Styling:** Tailwind CSS, Shadcn UI / Radix UI
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL, auth, RLS)

---

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
```

Get these values from your [Supabase Dashboard](https://app.supabase.com/) → Project Settings → API.

### 3. Supabase database

Run the migrations in `supabase-migrations.sql` against your Supabase project (e.g. via the SQL Editor in the Supabase Dashboard) to create the `races` table and related triggers/policies.

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Other scripts

- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — Run ESLint

---

## Project Structure

```
race-buddy/
├── src/
│   ├── app/           # Next.js App Router (pages, API routes, layout)
│   └── lib/           # Supabase client, utilities
├── public/            # Static assets
├── scripts/           # Utility scripts (e.g. Supabase connection tests)
└── supabase-migrations.sql
```

---

## License

Private project.
