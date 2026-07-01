// Client-side helpers for the generic /api/[resource] mutation routes

type Body = Record<string, unknown>

async function request(url: string, method: string, body?: Body) {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.error ?? `Request failed (${response.status})`)
  }
  return payload.data
}

export function createRecord(resource: string, body: Body) {
  return request(`/api/${resource}`, "POST", body)
}

export function updateRecord(resource: string, id: string, body: Body) {
  return request(`/api/${resource}/${id}`, "PATCH", body)
}

export function deleteRecord(resource: string, id: string) {
  return request(`/api/${resource}/${id}`, "DELETE")
}
