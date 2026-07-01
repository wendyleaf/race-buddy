import { DiaryEntryCard, DiaryEntryForm } from "@/components/diary"
import { SetupNotice } from "@/components/setup-notice"
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase"
import { DiaryEntry } from "@/types"

export const dynamic = "force-dynamic"

export default async function DiaryPage() {
  if (!isSupabaseConfigured()) return <SetupNotice />

  const supabase = createServerClient()

  const [entriesResult, racesResult] = await Promise.all([
    supabase
      .from("diary_entries")
      .select("id, race_id, entry_date, title, body, mood, created_at, races(name)")
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("races")
      .select("id, name")
      .order("race_date", { ascending: false }),
  ])

  if (entriesResult.error)
    console.error("Failed to load diary entries", entriesResult.error)

  const entries = (entriesResult.data ?? []) as unknown as DiaryEntry[]
  const races = racesResult.data ?? []

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-xl font-bold text-zinc-900">Running Diary</h1>
      <DiaryEntryForm races={races} />

      {entries.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Nothing here yet. This is your running diary — how training feels,
          niggles you&apos;re watching, fueling experiments, race-week nerves.
        </p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <DiaryEntryCard key={entry.id} entry={entry} showRace />
          ))}
        </div>
      )}
    </div>
  )
}
