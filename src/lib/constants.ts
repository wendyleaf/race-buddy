import { LogisticsCategory, Mood, WorkoutType } from "@/types"

export const WORKOUT_TYPES: Record<
  WorkoutType,
  { label: string; badgeClass: string }
> = {
  easy: { label: "Easy", badgeClass: "bg-sky-100 text-sky-800" },
  long: { label: "Long Run", badgeClass: "bg-violet-100 text-violet-800" },
  tempo: { label: "Tempo", badgeClass: "bg-orange-100 text-orange-800" },
  intervals: { label: "Intervals", badgeClass: "bg-red-100 text-red-800" },
  race_pace: { label: "Race Pace", badgeClass: "bg-rose-100 text-rose-800" },
  cross: { label: "Cross Train", badgeClass: "bg-teal-100 text-teal-800" },
  rest: { label: "Rest", badgeClass: "bg-zinc-100 text-zinc-600" },
}

export const EXECUTION_LABELS: Record<number, string> = {
  1: "Rough",
  2: "Below plan",
  3: "As planned",
  4: "Strong",
  5: "Nailed it",
}

export const LOGISTICS_CATEGORIES: Record<LogisticsCategory, string> = {
  hotel: "Hotel & Lodging",
  travel: "Travel",
  expo: "Expo & Packet Pickup",
  schedule: "Race Weekend Schedule",
  gear: "Gear & Checklist",
  other: "Other",
}

export const MOODS: Record<Mood, { label: string; emoji: string }> = {
  strong: { label: "Strong", emoji: "💪" },
  good: { label: "Good", emoji: "🙂" },
  ok: { label: "OK", emoji: "😐" },
  tired: { label: "Tired", emoji: "🥱" },
  rough: { label: "Rough", emoji: "😖" },
}

export const RACE_DISTANCES = [
  "5K",
  "10K",
  "Half Marathon",
  "Marathon",
  "50K",
  "Other",
]
