import { useEffect, useState } from 'react'
import { buildRaceSchedule, sortEventsChronologically } from '../data/raceSchedule2026'
import { api } from '../lib/api'
import type { RaceEvent } from '../lib/types'

type ScheduleResponse = {
  events: RaceEvent[]
  syncedAt?: number | null
  sources?: Record<string, unknown>
}

function staticFallback(): RaceEvent[] {
  return sortEventsChronologically(buildRaceSchedule())
}

export function useRaceSchedule() {
  const [events, setEvents] = useState<RaceEvent[]>(() => staticFallback())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncedAt, setSyncedAt] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const data = await api<ScheduleResponse>('/api/schedule')
        if (cancelled) return
        if (Array.isArray(data.events) && data.events.length > 0) {
          setEvents(sortEventsChronologically(data.events))
          setSyncedAt(data.syncedAt ?? null)
          setError(null)
        } else {
          setEvents(staticFallback())
          setError('Schedule API returned no events')
        }
      } catch (err) {
        if (cancelled) return
        setEvents(staticFallback())
        setError(err instanceof Error ? err.message : 'Failed to load schedule')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return { events, loading, error, syncedAt }
}
