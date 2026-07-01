import Link from "next/link"
import { ArrowRight, Flag, MapPin, Plus, Target } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DiaryEntryCard } from "@/components/diary"
import { SetupNotice } from "@/components/setup-notice"
import { WorkoutRow } from "@/components/workout-row"
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase"
import {
  currentBuildWeek,
  daysUntil,
  formatDate,
  startOfWeek,
  todayString,
  totalBuildWeeks,
} from "@/lib/dates"
import { DiaryEntry, Race, Workout } from "@/types"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) return <SetupNotice />

  const supabase = createServerClient()
  const today = todayString()

  const { data: races, error: racesError } = await supabase
    .from("races")
    .select(
      "id, name, race_date, distance, location, goal, race_url, notes, result_time, result_notes"
    )
    .order("race_date", { ascending: true })

  if (racesError) console.error("Failed to load races", racesError)

  const allRaces: Race[] = races ?? []
  const upcomingRaces = allRaces.filter((race) => race.race_date >= today)
  const nextRace = upcomingRaces[0] ?? null

  let workouts: Workout[] = []
  if (nextRace) {
    const { data, error } = await supabase
      .from("workouts")
      .select(
        "id, race_id, workout_date, type, title, planned_miles, description, status, actual_miles, execution_rating, log_notes, completed_at"
      )
      .eq("race_id", nextRace.id)
      .order("workout_date", { ascending: true })
    if (error) console.error("Failed to load workouts", error)
    workouts = data ?? []
  }

  const { data: entries, error: entriesError } = await supabase
    .from("diary_entries")
    .select("id, race_id, entry_date, title, body, mood, created_at, races(name)")
    .order("entry_date", { ascending: false })
    .limit(3)
  if (entriesError) console.error("Failed to load diary entries", entriesError)

  const recentEntries = (entries ?? []) as unknown as DiaryEntry[]

  if (allRaces.length === 0) {
    return (
      <div className="mx-auto mt-16 max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-bold text-zinc-900">
          Welcome to Race Buddy
        </h1>
        <p className="text-sm text-zinc-600">
          Add your next race to start planning the build, tracking logistics,
          and keeping your running diary.
        </p>
        <Button asChild>
          <Link href="/races/new">
            <Plus /> Add your first race
          </Link>
        </Button>
      </div>
    )
  }

  const thisWeekStart = startOfWeek(today)
  const thisWeekWorkouts = workouts.filter(
    (workout) => startOfWeek(workout.workout_date) === thisWeekStart
  )
  const weekPlanned = thisWeekWorkouts.reduce(
    (sum, w) => sum + (w.planned_miles ?? 0),
    0
  )
  const weekActual = thisWeekWorkouts
    .filter((w) => w.status === "completed")
    .reduce((sum, w) => sum + (w.actual_miles ?? w.planned_miles ?? 0), 0)

  return (
    <div className="space-y-6">
      {nextRace ? (
        <Card className="gap-4">
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/races/${nextRace.id}`}
                  className="text-xl font-bold text-zinc-900 hover:underline"
                >
                  {nextRace.name}
                </Link>
                {nextRace.distance && <Badge>{nextRace.distance}</Badge>}
              </div>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-600">
                <span>{formatDate(nextRace.race_date)}</span>
                {nextRace.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5" /> {nextRace.location}
                  </span>
                )}
                {nextRace.goal && (
                  <span className="flex items-center gap-1">
                    <Target className="size-3.5" /> {nextRace.goal}
                  </span>
                )}
              </p>
              {workouts.length > 0 && (
                <p className="text-sm text-zinc-600">
                  Build week{" "}
                  <span className="font-semibold text-zinc-900">
                    {currentBuildWeek(workouts, nextRace.race_date)} of{" "}
                    {totalBuildWeeks(workouts, nextRace.race_date)}
                  </span>
                </p>
              )}
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold tabular-nums text-zinc-900">
                {daysUntil(nextRace.race_date)}
              </p>
              <p className="text-xs tracking-wide text-zinc-500 uppercase">
                days to go
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-zinc-600">
              No upcoming races — time to pick the next one.
            </p>
            <Button asChild size="sm">
              <Link href="/races/new">
                <Plus /> Add a race
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {nextRace && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-zinc-900">This week</h2>
            {thisWeekWorkouts.length > 0 && (
              <span className="text-sm tabular-nums text-zinc-500">
                {Math.round(weekActual * 10) / 10} /{" "}
                {Math.round(weekPlanned * 10) / 10} mi
              </span>
            )}
          </div>
          {thisWeekWorkouts.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Nothing planned this week.{" "}
              <Link
                href={`/races/${nextRace.id}`}
                className="text-blue-600 hover:underline"
              >
                Add workouts to the build
              </Link>
              .
            </p>
          ) : (
            <div className="space-y-1.5">
              {thisWeekWorkouts.map((workout) => (
                <WorkoutRow key={workout.id} workout={workout} />
              ))}
            </div>
          )}
        </section>
      )}

      {upcomingRaces.length > 1 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-zinc-900">Also on the calendar</h2>
          <div className="space-y-1.5">
            {upcomingRaces.slice(1).map((race) => (
              <Link
                key={race.id}
                href={`/races/${race.id}`}
                className="flex items-center gap-3 rounded-lg border bg-white px-3 py-2.5 text-sm hover:bg-zinc-50"
              >
                <Flag className="size-4 text-zinc-400" />
                <span className="font-medium text-zinc-800">{race.name}</span>
                <span className="text-zinc-500">
                  {formatDate(race.race_date)}
                </span>
                <span className="ml-auto text-zinc-500">
                  in {daysUntil(race.race_date)} days
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-zinc-900">Recent diary entries</h2>
          <Link
            href="/diary"
            className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            All entries <ArrowRight className="size-3.5" />
          </Link>
        </div>
        {recentEntries.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No entries yet — your running diary lives{" "}
            <Link href="/diary" className="text-blue-600 hover:underline">
              here
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-3">
            {recentEntries.map((entry) => (
              <DiaryEntryCard key={entry.id} entry={entry} showRace />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
