import OpenAI from "openai"

export interface ExtractionConstraints {
  /** Restrict to races in this country (English name). */
  country?: string
  /** Restrict to races in YYYY-MM. */
  month?: string
  /** Earliest acceptable race date (YYYY-MM-DD). Defaults to today. */
  minDate?: string
}

export interface ExtractedRace {
  name: string
  date: string
  location: string
  country: string | null
  distances: string[]
  certification: string | null
  image_url: string | null
  registration_status: "open" | "upcoming" | "closed" | "unknown"
}

export function formatDate(input?: string) {
  if (!input) return ""
  const parsed = new Date(input)
  if (Number.isNaN(parsed.getTime())) return ""
  const year = parsed.getUTCFullYear()
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0")
  const day = String(parsed.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function monthLabel(yyyymm?: string) {
  if (!yyyymm) return ""
  const [y, m] = yyyymm.split("-")
  const date = new Date(Number(y), Number(m) - 1, 1)
  return date.toLocaleString("en-US", { month: "long", year: "numeric" })
}

export async function geocodeLocation(location: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`
  const response = await fetch(url, {
    headers: { "User-Agent": "race-buddy/1.0" },
  })
  if (!response.ok) return { latitude: null, longitude: null }
  const results = (await response.json()) as Array<{ lat?: string; lon?: string }>
  const first = results[0]
  if (!first?.lat || !first?.lon) return { latitude: null, longitude: null }
  return { latitude: Number(first.lat), longitude: Number(first.lon) }
}

export function normalizeName(name: string) {
  return name
    .toLowerCase()
    .replace(/^the\s+/, "")
    .replace(/\s+presented by .+$/, "")
    .replace(/\s+sponsored by .+$/, "")
    .replace(/\d{4}/, "")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

const US_STATES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
  "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
  "New Hampshire", "New Jersey", "New Mexico", "New York",
  "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
  "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
  "West Virginia", "Wisconsin", "Wyoming",
])

const CITY_STATES = new Set(["Singapore", "Hong Kong", "Monaco", "Vatican City"])

const COUNTRY_ALIASES: Record<string, string> = {
  US: "USA",
  "U.S.": "USA",
  "U.S.A.": "USA",
  "United States": "USA",
  "United States of America": "USA",
  UK: "UK",
  "U.K.": "UK",
  "United Kingdom": "UK",
}

export function parseCountry(location: string): string | null {
  const parts = location.split(",").map((p) => p.trim()).filter(Boolean)
  if (parts.length === 0) return null

  // Single-segment locations: only confident if it's a known city-state
  if (parts.length === 1) {
    return CITY_STATES.has(parts[0]) ? parts[0] : null
  }

  const last = parts[parts.length - 1]
  if (US_STATES.has(last)) return "USA"
  if (CITY_STATES.has(last)) return last
  return COUNTRY_ALIASES[last] ?? last
}

function buildPrompt(constraints: ExtractionConstraints) {
  const minDate = constraints.minDate || new Date().toISOString().slice(0, 10)
  const lines = [
    "You are a race data extractor. From the website text, return JSON for a single MARATHON race.",
    "",
    "Rules:",
    `- Return {"skip": true} if: not a marathon (26.2mi/42.195km) as a primary distance, no clear date, or registration is closed/race already occurred.`,
    `- Date must be on or after ${minDate}.`,
  ]
  if (constraints.country) lines.push(`- Race must be in ${constraints.country}.`)
  if (constraints.month) lines.push(`- Race date must be in ${monthLabel(constraints.month)}.`)
  lines.push(
    `- "name" and "location" must be in English. Translate from other languages where needed; use commonly-known English names (e.g. "Tokyo Marathon" not "東京マラソン").`,
    `- "registration_status" is one of: "open" | "upcoming" | "closed" | "unknown".`,
    `- "certification" is the certifying body (USATF, World Athletics, AIMS, Athletics Canada, etc.) or null.`,
    "",
    "Return JSON shape:",
    `{`,
    `  "skip": boolean,`,
    `  "name": string,`,
    `  "date": string (YYYY-MM-DD),`,
    `  "location": string ("City, State/Country"),`,
    `  "distances": string[],`,
    `  "certification": string | null,`,
    `  "image_url": string | null,`,
    `  "registration_status": "open" | "upcoming" | "closed" | "unknown"`,
    `}`
  )
  return lines.join("\n")
}

export async function extractRaceFromText(
  openai: OpenAI,
  text: string,
  constraints: ExtractionConstraints = {}
): Promise<ExtractedRace | null> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: buildPrompt(constraints) },
      { role: "user", content: text },
    ],
    response_format: { type: "json_object" },
    temperature: 0,
  })
  const content = completion.choices[0]?.message?.content
  if (!content) return null
  const parsed = JSON.parse(content)
  if (parsed.skip || !parsed.date || !parsed.name || !parsed.location) return null

  return {
    name: parsed.name,
    date: parsed.date,
    location: parsed.location,
    country: parseCountry(parsed.location),
    distances: parsed.distances ?? ["Marathon"],
    certification: parsed.certification ?? null,
    image_url: parsed.image_url ?? null,
    registration_status: parsed.registration_status ?? "unknown",
  }
}
