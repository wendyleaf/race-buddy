import { NextResponse } from "next/server"
import Exa from "exa-js"
import OpenAI from "openai"
import {
  extractRaceFromText,
  geocodeLocation,
  monthLabel,
} from "@/lib/race-extraction"
import { DiscoveredRace } from "@/types/race"

const exa = new Exa(process.env.EXA_API_KEY!)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

interface DiscoverRequest {
  country?: string
  state?: string
  month?: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as DiscoverRequest
    const country = body.country?.trim() || ""
    const state = body.state?.trim() || ""
    const month = body.month?.trim() || ""

    const queryParts = ["certified marathon race"]
    if (state) queryParts.push(state)
    else if (country) queryParts.push(country)
    if (month) queryParts.push(monthLabel(month))
    queryParts.push("official site registration")
    const query = queryParts.join(" ")

    const search = await exa.searchAndContents(query, {
      type: "auto",
      numResults: 8,
      contents: { text: { maxCharacters: 10000 } },
    })

    const results = search.results as Array<{
      url: string
      title?: string | null
      text?: string | null
    }>

    const candidates = results.filter((r) => r.text)

    // Run extractions in parallel — first valid match wins
    const extractions = await Promise.all(
      candidates.map(async (r) => {
        try {
          const extracted = await extractRaceFromText(openai, r.text!, {
            country,
            state,
            month,
          })
          if (!extracted || extracted.registration_status === "closed") return null
          return { result: r, extracted }
        } catch {
          return null
        }
      })
    )

    const match = extractions.find((e) => e !== null)
    if (!match) {
      return NextResponse.json(
        { error: "No matching marathon found. Try different criteria." },
        { status: 404 }
      )
    }

    const geo = await geocodeLocation(match.extracted.location)

    const race: DiscoveredRace = {
      name: match.extracted.name,
      date: match.extracted.date,
      location: match.extracted.location,
      country: match.extracted.country,
      distance: "Marathon",
      certification: match.extracted.certification,
      latitude: geo.latitude,
      longitude: geo.longitude,
      source_url: match.result.url,
    }
    return NextResponse.json({ race })
  } catch (error) {
    console.error("Discover race failed:", error)
    return NextResponse.json({ error: "Discovery failed" }, { status: 500 })
  }
}
