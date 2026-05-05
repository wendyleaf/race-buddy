import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

interface AddRaceBody {
  name: string
  date: string
  location: string
  distance: string
  certification?: string | null
  image_url?: string | null
  latitude?: number | null
  longitude?: number | null
}

function normalizeName(name: string) {
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

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AddRaceBody
    if (!body.name || !body.date || !body.location) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data: existing } = await supabase.from("races").select("id, name, date")
    const targetNorm = normalizeName(body.name)
    const targetMonth = body.date.slice(0, 7)
    const dupe = (existing ?? []).find(
      (r) => normalizeName(r.name) === targetNorm && r.date?.slice(0, 7) === targetMonth
    )
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
      country: null,
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
