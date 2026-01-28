"use client"

import { useState } from "react"
import { RaceCard } from "@/components/race-card"
import { RaceMap } from "@/components/race-map"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function RaceDashboard({ initialRaces }: RaceDashboardProps) {
  const [races, setRaces] = useState<Race[]>(initialRaces)
  const [filter, setFilter] = useState<FilterType>("All")

  // Filter races based on the selected filter
  const filteredRaces = races.filter((race) => {
    if (filter === "All") return true
    if (filter === "Marathon") {
      return race.distance?.toLowerCase().includes("marathon") &&
        !race.distance?.toLowerCase().includes("half") &&
        !race.distance?.toLowerCase().includes("ultra")
    }
    if (filter === "Half") {
      return race.distance?.toLowerCase().includes("half")
    }
    if (filter === "Ultra") {
      return race.distance?.toLowerCase().includes("ultra")
    }
    return true
  })

  function handleRaceSelect(race: Race) {
    console.log("Selected race ID:", race.id)
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-50 md:flex-row">
      <div className="w-full border-b bg-zinc-50 md:w-1/2 md:border-b-0 md:border-r lg:w-[40%]">
        <div className="h-screen overflow-y-auto">
          <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
            <div className="flex flex-col gap-3 px-6 py-4">
              <h1 className="text-xl font-semibold text-zinc-900">
                Race Finder
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-600">Filter by:</span>
                <Select value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select distance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Races</SelectItem>
                    <SelectItem value="Marathon">Marathon</SelectItem>
                    <SelectItem value="Half">Half Marathon</SelectItem>
                    <SelectItem value="Ultra">Ultra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </header>
          <RaceList races={filteredRaces} onRaceSelect={handleRaceSelect} />
        </div>
      </div>
      <div className="hidden flex-1 md:block">
        <RaceMap races={filteredRaces} />
      </div>
    </div>
  )
}

function RaceList({ races, onRaceSelect }: RaceListProps) {
  return (
    <div className="px-6 py-6">
      {races.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-zinc-500">No races found matching your filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {races.map((race) => (
            <div key={race.id} onClick={() => onRaceSelect(race)}>
              <RaceCard race={race} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

type FilterType = "All" | "Marathon" | "Half" | "Ultra"

interface RaceDashboardProps {
  initialRaces: Race[]
}

interface RaceListProps {
  races: Race[]
  onRaceSelect: (race: Race) => void
}

interface Race {
  id: string | number
  name: string
  date: string
  location: string
  country: string | null
  distance: string | null
  type: string | null
  description: string | null
  image_url: string | null
  latitude: number | null
  longitude: number | null
}
