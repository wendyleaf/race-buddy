import { NextResponse } from "next/server"
import Exa from "exa-js"
import OpenAI from "openai"

const exa = new Exa(process.env.EXA_API_KEY!)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

interface DiscoverRequest {
  country?: string
  month?: string // YYYY-MM
}

interface DiscoveredRace {
  name: string
  date: string
  location: string
  distance: string
  certification: string | null
  image_url: string | null
  latitude: number | null
  longitude: number | null
  source_url: string
}

async function geocode(location: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`
  const res = await fetch(url, {
    headers: { "User-Agent": "race-buddy/1.0" },
  })
  if (!res.ok) return { latitude: null, longitude: null }
  const results = (await res.json()) as Array<{ lat?: string; lon?: string }>
  const first = results[0]
  if (!first?.lat || !first?.lon) return { latitude: null, longitude: null }
  return { latitude: Number(first.lat), longitude: Number(first.lon) }
}

function monthLabel(yyyymm?: string) {
  if (!yyyymm) return ""
  const [y, m] = yyyymm.split("-")
  const date = new Date(Number(y), Number(m) - 1, 1)
  return date.toLocaleString("en-US", { month: "long", year: "numeric" })
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as DiscoverRequest
    const country = body.country?.trim() || ""
    const monthStr = body.month?.trim() || ""

    const queryParts = ["certified marathon race"]
    if (country) queryParts.push(country)
    if (monthStr) queryParts.push(monthLabel(monthStr))
    queryParts.push("official site registration")
    const query = queryParts.join(" ")

    const search = await exa.searchAndContents(query, {
      type: "auto",
      numResults: 8,
      contents: { text: { maxCharacters: 10000 } },
    })

    const monthFilter = monthStr || ""
    const today = new Date().toISOString().slice(0, 10)

    const systemPrompt = `You are a race data extractor. From the website text, return JSON for a single MARATHON race.

Rules:
- Return {"skip": true} if: not a marathon (26.2mi/42.195km), no clear date, or registration is closed/race already occurred.
- Date must be on or after ${today}.
${country ? `- Race must be in ${country}.` : ""}
${monthFilter ? `- Race date must be in ${monthLabel(monthFilter)}.` : ""}

Return JSON shape:
{
  "skip": boolean,
  "name": string,
  "date": string (YYYY-MM-DD),
  "location": string ("City, State/Country"),
  "certification": string | null,
  "image_url": string | null
}`

    for (const result of search.results as Array<{ url: string; title?: string | null; text?: string | null }>) {
      if (!result.text) continue

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: result.text },
        ],
        response_format: { type: "json_object" },
        temperature: 0,
      })
      const content = completion.choices[0]?.message?.content
      if (!content) continue
      const parsed = JSON.parse(content)
      if (parsed.skip || !parsed.date || !parsed.name || !parsed.location) continue

      const geo = await geocode(parsed.location)

      const race: DiscoveredRace = {
        name: parsed.name,
        date: parsed.date,
        location: parsed.location,
        distance: "Marathon",
        certification: parsed.certification ?? null,
        image_url: parsed.image_url ?? null,
        latitude: geo.latitude,
        longitude: geo.longitude,
        source_url: result.url,
      }
      return NextResponse.json({ race })
    }

    return NextResponse.json(
      { error: "No matching marathon found. Try different criteria." },
      { status: 404 }
    )
  } catch (error) {
    console.error("Discover race failed:", error)
    return NextResponse.json({ error: "Discovery failed" }, { status: 500 })
  }
}
