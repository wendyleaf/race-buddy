import { RaceForm } from "@/components/race-form"
import { SetupNotice } from "@/components/setup-notice"
import { isSupabaseConfigured } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export default function NewRacePage() {
  if (!isSupabaseConfigured()) return <SetupNotice />

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-bold text-zinc-900">Add a race</h1>
      <RaceForm />
    </div>
  )
}
