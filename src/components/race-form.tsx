"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RACE_DISTANCES } from "@/lib/constants"
import { createRecord, deleteRecord, updateRecord } from "@/lib/api"
import { todayString } from "@/lib/dates"
import { Race } from "@/types"

export function RaceForm({ race }: { race?: Race }) {
  const router = useRouter()
  const isEditing = Boolean(race)

  const [name, setName] = useState(race?.name ?? "")
  const [raceDate, setRaceDate] = useState(race?.race_date ?? "")
  const [distance, setDistance] = useState(race?.distance ?? "Marathon")
  const [location, setLocation] = useState(race?.location ?? "")
  const [goal, setGoal] = useState(race?.goal ?? "")
  const [raceUrl, setRaceUrl] = useState(race?.race_url ?? "")
  const [notes, setNotes] = useState(race?.notes ?? "")
  const [resultTime, setResultTime] = useState(race?.result_time ?? "")
  const [resultNotes, setResultNotes] = useState(race?.result_notes ?? "")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isPast = Boolean(race && race.race_date < todayString())

  async function handleSave() {
    if (!name.trim() || !raceDate) {
      setError("Name and race date are required")
      return
    }
    setIsSaving(true)
    setError(null)
    try {
      const values = {
        name: name.trim(),
        race_date: raceDate,
        distance: distance || null,
        location: location.trim() || null,
        goal: goal.trim() || null,
        race_url: raceUrl.trim() || null,
        notes: notes.trim() || null,
        result_time: resultTime.trim() || null,
        result_notes: resultNotes.trim() || null,
      }
      if (race) {
        await updateRecord("races", race.id, values)
        router.push(`/races/${race.id}`)
      } else {
        const created = await createRecord("races", values)
        router.push(`/races/${created.id}`)
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!race) return
    if (
      !confirm(
        `Delete "${race.name}" and its entire build, logistics, and race-linked diary entries?`
      )
    )
      return
    setIsSaving(true)
    try {
      await deleteRecord("races", race.id)
      router.push("/races")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete")
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4 rounded-lg border bg-white p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="race-name">Race name</Label>
          <Input
            id="race-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Chicago Marathon"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="race-date">Race date</Label>
          <Input
            id="race-date"
            type="date"
            value={raceDate}
            onChange={(e) => setRaceDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Distance</Label>
          <Select value={distance} onValueChange={setDistance}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RACE_DISTANCES.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="race-location">Location</Label>
          <Input
            id="race-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Chicago, IL"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="race-goal">Goal</Label>
          <Input
            id="race-goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Sub 3:45"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="race-url">Official race page (optional)</Label>
          <Input
            id="race-url"
            type="url"
            value={raceUrl}
            onChange={(e) => setRaceUrl(e.target.value)}
            placeholder="https://…"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="race-notes">Notes (optional)</Label>
          <Textarea
            id="race-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Course is flat but windy along the lake. Corral B start."
          />
        </div>
      </div>

      {isEditing && (
        <div className="space-y-4 rounded-lg bg-zinc-50 p-4">
          <h3 className="text-sm font-semibold text-zinc-900">
            Race result {isPast ? "" : "(after race day)"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="result-time">Finish time</Label>
              <Input
                id="result-time"
                value={resultTime}
                onChange={(e) => setResultTime(e.target.value)}
                placeholder="3:42:17"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="result-notes">Race report</Label>
              <Textarea
                id="result-notes"
                value={resultNotes}
                onChange={(e) => setResultNotes(e.target.value)}
                placeholder="How the race went — pacing, fueling, what to do differently next build."
              />
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-2">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving…" : isEditing ? "Save changes" : "Add race"}
        </Button>
        <Button variant="outline" onClick={() => router.back()} disabled={isSaving}>
          Cancel
        </Button>
        {isEditing && (
          <Button
            variant="ghost"
            className="ml-auto text-red-600 hover:text-red-700"
            onClick={handleDelete}
            disabled={isSaving}
          >
            <Trash2 /> Delete race
          </Button>
        )}
      </div>
    </div>
  )
}
