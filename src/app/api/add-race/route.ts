import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { normalizeName, parseCountry } from "@/lib/race-extraction"

interface AddRaceBody {
  name: string
  date: string
  location: string
  country?: string | null
  distance: string
  certification?: string | null
  image_url?: string | null
  latitude?: number | null
  longitude?: number | null
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AddRaceBody
    if (!body.name || !body.date || !body.location) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Narrow dedup query to the same month — much cheaper than a full table scan
    const month = body.date.slice(0, 7)
    const { data: candidates } = await supabase
      .from("races")
      .select("name, date")
      .gte("date", `${month}-01`)
      .lt("date", `${month}-32`)

    const targetNorm = normalizeName(body.name)
    const dupe = (candidates ?? []).find((r) => normalizeName(r.name) === targetNorm)
    if (dupe) {
      return NextResponse.json(
        { error: "This race is already in your list." },
        { status: 409 }
      )
    }

    const row = {
      name: body.name,
      date: body.date,
      location: body.location,
      country: body.country ?? parseCountry(body.location),
      distance: body.distance || "Marathon",
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
      image_url: body.image_url ?? null,
      description: body.certification ? `Certified by ${body.certification}` : null,
    }

    const { data, error } = await supabase
      .from("races")
      .upsert([row], { onConflict: "name,date", ignoreDuplicates: false })
      .select()

    if (error) {
      console.error("Add race insert failed:", error)
      return NextResponse.json({ error: "Insert failed" }, { status: 500 })
    }

    return NextResponse.json({ race: data?.[0] })
  } catch (error) {
    console.error("Add race failed:", error)
    return NextResponse.json({ error: "Add failed" }, { status: 500 })
  }
}
