"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Flag, PenLine, Trash2 } from "lucide-react"
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
import { MOODS } from "@/lib/constants"
import { createRecord, deleteRecord } from "@/lib/api"
import { formatDate, todayString } from "@/lib/dates"
import { cn } from "@/lib/utils"
import { DiaryEntry, Mood, Race } from "@/types"

const NO_RACE = "none"

// New-entry form. When `raceId` is set the entry is pinned to that race;
// otherwise `races` populates an optional race selector.
export function DiaryEntryForm({
  raceId,
  races = [],
  onSaved,
}: {
  raceId?: string
  races?: Pick<Race, "id" | "name">[]
  onSaved?: () => void
}) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [entryDate, setEntryDate] = useState(todayString())
  const [selectedRace, setSelectedRace] = useState(raceId ?? NO_RACE)
  const [mood, setMood] = useState<Mood | null>(null)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!body.trim()) {
      setError("Write something first")
      return
    }
    setIsSaving(true)
    setError(null)
    try {
      await createRecord("diary", {
        race_id: selectedRace === NO_RACE ? null : selectedRace,
        entry_date: entryDate,
        title: title.trim() || null,
        body: body.trim(),
        mood,
      })
      setIsOpen(false)
      setTitle("")
      setBody("")
      setMood(null)
      setEntryDate(todayString())
      onSaved?.()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) {
    return (
      <Button size="sm" onClick={() => setIsOpen(true)}>
        <PenLine /> New entry
      </Button>
    )
  }

  return (
    <div className="space-y-3 rounded-lg border bg-white p-4">
      <h3 className="text-sm font-semibold text-zinc-900">New diary entry</h3>
      <div className="flex flex-wrap gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="entry-date">Date</Label>
          <Input
            id="entry-date"
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className="w-40"
          />
        </div>
        {!raceId && races.length > 0 && (
          <div className="space-y-1.5">
            <Label>Race build (optional)</Label>
            <Select value={selectedRace} onValueChange={setSelectedRace}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_RACE}>No race — general</SelectItem>
                {races.map((race) => (
                  <SelectItem key={race.id} value={race.id}>
                    {race.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <div className="space-y-1.5">
        <Label>How are you feeling?</Label>
        <div className="flex flex-wrap gap-1.5">
          {(Object.entries(MOODS) as [Mood, (typeof MOODS)[Mood]][]).map(
            ([value, info]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMood(mood === value ? null : value)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-sm transition-colors",
                  mood === value
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                )}
              >
                {info.emoji} {info.label}
              </button>
            )
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="entry-title">Title (optional)</Label>
        <Input
          id="entry-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Big week in the books"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="entry-body">Entry</Label>
        <Textarea
          id="entry-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="min-h-28"
          placeholder="Legs felt heavy early but the tempo came around. Hamstring tightness is back — watching it this week…"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving…" : "Save entry"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsOpen(false)}
          disabled={isSaving}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}

export function DiaryEntryCard({
  entry,
  showRace = false,
}: {
  entry: DiaryEntry
  showRace?: boolean
}) {
  const router = useRouter()
  const [isBusy, setIsBusy] = useState(false)
  const moodInfo = entry.mood ? MOODS[entry.mood] : null

  async function handleDelete() {
    if (!confirm("Delete this diary entry?")) return
    setIsBusy(true)
    try {
      await deleteRecord("diary", entry.id)
      router.refresh()
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <article className="group rounded-lg border bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium text-zinc-900">
            {formatDate(entry.entry_date)}
          </span>
          {moodInfo && (
            <span className="text-zinc-500">
              {moodInfo.emoji} {moodInfo.label}
            </span>
          )}
          {showRace && entry.race_id && entry.races?.name && (
            <Link
              href={`/races/${entry.race_id}`}
              className="flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 hover:bg-zinc-200"
            >
              <Flag className="size-3" /> {entry.races.name}
            </Link>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleDelete}
          disabled={isBusy}
          className="text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-600"
          aria-label="Delete entry"
        >
          <Trash2 />
        </Button>
      </div>
      {entry.title && (
        <h3 className="mt-1 font-semibold text-zinc-900">{entry.title}</h3>
      )}
      <p className="mt-1 text-sm whitespace-pre-wrap text-zinc-700">
        {entry.body}
      </p>
    </article>
  )
}
