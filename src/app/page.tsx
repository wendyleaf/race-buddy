import { RaceDashboard } from "@/components/race-dashboard"
import { createServerClient } from "@/lib/supabase"

export const revalidate = 60

export default async function Home() {
  const supabase = createServerClient()

  const [racesResult, countriesResult, subdivisionsResult] = await Promise.all([
    supabase
      .from("races")
      .select(
        "id, name, date, location, country, distance, description, website_url, latitude, longitude"
      )
      .order("date", { ascending: true }),
    supabase
      .from("iso_countries")
      .select("alpha2, name")
      .order("name", { ascending: true }),
    supabase
      .from("iso_us_subdivisions")
      .select("code, name")
      .order("name", { ascending: true }),
  ])

  if (racesResult.error) console.error("Failed to load races", racesResult.error)
  if (countriesResult.error) console.error("Failed to load countries", countriesResult.error)
  if (subdivisionsResult.error) console.error("Failed to load subdivisions", subdivisionsResult.error)

  return (
    <RaceDashboard
      initialRaces={racesResult.data ?? []}
      countries={countriesResult.data ?? []}
      usSubdivisions={subdivisionsResult.data ?? []}
    />
  )
}
