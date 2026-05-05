import { createClient } from "@supabase/supabase-js"
import Exa from "exa-js"
import OpenAI from "openai"
import * as dotenv from "dotenv"
import {
  extractRaceFromText,
  formatDate,
  geocodeLocation,
  normalizeName,
} from "../src/lib/race-extraction"

dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY
const exaApiKey = process.env.EXA_API_KEY
const openaiApiKey = process.env.OPENAI_API_KEY

if (!supabaseUrl || !supabaseKey || !exaApiKey || !openaiApiKey) {
  throw new Error("Missing required environment variables")
}

const supabase = createClient(supabaseUrl, supabaseKey)
const exa = new Exa(exaApiKey)
const openai = new OpenAI({ apiKey: openaiApiKey })

interface RaceRow {
  name: string
  date: string
  location: string
  country: string | null
  distance: string | null
  latitude: number | null
  longitude: number | null
  image_url: string | null
  description: string | null
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function discoverRaces() {
  const queries = [
    "USATF certified marathon 2026 official race registration",
    "certified road marathon race 2026 official site registration open",
  ]

  const seenUrls = new Set<string>()
  const allResults: Array<{ url: string; title?: string | null; text?: string | null }> = []

  for (const query of queries) {
    console.log(`\nSearching: "${query}"`)
    const response = await exa.searchAndContents(query, {
      type: "auto",
      numResults: 10,
      contents: { text: { maxCharacters: 10000 } },
    })
    console.log(`  Found ${response.results.length} results`)
    for (const result of response.results as typeof allResults) {
      if (!seenUrls.has(result.url)) {
        seenUrls.add(result.url)
        allResults.push(result)
      }
    }
  }

  console.log(`\nTotal unique results: ${allResults.length}`)

  // Parallel extraction
  const extractions = await Promise.all(
    allResults.map(async (result) => {
      if (!result.text) return null
      try {
        const extracted = await extractRaceFromText(openai, result.text)
        if (!extracted) {
          console.log(`Skipping ${result.url} - not a certified marathon`)
          return null
        }
        if (extracted.registration_status === "closed") {
          console.log(`Pending (registration closed): ${extracted.name}`)
          return null
        }
        return { ...extracted, url: result.url }
      } catch (err) {
        console.error(`Extraction failed for ${result.url}:`, err)
        return null
      }
    })
  )

  const races = extractions.filter((r): r is NonNullable<typeof r> => r !== null)
  console.log(`\nExtracted ${races.length} valid races`)
  return races
}

async function buildRows(races: Awaited<ReturnType<typeof discoverRaces>>) {
  const rows: RaceRow[] = []

  for (const race of races) {
    const name = race.name.trim()
    const location = race.location?.trim()
    const dateStr = race.date ? formatDate(race.date) : ""

    console.log(`\nProcessing: ${name}`)

    if (!name || !location || !dateStr) {
      console.log("  SKIPPED: missing required field")
      continue
    }

    const geocode = await geocodeLocation(location)
    console.log(`  Geocoded: ${geocode.latitude}, ${geocode.longitude}`)
    await sleep(1000) // Nominatim rate limit

    rows.push({
      name,
      date: dateStr,
      location,
      country: race.country,
      distance: "Marathon",
      latitude: geocode.latitude,
      longitude: geocode.longitude,
      image_url: race.image_url,
      description: race.certification ? `Certified by ${race.certification}` : null,
    })
  }

  return rows
}

async function insertRaces(rows: RaceRow[]) {
  if (!rows.length) {
    console.log("No races to insert.")
    return
  }

  const { data: existing } = await supabase.from("races").select("name, date")
  const existingNormalized = (existing ?? []).map((r) => ({
    name: normalizeName(r.name),
    month: r.date?.slice(0, 7),
  }))

  const deduped = rows.filter((row) => {
    const norm = normalizeName(row.name)
    const month = row.date.slice(0, 7)
    const isDupe = existingNormalized.some((e) => e.name === norm && e.month === month)
    if (isDupe) console.log(`  Skipping near-duplicate: ${row.name}`)
    return !isDupe
  })

  if (!deduped.length) {
    console.log("All races already exist.")
    return
  }

  const { data, error } = await supabase
    .from("races")
    .upsert(deduped, { onConflict: "name,date", ignoreDuplicates: true })
    .select()

  if (error) throw error

  console.log(`\nInserted ${data.length} new races (duplicates skipped).`)
}

async function run() {
  console.log("Starting race discovery...\n")
  const races = await discoverRaces()
  const rows = await buildRows(races)
  await insertRaces(rows)
  console.log("\nDone!")
}

run().catch((error) => {
  console.error("Discovery failed:", error)
  process.exit(1)
})
