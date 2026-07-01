import { notFound } from "next/navigation"
import { RaceForm } from "@/components/race-form"
import { SetupNotice } from "@/components/setup-notice"
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase"
import { Race } from "@/types"

export const dynamic = "force-dynamic"

export default async function EditRacePage({
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

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-bold text-zinc-900">Edit {race.name}</h1>
      <RaceForm race={race} />
    </div>
  )
}
