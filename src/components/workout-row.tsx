"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Pencil,
  Trash2,
  X,
  XCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
import { EXECUTION_LABELS, WORKOUT_TYPES } from "@/lib/constants"
import { deleteRecord, updateRecord } from "@/lib/api"
import { formatDayShort, todayString } from "@/lib/dates"
import { cn } from "@/lib/utils"
import { Workout, WorkoutStatus, WorkoutType } from "@/types"

export function WorkoutRow({ workout }: { workout: Workout }) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const typeInfo = WORKOUT_TYPES[workout.type] ?? WORKOUT_TYPES.easy
  const isMissed =
    workout.status === "planned" && workout.workout_date < todayString()

  return (
    <div className="rounded-lg border bg-white">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        <StatusIcon status={workout.status} isMissed={isMissed} />
        <span className="w-20 shrink-0 text-sm text-zinc-500">
          {formatDayShort(workout.workout_date)}
        </span>
        <Badge className={cn("shrink-0 border-transparent", typeInfo.badgeClass)}>
          {typeInfo.label}
        </Badge>
        <span className="min-w-0 flex-1 truncate text-sm text-zinc-800">
          {workout.title || workout.description || ""}
        </span>
        <span className="shrink-0 text-sm tabular-nums text-zinc-600">
          <MilesSummary workout={workout} />
        </span>
        {workout.status === "completed" && workout.execution_rating && (
          <span className="hidden shrink-0 text-xs text-zinc-500 sm:inline">
            {EXECUTION_LABELS[workout.execution_rating]}
          </span>
        )}
        {isExpanded ? (
          <ChevronUp className="size-4 shrink-0 text-zinc-400" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-zinc-400" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t px-3 py-3">
          {workout.description && !isEditing && (
            <p className="mb-3 text-sm whitespace-pre-wrap text-zinc-600">
              {workout.description}
            </p>
          )}
          {isEditing ? (
            <WorkoutEditForm
              workout={workout}
              onDone={() => {
                setIsEditing(false)
                router.refresh()
              }}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <div className="space-y-3">
              <WorkoutLogForm
                workout={workout}
                onSaved={() => router.refresh()}
              />
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil /> Edit plan
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatusIcon({
  status,
  isMissed,
}: {
  status: WorkoutStatus
  isMissed: boolean
}) {
  if (status === "completed")
    return <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
  if (status === "skipped")
    return <XCircle className="size-5 shrink-0 text-zinc-400" />
  return (
    <Circle
      className={cn(
        "size-5 shrink-0",
        isMissed ? "text-amber-500" : "text-zinc-300"
      )}
    />
  )
}

function MilesSummary({ workout }: { workout: Workout }) {
  if (workout.status === "completed" && workout.actual_miles != null) {
    return <>{workout.actual_miles} mi</>
  }
  if (workout.planned_miles != null) return <>{workout.planned_miles} mi</>
  return null
}

function WorkoutLogForm({
  workout,
  onSaved,
}: {
  workout: Workout
  onSaved: () => void
}) {
  const [status, setStatus] = useState<WorkoutStatus>(workout.status)
  const [actualMiles, setActualMiles] = useState(
    workout.actual_miles?.toString() ?? workout.planned_miles?.toString() ?? ""
  )
  const [rating, setRating] = useState(workout.execution_rating ?? 0)
  const [notes, setNotes] = useState(workout.log_notes ?? "")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setIsSaving(true)
    setError(null)
    try {
      const isCompleted = status === "completed"
      await updateRecord("workouts", workout.id, {
        status,
        actual_miles:
          isCompleted && actualMiles ? parseFloat(actualMiles) : null,
        execution_rating: isCompleted && rating > 0 ? rating : null,
        log_notes: status === "planned" ? null : notes || null,
        completed_at: isCompleted ? new Date().toISOString() : null,
      })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <StatusButton
          isActive={status === "completed"}
          onClick={() => setStatus("completed")}
          activeClass="border-emerald-600 bg-emerald-50 text-emerald-700"
        >
          <Check className="size-3.5" /> Completed
        </StatusButton>
        <StatusButton
          isActive={status === "skipped"}
          onClick={() => setStatus("skipped")}
          activeClass="border-zinc-500 bg-zinc-100 text-zinc-700"
        >
          <X className="size-3.5" /> Skipped
        </StatusButton>
        {workout.status !== "planned" && (
          <StatusButton
            isActive={status === "planned"}
            onClick={() => setStatus("planned")}
            activeClass="border-zinc-400 bg-zinc-50 text-zinc-600"
          >
            Reset to planned
          </StatusButton>
        )}
      </div>

      {status === "completed" && (
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label htmlFor={`miles-${workout.id}`}>Actual miles</Label>
            <Input
              id={`miles-${workout.id}`}
              type="number"
              step="0.1"
              min="0"
              value={actualMiles}
              onChange={(e) => setActualMiles(e.target.value)}
              className="w-24"
            />
          </div>
          <div className="space-y-1.5">
            <Label>How was the execution?</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  title={EXECUTION_LABELS[value]}
                  onClick={() => setRating(value)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-md border text-sm font-medium transition-colors",
                    rating === value
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-xs text-zinc-500">{EXECUTION_LABELS[rating]}</p>
            )}
          </div>
        </div>
      )}

      {status !== "planned" && (
        <div className="space-y-1.5">
          <Label htmlFor={`notes-${workout.id}`}>
            {status === "completed" ? "How did it go?" : "Why skipped?"}
          </Label>
          <Textarea
            id={`notes-${workout.id}`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Felt smooth, negative split the last 3 miles…"
          />
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button size="sm" onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Saving…" : "Save log"}
      </Button>
    </div>
  )
}

function StatusButton({
  isActive,
  activeClass,
  onClick,
  children,
}: {
  isActive: boolean
  activeClass: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 rounded-md border px-2.5 py-1 text-sm font-medium transition-colors",
        isActive ? activeClass : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
      )}
    >
      {children}
    </button>
  )
}

function WorkoutEditForm({
  workout,
  onDone,
  onCancel,
}: {
  workout: Workout
  onDone: () => void
  onCancel: () => void
}) {
  const [date, setDate] = useState(workout.workout_date)
  const [type, setType] = useState<WorkoutType>(workout.type)
  const [title, setTitle] = useState(workout.title ?? "")
  const [plannedMiles, setPlannedMiles] = useState(
    workout.planned_miles?.toString() ?? ""
  )
  const [description, setDescription] = useState(workout.description ?? "")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setIsSaving(true)
    setError(null)
    try {
      await updateRecord("workouts", workout.id, {
        workout_date: date,
        type,
        title: title || null,
        planned_miles: plannedMiles ? parseFloat(plannedMiles) : null,
        description: description || null,
      })
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this workout from the plan?")) return
    setIsSaving(true)
    try {
      await deleteRecord("workouts", workout.id)
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete")
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`date-${workout.id}`}>Date</Label>
          <Input
            id={`date-${workout.id}`}
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
          <Label htmlFor={`planned-${workout.id}`}>Planned miles</Label>
          <Input
            id={`planned-${workout.id}`}
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
        <Label htmlFor={`title-${workout.id}`}>Title</Label>
        <Input
          id={`title-${workout.id}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="6 x 800m @ 5K pace"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`desc-${workout.id}`}>Plan details</Label>
        <Textarea
          id={`desc-${workout.id}`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="2mi warmup, 6x800 w/ 400 jog, 2mi cooldown"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          Save changes
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto text-red-600 hover:text-red-700"
          onClick={handleDelete}
          disabled={isSaving}
        >
          <Trash2 /> Delete
        </Button>
      </div>
    </div>
  )
}
