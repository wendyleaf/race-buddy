-- Race Buddy schema — personal race build tracker & running diary
--
-- Run this against your Supabase project (Dashboard → SQL Editor).
-- NOTE: this replaces the old race-discovery schema. If you're migrating
-- from the previous version of the app, drop the old table first:
--   drop table if exists races cascade;

create extension if not exists "pgcrypto";

-- Shared updated_at trigger
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- races: the target events you're training for
-- ---------------------------------------------------------------------------
create table if not exists races (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  race_date date not null,
  distance text,                -- e.g. "Marathon", "Half Marathon", "10K"
  location text,
  goal text,                    -- e.g. "Sub 3:45", "Negative split"
  race_url text,                -- official race page
  notes text,
  result_time text,             -- filled in after race day, e.g. "3:42:17"
  result_notes text,            -- post-race reflection
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists races_updated_at on races;
create trigger races_updated_at
  before update on races
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- workouts: the planned (and logged) runs that make up a race build
-- ---------------------------------------------------------------------------
create table if not exists workouts (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references races(id) on delete cascade,
  workout_date date not null,
  type text not null default 'easy',      -- easy|long|tempo|intervals|race_pace|cross|rest
  title text,                             -- e.g. "6 x 800m @ 5K pace"
  planned_miles numeric(5,1),
  description text,                       -- the plan detail
  status text not null default 'planned', -- planned|completed|skipped
  actual_miles numeric(5,1),
  execution_rating smallint check (execution_rating between 1 and 5),
  log_notes text,                         -- how it actually went
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workouts_race_date_idx on workouts (race_id, workout_date);

drop trigger if exists workouts_updated_at on workouts;
create trigger workouts_updated_at
  before update on workouts
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- logistics_items: everything around the race itself
-- (hotel, travel, expo/packet pickup, race-weekend schedule, gear checklist)
-- ---------------------------------------------------------------------------
create table if not exists logistics_items (
  id uuid primary key default gen_random_uuid(),
  race_id uuid not null references races(id) on delete cascade,
  category text not null default 'other', -- hotel|travel|expo|schedule|gear|other
  title text not null,
  details text,
  item_date timestamptz,                  -- e.g. check-in time, flight departure
  url text,                               -- booking confirmation, expo page, etc.
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists logistics_items_race_idx on logistics_items (race_id, category);

-- ---------------------------------------------------------------------------
-- diary_entries: the running diary — tied to a race build or standalone
-- ---------------------------------------------------------------------------
create table if not exists diary_entries (
  id uuid primary key default gen_random_uuid(),
  race_id uuid references races(id) on delete set null,
  entry_date date not null default current_date,
  title text,
  body text not null,
  mood text,                              -- strong|good|ok|tired|rough
  created_at timestamptz not null default now()
);

create index if not exists diary_entries_date_idx on diary_entries (entry_date desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- This is a single-user personal tool: reads use the anon key, writes go
-- through API routes using the service-role key (which bypasses RLS).
-- ---------------------------------------------------------------------------
alter table races enable row level security;
alter table workouts enable row level security;
alter table logistics_items enable row level security;
alter table diary_entries enable row level security;

drop policy if exists "public read races" on races;
create policy "public read races" on races for select using (true);

drop policy if exists "public read workouts" on workouts;
create policy "public read workouts" on workouts for select using (true);

drop policy if exists "public read logistics" on logistics_items;
create policy "public read logistics" on logistics_items for select using (true);

drop policy if exists "public read diary" on diary_entries;
create policy "public read diary" on diary_entries for select using (true);
