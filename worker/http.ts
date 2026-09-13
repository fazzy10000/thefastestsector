export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  return new Response(JSON.stringify(data), { ...init, headers })
}

export function parseJson<T>(request: Request): Promise<T | null> {
  return request.json().catch(() => null) as Promise<T | null>
}

export function id(): string {
  return crypto.randomUUID()
}

export function parseJsonArray(raw: string | null | undefined): string[] {
  try {
    const v = JSON.parse(raw || '[]')
    return Array.isArray(v) ? v.map(String) : []
  } catch {
    return []
  }
}

export function parseJsonValue<T>(raw: string | null | undefined, fallback: T): T {
  try {
    return JSON.parse(raw || 'null') as T
  } catch {
    return fallback
  }
}
