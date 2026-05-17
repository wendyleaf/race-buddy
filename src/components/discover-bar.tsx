"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DiscoveredRace, Race } from "@/types/race"

const US_COUNTRY_NAME = "United States of America"

interface DiscoverBarProps {
  onRaceAdded: (race: Race) => void
  countries: { alpha2: string; name: string }[]
  usSubdivisions: { code: string; name: string }[]
}

export function DiscoverBar({ onRaceAdded, countries, usSubdivisions }: DiscoverBarProps) {
  const [country, setCountry] = useState("")
  const [state, setState] = useState("")
  const [month, setMonth] = useState("")
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [result, setResult] = useState<DiscoveredRace | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isUS = country === US_COUNTRY_NAME

  function handleCountryChange(value: string) {
    setCountry(value)
    setState("")
  }

  async function handleDiscover() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch("/api/discover-race", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, state: isUS ? state : undefined, month }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Discovery failed")
      } else {
        setResult(data.race)
      }
    } catch {
      setError("Discovery failed")
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    if (!result) return
    setAdding(true)
    setError(null)
    try {
      const res = await fetch("/api/add-race", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: result.name,
          date: result.date,
          location: result.location,
          country: result.country,
          distance: result.distance,
          certification: result.certification,
          website_url: result.source_url,
          latitude: result.latitude,
          longitude: result.longitude,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Add failed")
      } else {
        onRaceAdded(data.race)
        setResult(null)
      }
    } catch {
      setError("Add failed")
    } finally {
      setAdding(false)
    }
  }

  function handleDismiss() {
    setResult(null)
    setError(null)
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col items-center px-4 pt-4">
      <div className="pointer-events-auto flex w-full max-w-2xl items-center gap-2 rounded-lg bg-white/95 p-3 shadow-lg backdrop-blur">
        <Select value={country} onValueChange={handleCountryChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a country" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((c) => (
              <SelectItem key={c.alpha2} value={c.name}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isUS && (
          <Select value={state} onValueChange={setState}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Any state" />
            </SelectTrigger>
            <SelectContent>
              {usSubdivisions.map((s) => (
                <SelectItem key={s.code} value={s.name}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm outline-none focus:border-zinc-400"
        />
        <Button onClick={handleDiscover} disabled={loading || !country} size="sm">
          {loading ? "Searching..." : "Discover"}
        </Button>
      </div>

      {(result || error) && (
        <div className="pointer-events-auto mt-3 w-full max-w-2xl rounded-lg bg-white p-4 shadow-xl">
          {error && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-red-600">{error}</p>
              <Button onClick={handleDismiss} size="sm" variant="ghost">
                Dismiss
              </Button>
            </div>
          )}
          {result && (
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-semibold text-zinc-900">{result.name}</h3>
                <p className="text-sm text-zinc-600">
                  {result.date} · {result.location}
                </p>
                {result.certification && (
                  <p className="mt-1 text-xs text-zinc-500">
                    Certified by {result.certification}
                  </p>
                )}
                <a
                  href={result.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs text-blue-600 hover:underline"
                >
                  View source →
                </a>
              </div>
              <div className="flex justify-end gap-2">
                <Button onClick={handleDismiss} size="sm" variant="ghost">
                  Dismiss
                </Button>
                <Button onClick={handleAdd} disabled={adding} size="sm">
                  {adding ? "Adding..." : "Add to Map"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
