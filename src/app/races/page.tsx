import Link from "next/link"
import { MapPin, Plus, Target, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SetupNotice } from "@/components/setup-notice"
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase"
import { daysUntil, formatDate, todayString } from "@/lib/dates"
import { Race } from "@/types"

export const dynamic = "force-dynamic"

type RaceWithCounts = Race & { workouts: { count: number }[] }

export default async function RacesPage() {
  if (!isSupabaseConfigured()) return <SetupNotice />

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("races")
    .select(
      "id, name, race_date, distance, location, goal, race_url, notes, result_time, result_notes, workouts(count)"
    )
    .order("race_date", { ascending: true })

  if (error) console.error("Failed to load races", error)

  const races = (data ?? []) as RaceWithCounts[]
  const today = todayString()
  const upcoming = races.filter((race) => race.race_date >= today)
  const past = races
    .filter((race) => race.race_date < today)
    .sort((a, b) => b.race_date.localeCompare(a.race_date))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900">Races</h1>
        <Button asChild size="sm">
          <Link href="/races/new">
            <Plus /> Add race
          </Link>
        </Button>
      </div>

      {races.length === 0 && (
        <p className="text-sm text-zinc-500">
          No races yet. Add your next target race to start a build.
        </p>
      )}

      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wide text-zinc-500 uppercase">
            Upcoming
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {upcoming.map((race) => (
              <RaceListCard key={race.id} race={race} isUpcoming />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wide text-zinc-500 uppercase">
            Completed
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {past.map((race) => (
              <RaceListCard key={race.id} race={race} isUpcoming={false} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function RaceListCard({
  race,
  isUpcoming,
}: {
  race: RaceWithCounts
  isUpcoming: boolean
}) {
  const workoutCount = race.workouts?.[0]?.count ?? 0

  return (
    <Link
      href={`/races/${race.id}`}
      className="block rounded-xl border bg-white p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-zinc-900">{race.name}</h3>
        {race.distance && <Badge variant="secondary">{race.distance}</Badge>}
      </div>
      <p className="mt-1 text-sm text-zinc-600">
        {formatDate(race.race_date)}
        {isUpcoming && (
          <span className="ml-2 font-medium text-emerald-700">
            in {daysUntil(race.race_date)} days
          </span>
        )}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500">
        {race.location && (
          <span className="flex items-center gap-1">
            <MapPin className="size-3.5" /> {race.location}
          </span>
        )}
        {isUpcoming && race.goal && (
          <span className="flex items-center gap-1">
            <Target className="size-3.5" /> {race.goal}
          </span>
        )}
        {!isUpcoming && race.result_time && (
          <span className="flex items-center gap-1 font-medium text-zinc-700">
            <Trophy className="size-3.5 text-amber-500" /> {race.result_time}
          </span>
        )}
      </div>
      <p className="mt-2 text-xs text-zinc-400">
        {workoutCount > 0
          ? `${workoutCount} workout${workoutCount === 1 ? "" : "s"} in build`
          : "No build yet"}
      </p>
    </Link>
  )
}
