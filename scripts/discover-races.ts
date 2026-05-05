import { createClient } from '@supabase/supabase-js'
import Exa from 'exa-js'
import OpenAI from 'openai'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY
const exaApiKey = process.env.EXA_API_KEY
const openaiApiKey = process.env.OPENAI_API_KEY

if (!supabaseUrl || !supabaseKey || !exaApiKey || !openaiApiKey) {
  throw new Error('Missing required environment variables')
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

interface GeocodeResult {
  latitude: number | null
  longitude: number | null
}

interface ParsedRaceData {
  name: string
  url: string
  date: string
  location: string
  distances?: string[]
  image_url?: string
  certification?: string | null
  registration_status?: 'open' | 'upcoming' | 'closed' | 'unknown'
}

function formatDate(input?: string) {
  if (!input) return ''
  const parsed = new Date(input)
  if (Number.isNaN(parsed.getTime())) return ''
  const year = parsed.getUTCFullYear()
  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0')
  const day = String(parsed.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function geocodeLocation(location: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'race-buddy-scraper/1.0 (local script)',
    },
  })

  if (!response.ok) return { latitude: null, longitude: null }

  const results = (await response.json()) as Array<{
    lat?: string
    lon?: string
  }>

  const first = results[0]
  if (!first?.lat || !first?.lon) return { latitude: null, longitude: null }

  return {
    latitude: Number(first.lat),
    longitude: Number(first.lon),
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function extractRaceDataWithOpenAI(
  title: string,
  url: string,
  text: string
): Promise<ParsedRaceData | null> {
  try {
    const systemPrompt = `You are a race data extractor. From the website text, extract a JSON object for a MARATHON race only.

Rules:
- Return null (as JSON: {"skip": true}) if: the page is not about a marathon (26.2 miles / 42.195 km) as a primary distance, the race date is before 2026-05-04, or no date is found.
- "distances" must include "Marathon" (26.2mi). If the page only covers 5K, 10K, half marathon, etc., skip it.
- "certification" should be the certifying body if mentioned (e.g. "USATF", "World Athletics", "AIMS", "Athletics Canada", or the relevant national governing body). Set to null if not mentioned.
- "registration_status" must be one of: "open" (registration currently accepting entries), "upcoming" (announced but not yet open), "closed" (registration closed or race already occurred), "unknown".
- "date" must be an ISO date string (YYYY-MM-DD) for 2026 or later. If the page only shows a past edition (e.g. 2025 results), set registration_status to "closed".

Return this JSON shape:
{
  "skip": false,
  "name": string,
  "date": string (ISO),
  "location": string (City, State/Country),
  "distances": string[],
  "image_url": string | null,
  "certification": string | null,
  "registration_status": "open" | "upcoming" | "closed" | "unknown"
}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      console.log(`No content returned from OpenAI for ${url}`)
      return null
    }

    const extracted = JSON.parse(content)

    if (extracted.skip || !extracted.date) {
      return null
    }

    return {
      name: extracted.name || title,
      date: extracted.date,
      location: extracted.location,
      distances: extracted.distances,
      image_url: extracted.image_url ?? null,
      certification: extracted.certification ?? null,
      registration_status: extracted.registration_status ?? 'unknown',
      url,
    }
  } catch (error) {
    console.error(`Error extracting data with OpenAI for ${url}:`, error)
    return null
  }
}

async function discoverRaces() {
  console.log('Discovering races with Exa...')

  const queries = [
    'USATF certified marathon 2026 official race registration',
    'certified road marathon race 2026 official site registration open',
  ]

  const seenUrls = new Set<string>()
  const allResults: Array<{ url: string; title?: string | null; text?: string | null }> = []

  for (const query of queries) {
    console.log(`\nSearching: "${query}"`)
    const response = await exa.searchAndContents(query, {
      type: 'auto',
      numResults: 10,
      contents: {
        text: { maxCharacters: 10000 },
      },
    })
    console.log(`  Found ${response.results.length} results`)
    for (const result of response.results) {
      if (!seenUrls.has(result.url)) {
        seenUrls.add(result.url)
        allResults.push(result)
      }
    }
  }

  console.log(`\nTotal unique results: ${allResults.length}`)

  const parsedRaces: ParsedRaceData[] = []

  for (const result of allResults) {
    if (!result.text) {
      console.log(`Skipping ${result.url} - no text content`)
      continue
    }

    console.log(`\nExtracting data from: ${result.url}`)

    const extracted = await extractRaceDataWithOpenAI(
      result.title || 'Unknown Race',
      result.url,
      result.text
    )

    if (!extracted) {
      console.log(`Skipping ${result.url} - not a certified marathon, no date, or extraction failed`)
      continue
    }

    if (extracted.registration_status === 'closed') {
      console.log(`Pending (registration closed): ${extracted.name} — skipping insertion`)
      continue
    }

    console.log('Extracted race data:')
    console.log(JSON.stringify(extracted, null, 2))

    parsedRaces.push(extracted)
  }

  return parsedRaces
}

async function buildRows(races: ParsedRaceData[]) {
  const rows: RaceRow[] = []

  for (const race of races) {
    const name = race.name.trim()
    const location = race.location?.trim()
    const distance = race.distances?.join(', ') || null
    const dateStr = race.date ? formatDate(race.date) : ''

    console.log(`\nProcessing: ${name}`)
    console.log(`  Location: ${location || 'unknown'}`)
    console.log(`  Date: ${dateStr || 'unknown'}`)
    console.log(`  Distance: ${distance || 'unknown'}`)
    console.log(`  Image URL: ${race.image_url || 'none'}`)

    if (!name || !location) {
      console.log('  SKIPPED: Missing name or location')
      continue
    }

    if (!dateStr) {
      console.log('  SKIPPED: Missing date')
      continue
    }

    // Geocode the location
    const geocode = await geocodeLocation(location)
    const latitude = geocode.latitude
    const longitude = geocode.longitude

    console.log(`  Geocoded: ${latitude}, ${longitude}`)

    await sleep(1000) // Rate limit for geocoding API

    rows.push({
      name,
      date: dateStr,
      location,
      country: null,
      distance,
      latitude,
      longitude,
      image_url: race.image_url || null,
      description: race.certification ? `Certified by ${race.certification}` : null,
    })
  }

  return rows
}

async function insertRaces(rows: RaceRow[]) {
  if (!rows.length) {
    console.log('No races to insert.')
    return
  }

  const { data, error } = await supabase
    .from('races')
    .upsert(rows, { onConflict: 'name,date', ignoreDuplicates: true })
    .select()

  if (error) {
    throw error
  }

  console.log(`\nInserted ${data.length} new races (duplicates skipped).`)
}

async function run() {
  console.log('Starting race discovery with Exa...\n')
  const races = await discoverRaces()
  console.log(`\nDiscovered ${races.length} high-quality race results`)
  const rows = await buildRows(races)
  console.log(`\nPrepared ${rows.length} races for insertion`)
  await insertRaces(rows)
  console.log('\nDone!')
}

run().catch((error) => {
  console.error('Discovery failed:', error)
  process.exit(1)
})
