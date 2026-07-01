import { Workout } from "@/types"

const DAY_MS = 24 * 60 * 60 * 1000

// Parse a YYYY-MM-DD string as a local date (avoids UTC off-by-one)
export function parseDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function toDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function todayString(): string {
  return toDateString(new Date())
}

export function addDays(dateString: string, days: number): string {
  const date = parseDate(dateString)
  date.setDate(date.getDate() + days)
  return toDateString(date)
}

// Days from today until the given date (negative if in the past)
export function daysUntil(dateString: string): number {
  const target = parseDate(dateString).getTime()
  const today = parseDate(todayString()).getTime()
  return Math.round((target - today) / DAY_MS)
}

// Monday of the week containing the given date
export function startOfWeek(dateString: string): string {
  const date = parseDate(dateString)
  const offset = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - offset)
  return toDateString(date)
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parseDate(dateString))
}

export function formatDayShort(dateString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "numeric",
    day: "numeric",
  }).format(parseDate(dateString))
}

export function formatDateTime(isoString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoString))
}

export function formatWeekRange(weekStart: string): string {
  const start = parseDate(weekStart)
  const end = parseDate(addDays(weekStart, 6))
  const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" })
  return `${fmt.format(start)} – ${fmt.format(end)}`
}

export interface WeekGroup {
  weekStart: string
  weekNumber: number
  workouts: Workout[]
  plannedMiles: number
  actualMiles: number
  completedCount: number
}

// Group a build's workouts into Monday-start weeks, numbered from the
// first week of the build.
export function groupWorkoutsByWeek(workouts: Workout[]): WeekGroup[] {
  if (workouts.length === 0) return []

  const sorted = [...workouts].sort((a, b) =>
    a.workout_date.localeCompare(b.workout_date)
  )
  const firstWeek = startOfWeek(sorted[0].workout_date)

  const groups = new Map<string, WeekGroup>()
  for (const workout of sorted) {
    const weekStart = startOfWeek(workout.workout_date)
    let group = groups.get(weekStart)
    if (!group) {
      const weekNumber =
        Math.round(
          (parseDate(weekStart).getTime() - parseDate(firstWeek).getTime()) /
            (7 * DAY_MS)
        ) + 1
      group = {
        weekStart,
        weekNumber,
        workouts: [],
        plannedMiles: 0,
        actualMiles: 0,
        completedCount: 0,
      }
      groups.set(weekStart, group)
    }
    group.workouts.push(workout)
    group.plannedMiles += workout.planned_miles ?? 0
    if (workout.status === "completed") {
      group.actualMiles += workout.actual_miles ?? workout.planned_miles ?? 0
      group.completedCount += 1
    }
  }

  return Array.from(groups.values()).sort((a, b) =>
    a.weekStart.localeCompare(b.weekStart)
  )
}

// Total number of build weeks: from the first workout's week through the
// race week (so an in-progress plan still shows "Week 3 of 16").
export function totalBuildWeeks(workouts: Workout[], raceDate: string): number {
  if (workouts.length === 0) return 0
  const sorted = [...workouts].sort((a, b) =>
    a.workout_date.localeCompare(b.workout_date)
  )
  const firstWeek = parseDate(startOfWeek(sorted[0].workout_date)).getTime()
  const raceWeek = parseDate(startOfWeek(raceDate)).getTime()
  const lastWorkoutWeek = parseDate(
    startOfWeek(sorted[sorted.length - 1].workout_date)
  ).getTime()
  const endWeek = Math.max(raceWeek, lastWorkoutWeek)
  return Math.round((endWeek - firstWeek) / (7 * DAY_MS)) + 1
}

// Which build week today falls in (1-based), clamped to the build range
export function currentBuildWeek(workouts: Workout[], raceDate: string): number {
  const total = totalBuildWeeks(workouts, raceDate)
  if (total === 0) return 0
  const sorted = [...workouts].sort((a, b) =>
    a.workout_date.localeCompare(b.workout_date)
  )
  const firstWeek = parseDate(startOfWeek(sorted[0].workout_date)).getTime()
  const thisWeek = parseDate(startOfWeek(todayString())).getTime()
  const week = Math.round((thisWeek - firstWeek) / (7 * DAY_MS)) + 1
  return Math.min(Math.max(week, 1), total)
}
