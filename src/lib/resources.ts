// Allowlist of tables and columns the generic /api/[resource] routes may
// touch. Anything not listed here is rejected.

interface ResourceConfig {
  table: string
  required: string[]
  columns: string[]
}

export const RESOURCES: Record<string, ResourceConfig> = {
  races: {
    table: "races",
    required: ["name", "race_date"],
    columns: [
      "name",
      "race_date",
      "distance",
      "location",
      "goal",
      "race_url",
      "notes",
      "result_time",
      "result_notes",
    ],
  },
  workouts: {
    table: "workouts",
    required: ["race_id", "workout_date"],
    columns: [
      "race_id",
      "workout_date",
      "type",
      "title",
      "planned_miles",
      "description",
      "status",
      "actual_miles",
      "execution_rating",
      "log_notes",
      "completed_at",
    ],
  },
  logistics: {
    table: "logistics_items",
    required: ["race_id", "title"],
    columns: ["race_id", "category", "title", "details", "item_date", "url", "done"],
  },
  diary: {
    table: "diary_entries",
    required: ["entry_date", "body"],
    columns: ["race_id", "entry_date", "title", "body", "mood"],
  },
}

// Keep only allowlisted columns from a request body
export function pickColumns(
  resource: ResourceConfig,
  body: Record<string, unknown>
): Record<string, unknown> {
  const picked: Record<string, unknown> = {}
  for (const column of resource.columns) {
    if (column in body) picked[column] = body[column]
  }
  return picked
}
