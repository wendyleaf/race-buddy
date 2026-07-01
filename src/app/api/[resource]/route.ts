import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { pickColumns, RESOURCES } from "@/lib/resources"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ resource: string }> }
) {
  const { resource: resourceName } = await params
  const resource = RESOURCES[resourceName]
  if (!resource) {
    return NextResponse.json({ error: "Unknown resource" }, { status: 404 })
  }

  try {
    const body = await request.json()
    const values = pickColumns(resource, body)

    const missing = resource.required.filter((field) => !values[field])
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from(resource.table)
      .insert(values)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
