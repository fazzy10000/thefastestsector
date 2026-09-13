import { useEffect, useState } from 'react'
import {
  applyEventStatus,
  fetchF1Schedule,
  fetchIndyCarSchedule,
} from '../lib/scheduleApi'
import {
  buildRaceSchedule,
  buildStaticOtherSeriesSchedule,
  sortEventsChronologically,
} from '../data/raceSchedule2026'
import type { RaceEvent } from '../lib/types'

const CACHE_TTL_MS = 60 * 60 * 1000

let cached: { events: RaceEvent[]; fetchedAt: number } | null = null
let inflight: Promise<RaceEvent[]> | null = null

async function loadRaceSchedule(): Promise<RaceEvent[]> {
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.events
  }

  if (inflight) return inflight

  inflight = (async () => {
    const now = Date.now()
    const [f1Result, indyResult] = await Promise.allSettled([
      fetchF1Schedule(),
      fetchIndyCarSchedule(),
    ])

    const otherSeries = buildStaticOtherSeriesSchedule(now)
    const rows: Omit<RaceEvent, 'status'>[] = []

    if (f1Result.status === 'fulfilled') {
      rows.push(...f1Result.value)
    }
    if (indyResult.status === 'fulfilled') {
      rows.push(...indyResult.value)
    }
    rows.push(...otherSeries.map(({ status: _status, ...rest }) => rest))

    if (f1Result.status === 'rejected' && indyResult.status === 'rejected') {
      const fallback = buildRaceSchedule(now)
      cached = { events: fallback, fetchedAt: Date.now() }
      return fallback
    }

    if (f1Result.status === 'rejected') {
      rows.push(
        ...buildRaceSchedule(now)
          .filter((e) => e.series === 'f1')
          .map(({ status: _status, ...rest }) => rest),
      )
    }

    if (indyResult.status === 'rejected') {
      rows.push(
        ...buildRaceSchedule(now)
          .filter((e) => e.series === 'indycar')
          .map(({ status: _status, ...rest }) => rest),
      )
    }

    const events = sortEventsChronologically(applyEventStatus(rows, now))
    cached = { events, fetchedAt: Date.now() }
    return events
  })()

  try {
    return await inflight
  } finally {
    inflight = null
  }
}

export function useRaceSchedule() {
  const [events, setEvents] = useState<RaceEvent[]>(() => cached?.events ?? buildRaceSchedule())
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    void loadRaceSchedule()
      .then((next) => {
        if (!cancelled) {
          setEvents(next)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setEvents(buildRaceSchedule())
          setError(err instanceof Error ? err.message : 'Failed to load schedule')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { events, loading, error }
}
