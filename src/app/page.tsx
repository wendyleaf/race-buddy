import { RaceDashboard } from "@/components/race-dashboard"
import { createServerClient } from "@/lib/supabase"

export default async function Home() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("races")
    .select(
      "id, name, date, location, country, distance, type, description, image_url, latitude, longitude"
    )
    .order("date", { ascending: true })

  if (error) {
    console.error("Failed to load races", error)
  }

  const races = data ?? []

  return <RaceDashboard initialRaces={races} />
}
