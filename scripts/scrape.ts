import { createClient } from '@supabase/supabase-js'
import { FirecrawlAppV1 } from '@mendable/firecrawl-js'
import dotenv from 'dotenv'

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
  location?: string
  country?: string
  distance?: string
  participants?: number | string
  type?: string
}

interface RaceRow {
  name: string
  date: string
  location: string
  country: string | null
  distance: string | null
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

function parseMarkdownTable(markdown: string): ExtractedRace[] {
  const races: ExtractedRace[] = []
  
  // Find the main table in the markdown
  const lines = markdown.split('\n')
  let inTable = false
  let headerFound = false
  
  for (const line of lines) {
    // Skip until we find a table with race data
    if (line.includes('|') && line.includes('Event')) {
      headerFound = true
      inTable = true
      continue
    }
    
    // Skip separator line
    if (line.includes('|---') || line.includes('| ---')) {
      continue
    }
    
    // Parse table rows
    if (inTable && line.includes('|')) {
      // Empty line or end of table
      if (line.trim() === '' || !line.includes('|')) {
        break
      }
      
      // Split by pipes and clean up
      const columns = line.split('|')
        .map(col => col.trim())
        .filter(col => col !== '')
      
      // Wikipedia table typically has: Event | Location | Country | Distance | Participants | etc
      if (columns.length >= 4) {
        const name = columns[0]?.replace(/\[.*?\]/g, '').trim() // Remove markdown links
        const location = columns[1]?.replace(/\[.*?\]/g, '').trim()
        const country = columns[2]?.replace(/\[.*?\]/g, '').trim()
        const distance = columns[3]?.replace(/\[.*?\]/g, '').trim()
        const participantsRaw = columns[4]?.replace(/\[.*?\]/g, '').trim()
        
        if (name && location) {
          races.push({
            name,
            location,
            country: country || undefined,
            distance: distance || undefined,
            participants: participantsRaw || undefined,
          })
        }
      }
    }
  }
  
  return races
}

async function fetchRaces() {
  const url = 'https://en.wikipedia.org/wiki/List_of_largest_running_events'

  const response = await firecrawl.scrapeUrl(url, {
    formats: ['markdown'],
  })

  if (!response.success) {
    throw new Error(`Firecrawl error: ${response.error}`)
  }

  const markdown = response.markdown || ''
  console.log('Markdown length:', markdown.length)
  console.log('First 500 chars:', markdown.substring(0, 500))
  
  const races = parseMarkdownTable(markdown)
  console.log(`Parsed ${races.length} races from markdown`)
  
  if (races.length > 0) {
    console.log('First race sample:', JSON.stringify(races[0], null, 2))
  }
  
  return races
}

async function buildRows(races: ExtractedRace[]) {
  const rows: RaceRow[] = []

  for (const race of races) {
    console.log('Processing race:', JSON.stringify(race, null, 2))
    
    const name = race.name?.trim()
    const location = race.location?.trim()
    const country = race.country?.trim() || null
    const distance = race.distance?.trim() || null
    const participants = parseParticipants(race.participants)

    console.log(`Processing: ${name} in ${location}, ${country || 'no country'} - ${participants} participants`)
    
    if (!name || !location) {
      console.log('SKIPPED: Missing name or location')
      continue
    }

    // Use placeholder date for now (Phase 1)
    const date = '2026-06-01'

    // Geocode using city, country format for better accuracy
    const geocodeQuery = country ? `${location}, ${country}` : location
    const geocode = await geocodeLocation(geocodeQuery)
    const latitude = geocode.latitude
    const longitude = geocode.longitude
    await sleep(1000)

    rows.push({
      name,
      date,
      location,
      country,
      distance,
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
  console.log(`Fetched ${races.length} races from Wikipedia`)
  const rows = await buildRows(races) ?? []
  await insertRaces(rows)
}

run().catch((error) => {
  console.error('Scrape failed:', error)
  process.exit(1)
})
