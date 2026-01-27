import { createClient } from '@supabase/supabase-js'
import { FirecrawlAppV1 } from '@mendable/firecrawl-js'
import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY
const firecrawlApiKey = process.env.FIRECRAWL_API_KEY

if (!supabaseUrl || !supabaseKey || !firecrawlApiKey) {
  throw new Error('Missing required environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)
const firecrawl = new FirecrawlAppV1({ apiKey: firecrawlApiKey })

interface ExtractedRace {
  name?: string
  date?: string
  location?: string
  participants?: number | string
  latitude?: number
  longitude?: number
  websiteUrl?: string
}

interface RaceRow {
  name: string
  date: string
  location: string
  latitude: number | null
  longitude: number | null
}

interface GeocodeResult {
  latitude: number | null
  longitude: number | null
}

function parseParticipants(participants?: number | string) {
  if (participants === undefined || participants === null) return 0
  if (typeof participants === 'number') return participants
  const digitsOnly = participants.replace(/[^\d]/g, '')
  const parsed = Number(digitsOnly)
  return Number.isFinite(parsed) ? parsed : 0
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

async function fetchRaces() {
  const url = 'https://findmymarathon.com/calendar.php'
  const schema = z.object({
    races: z.array(
      z.object({
        name: z.string(),
        date: z.string(),
        location: z.string(),
        participants: z.number().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        websiteUrl: z.string().optional(),
      })
    ),
  })

  const response = (await firecrawl.scrapeUrl(url, {
    formats: ['markdown'],
    extract: {
      schema: schema as unknown as never,
      prompt:
        'Extract race calendar rows. Include name, date, location, and participants count. If latitude/longitude is shown on the page, include those.',
    },
  })) as unknown as {
    success: boolean
    data?: { extract?: { races?: ExtractedRace[] } }
    error?: string
  }

  if (!response.success) {
    throw new Error(`Firecrawl error: ${response.error}`)
  }

  const extracted = (response.data as { extract?: { races?: ExtractedRace[] } })
    ?.extract

  return extracted?.races ?? []
}

async function buildRows(races: ExtractedRace[]) {
  const rows: RaceRow[] = []

  for (const race of races) {
    const name = race.name?.trim()
    const location = race.location?.trim()
    const date = formatDate(race.date)
    const participants = parseParticipants(race.participants)

    if (!name || !location || !date) continue
    if (participants < 10000) continue

    let latitude = typeof race.latitude === 'number' ? race.latitude : null
    let longitude = typeof race.longitude === 'number' ? race.longitude : null

    if (latitude === null || longitude === null) {
      const geocode = await geocodeLocation(location)
      latitude = geocode.latitude
      longitude = geocode.longitude
      await sleep(1000)
    }

    rows.push({
      name,
      date,
      location,
      latitude,
      longitude,
    })
  }

  return rows
}

async function insertRaces(rows: RaceRow[]) {
  if (!rows.length) {
    console.log('No races matched the participants filter.')
    return
  }

  const { data, error } = await supabase.from('races').insert(rows).select()

  if (error) {
    throw error
  }

  console.log(`Inserted ${data.length} races.`)
}

async function run() {
  console.log('Scraping race calendar...')
  const races = await fetchRaces()
  const rows = await buildRows(races)
  await insertRaces(rows)
}

run().catch((error) => {
  console.error('Scrape failed:', error)
  process.exit(1)
})
