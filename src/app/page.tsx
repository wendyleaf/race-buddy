import { RaceCard } from "@/components/race-card"
import { RaceMap } from "@/components/race-map"
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

  return (
    <div className="flex h-screen flex-col bg-zinc-50 md:flex-row">
      <div className="w-full border-b bg-zinc-50 md:w-1/2 md:border-b-0 md:border-r lg:w-[40%]">
        <div className="h-screen overflow-y-auto">
          <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
            <div className="flex items-center px-6 py-4">
              <h1 className="text-xl font-semibold text-zinc-900">
                Race Finder
              </h1>
            </div>
          </header>
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {races.map((race) => (
                <RaceCard key={race.id} race={race} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="hidden flex-1 md:block">
        <RaceMap races={races} />
      </div>
    </div>
  )
}
