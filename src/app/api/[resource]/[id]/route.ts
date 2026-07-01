import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { pickColumns, RESOURCES } from "@/lib/resources"

interface RouteParams {
  params: Promise<{ resource: string; id: string }>
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { resource: resourceName, id } = await params
  const resource = RESOURCES[resourceName]
  if (!resource) {
    return NextResponse.json({ error: "Unknown resource" }, { status: 404 })
  }

  try {
    const body = await request.json()
    const values = pickColumns(resource, body)
    if (Object.keys(values).length === 0) {
      return NextResponse.json({ error: "No valid fields" }, { status: 400 })
    }

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from(resource.table)
      .update(values)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { resource: resourceName, id } = await params
  const resource = RESOURCES[resourceName]
  if (!resource) {
    return NextResponse.json({ error: "Unknown resource" }, { status: 404 })
  }

  try {
    const supabase = createServerClient()
    const { error } = await supabase.from(resource.table).delete().eq("id", id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
