import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  Pencil,
  Target,
  Trophy,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RaceDetailTabs } from "@/components/race-detail-tabs"
import { SetupNotice } from "@/components/setup-notice"
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase"
import { daysUntil, formatDate } from "@/lib/dates"
import { DiaryEntry, LogisticsItem, Race, Workout } from "@/types"

export const dynamic = "force-dynamic"

export default async function RaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  if (!isSupabaseConfigured()) return <SetupNotice />

  const { id } = await params
  const supabase = createServerClient()

  const { data: race } = await supabase
    .from("races")
    .select(
      "id, name, race_date, distance, location, goal, race_url, notes, result_time, result_notes"
    )
    .eq("id", id)
    .maybeSingle<Race>()

  if (!race) notFound()

  const [workoutsResult, logisticsResult, entriesResult] = await Promise.all([
    supabase
      .from("workouts")
      .select(
        "id, race_id, workout_date, type, title, planned_miles, description, status, actual_miles, execution_rating, log_notes, completed_at"
      )
      .eq("race_id", id)
      .order("workout_date", { ascending: true }),
    supabase
      .from("logistics_items")
      .select("id, race_id, category, title, details, item_date, url, done")
      .eq("race_id", id)
      .order("item_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true }),
    supabase
      .from("diary_entries")
      .select("id, race_id, entry_date, title, body, mood, created_at")
      .eq("race_id", id)
      .order("entry_date", { ascending: false }),
  ])

  const workouts = (workoutsResult.data ?? []) as Workout[]
  const logistics = (logisticsResult.data ?? []) as LogisticsItem[]
  const entries = (entriesResult.data ?? []) as DiaryEntry[]

  const countdown = daysUntil(race.race_date)
  const isPast = countdown < 0

  return (
    <div className="space-y-5">
      <Link
        href="/races"
        className="flex w-fit items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800"
      >
        <ArrowLeft className="size-3.5" /> All races
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-900">{race.name}</h1>
            {race.distance && <Badge>{race.distance}</Badge>}
          </div>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-600">
            <span className="font-medium">
              {formatDate(race.race_date)}
              {!isPast && (
                <span className="ml-1.5 text-emerald-700">
                  · {countdown} days to go
                </span>
              )}
            </span>
            {race.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" /> {race.location}
              </span>
            )}
            {race.goal && (
              <span className="flex items-center gap-1">
                <Target className="size-3.5" /> Goal: {race.goal}
              </span>
            )}
            {race.race_url && (
              <a
                href={race.race_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:underline"
              >
                <ExternalLink className="size-3.5" /> Race page
              </a>
            )}
          </p>
          {isPast && race.result_time && (
            <p className="flex items-center gap-1.5 text-sm font-medium text-zinc-800">
              <Trophy className="size-4 text-amber-500" /> Finished in{" "}
              {race.result_time}
            </p>
          )}
          {race.notes && (
            <p className="max-w-2xl text-sm whitespace-pre-wrap text-zinc-500">
              {race.notes}
            </p>
          )}
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/races/${race.id}/edit`}>
            <Pencil /> Edit race
          </Link>
        </Button>
      </header>

      {isPast && race.result_notes && (
        <div className="rounded-lg border bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-900">Race report</h2>
          <p className="mt-1 text-sm whitespace-pre-wrap text-zinc-700">
            {race.result_notes}
          </p>
        </div>
      )}

      <RaceDetailTabs
        race={race}
        workouts={workouts}
        logistics={logistics}
        entries={entries}
      />
    </div>
  )
}
