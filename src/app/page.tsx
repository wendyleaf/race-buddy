import { RaceCard } from "@/components/race-card"
import { createServerClient } from "@/lib/supabase"

export default async function Home() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("races")
    .select("id, name, date, location, country, distance, type, description, image_url")
    .order("date", { ascending: true })

  if (error) {
    console.error("Failed to load races", error)
  }

  const races = data ?? []

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center px-6 py-4">
          <h1 className="text-xl font-semibold text-zinc-900">Race Finder</h1>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {races.map((race) => (
            <RaceCard key={race.id} race={race} />
          ))}
        </div>
      </main>
    </div>
  )
}
