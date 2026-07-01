export type WorkoutType =
  | "easy"
  | "long"
  | "tempo"
  | "intervals"
  | "race_pace"
  | "cross"
  | "rest"

export type WorkoutStatus = "planned" | "completed" | "skipped"

export type LogisticsCategory =
  | "hotel"
  | "travel"
  | "expo"
  | "schedule"
  | "gear"
  | "other"

export type Mood = "strong" | "good" | "ok" | "tired" | "rough"

export interface Race {
  id: string
  name: string
  race_date: string
  distance: string | null
  location: string | null
  goal: string | null
  race_url: string | null
  notes: string | null
  result_time: string | null
  result_notes: string | null
}

export interface Workout {
  id: string
  race_id: string
  workout_date: string
  type: WorkoutType
  title: string | null
  planned_miles: number | null
  description: string | null
  status: WorkoutStatus
  actual_miles: number | null
  execution_rating: number | null
  log_notes: string | null
  completed_at: string | null
}

export interface LogisticsItem {
  id: string
  race_id: string
  category: LogisticsCategory
  title: string
  details: string | null
  item_date: string | null
  url: string | null
  done: boolean
}

export interface DiaryEntry {
  id: string
  race_id: string | null
  entry_date: string
  title: string | null
  body: string
  mood: Mood | null
  created_at: string
  races?: { name: string } | null
}
