"use client"

import { useState } from "react"
import { RaceCard } from "@/components/race-card"
import { RaceMap } from "@/components/race-map"
import { Race } from "@/types/race"

interface Country { alpha2: string; name: string }
interface Subdivision { code: string; name: string }

interface RaceDashboardProps {
  initialRaces: Race[]
  countries: Country[]
  usSubdivisions: Subdivision[]
}

export function RaceDashboard({ initialRaces, countries, usSubdivisions }: RaceDashboardProps) {
  const [races, setRaces] = useState<Race[]>(initialRaces)
  const [focusedLocation, setFocusedLocation] = useState<{
    latitude: number
    longitude: number
  } | null>(null)

  function handleRaceSelect(race: Race) {
    if (race.latitude && race.longitude) {
      setFocusedLocation({ latitude: race.latitude, longitude: race.longitude })
    }
  }

  function handleRaceAdded(race: Race) {
    setRaces((prev) => [...prev, race])
    if (race.latitude && race.longitude) {
      setFocusedLocation({ latitude: race.latitude, longitude: race.longitude })
    }
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-50 md:flex-row">
      <div className="w-full border-b bg-zinc-50 md:w-1/2 md:border-b-0 md:border-r lg:w-[40%]">
        <div className="h-screen overflow-y-auto">
          <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
            <div className="px-6 py-4">
              <h1 className="text-xl font-semibold text-zinc-900">Race Finder</h1>
            </div>
          </header>
          <RaceList races={races} onRaceSelect={handleRaceSelect} />
        </div>
      </div>
      <div className="hidden flex-1 md:block">
        <RaceMap
          races={races}
          focusedLocation={focusedLocation}
          onRaceAdded={handleRaceAdded}
          countries={countries}
          usSubdivisions={usSubdivisions}
        />
      </div>
    </div>
  )
}

function RaceList({
  races,
  onRaceSelect,
}: {
  races: Race[]
  onRaceSelect: (race: Race) => void
}) {
  if (races.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-sm text-zinc-500">No races found yet. Use the Discover bar on the map to add some!</p>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-3 px-6 py-6">
      {races.map((race) => (
        <div key={race.id} onClick={() => onRaceSelect(race)}>
          <RaceCard race={race} />
        </div>
      ))}
    </div>
  )
}
