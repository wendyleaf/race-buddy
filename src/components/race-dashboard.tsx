"use client"

import { useMemo, useState } from "react"
import { RaceCard } from "@/components/race-card"
import { RaceMap } from "@/components/race-map"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Race } from "@/types/race"

const ALL = "All"

interface RaceDashboardProps {
  initialRaces: Race[]
}

export function RaceDashboard({ initialRaces }: RaceDashboardProps) {
  const [races, setRaces] = useState<Race[]>(initialRaces)
  const [countryFilter, setCountryFilter] = useState<string>(ALL)
  const [focusedLocation, setFocusedLocation] = useState<{
    latitude: number
    longitude: number
  } | null>(null)

  const countries = useMemo(() => {
    const unique = new Set<string>()
    races.forEach((r) => {
      if (r.country) unique.add(r.country)
    })
    return Array.from(unique).sort()
  }, [races])

  const filteredRaces =
    countryFilter === ALL
      ? races
      : races.filter((r) => r.country === countryFilter)

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
            <div className="flex flex-col gap-3 px-6 py-4">
              <h1 className="text-xl font-semibold text-zinc-900">Race Finder</h1>
              {countries.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-600">Country:</span>
                  <Select value={countryFilter} onValueChange={setCountryFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>All countries</SelectItem>
                      {countries.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </header>
          <RaceList races={filteredRaces} onRaceSelect={handleRaceSelect} />
        </div>
      </div>
      <div className="hidden flex-1 md:block">
        <RaceMap
          races={filteredRaces}
          focusedLocation={focusedLocation}
          onRaceAdded={handleRaceAdded}
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
        <p className="text-sm text-zinc-500">No races match this filter.</p>
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-6 px-6 py-6 md:grid-cols-2 lg:grid-cols-3">
      {races.map((race) => (
        <div key={race.id} onClick={() => onRaceSelect(race)}>
          <RaceCard race={race} />
        </div>
      ))}
    </div>
  )
}
