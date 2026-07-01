"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarPlus, Plus } from "lucide-react"
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
import { WorkoutRow } from "@/components/workout-row"
import { WORKOUT_TYPES } from "@/lib/constants"
import { createRecord } from "@/lib/api"
import {
  currentBuildWeek,
  formatWeekRange,
  groupWorkoutsByWeek,
  todayString,
  totalBuildWeeks,
} from "@/lib/dates"
import { Workout, WorkoutType } from "@/types"

export function BuildTab({
  raceId,
  raceDate,
  workouts,
}: {
  raceId: string
  raceDate: string
  workouts: Workout[]
}) {
  const router = useRouter()
  const [addFormDate, setAddFormDate] = useState<string | null>(null)

  const weeks = groupWorkoutsByWeek(workouts)
  const totalWeeks = totalBuildWeeks(workouts, raceDate)
  const currentWeek = currentBuildWeek(workouts, raceDate)
  const totalPlanned = weeks.reduce((sum, w) => sum + w.plannedMiles, 0)
  const totalActual = weeks.reduce((sum, w) => sum + w.actualMiles, 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {workouts.length > 0 ? (
          <p className="text-sm text-zinc-600">
            <span className="font-semibold text-zinc-900">
              Week {currentWeek} of {totalWeeks}
            </span>
            {" · "}
            {Math.round(totalActual)} of {Math.round(totalPlanned)} planned
            miles run
          </p>
        ) : (
          <p className="text-sm text-zinc-600">
            No workouts yet — start sketching your build below.
          </p>
        )}
        <Button
          size="sm"
          onClick={() =>
            setAddFormDate((prev) => (prev === null ? todayString() : null))
          }
        >
          <Plus /> Add workout
        </Button>
      </div>

      {addFormDate !== null && (
        <AddWorkoutForm
          raceId={raceId}
          defaultDate={addFormDate}
          onDone={() => {
            setAddFormDate(null)
            router.refresh()
          }}
          onCancel={() => setAddFormDate(null)}
        />
      )}

      {weeks.map((week) => {
        const isCurrentWeek = week.weekNumber === currentWeek
        return (
          <section key={week.weekStart} className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-zinc-900">
                Week {week.weekNumber}
                <span className="ml-2 font-normal text-zinc-500">
                  {formatWeekRange(week.weekStart)}
                </span>
                {isCurrentWeek && (
                  <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                    this week
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs tabular-nums text-zinc-500">
                  {Math.round(week.actualMiles * 10) / 10} /{" "}
                  {Math.round(week.plannedMiles * 10) / 10} mi ·{" "}
                  {week.completedCount}/{week.workouts.length} done
                </span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  title="Add workout to this week"
                  onClick={() => setAddFormDate(week.weekStart)}
                >
                  <CalendarPlus />
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              {week.workouts.map((workout) => (
                <WorkoutRow key={workout.id} workout={workout} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function AddWorkoutForm({
  raceId,
  defaultDate,
  onDone,
  onCancel,
}: {
  raceId: string
  defaultDate: string
  onDone: () => void
  onCancel: () => void
}) {
  const [date, setDate] = useState(defaultDate)
  const [type, setType] = useState<WorkoutType>("easy")
  const [title, setTitle] = useState("")
  const [plannedMiles, setPlannedMiles] = useState("")
  const [description, setDescription] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(keepOpen: boolean) {
    setIsSaving(true)
    setError(null)
    try {
      await createRecord("workouts", {
        race_id: raceId,
        workout_date: date,
        type,
        title: title || null,
        planned_miles: plannedMiles ? parseFloat(plannedMiles) : null,
        description: description || null,
      })
      if (keepOpen) {
        setTitle("")
        setPlannedMiles("")
        setDescription("")
        setIsSaving(false)
      } else {
        onDone()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-3 rounded-lg border bg-white p-4">
      <h3 className="text-sm font-semibold text-zinc-900">New workout</h3>
      <div className="flex flex-wrap gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="new-workout-date">Date</Label>
          <Input
            id="new-workout-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as WorkoutType)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(WORKOUT_TYPES).map(([value, info]) => (
                <SelectItem key={value} value={value}>
                  {info.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-workout-miles">Planned miles</Label>
          <Input
            id="new-workout-miles"
            type="number"
            step="0.1"
            min="0"
            value={plannedMiles}
            onChange={(e) => setPlannedMiles(e.target.value)}
            className="w-28"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-workout-title">Title</Label>
        <Input
          id="new-workout-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Long run w/ marathon-pace finish"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="new-workout-desc">Plan details (optional)</Label>
        <Textarea
          id="new-workout-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="14mi easy, last 4 @ goal marathon pace"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={() => handleSave(false)} disabled={isSaving}>
          {isSaving ? "Saving…" : "Add workout"}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => handleSave(true)}
          disabled={isSaving}
        >
          Add &amp; add another
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
