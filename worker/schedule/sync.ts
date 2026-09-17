import { fetchAcademySchedule } from './adapters/academy'
import { fetchF1Schedule } from './adapters/f1'
import { fetchFeSchedule } from './adapters/fe'
import { fetchF2Schedule, fetchF3Schedule } from './adapters/feeder'
import { fetchIndyCarSchedule } from './adapters/indycar'
import { sortEventsChronologically } from './status'
import type { ScheduleEvent, ScheduleSourceMeta, ScheduleSources, SeriesId } from './types'

const SNAPSHOT_ID = 'live'
const SERIES: SeriesId[] = ['f1', 'f2', 'f3', 'fe', 'indycar', 'f1-academy']

export async function ensureScheduleTable(db: D1Database): Promise<void> {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS schedule_snapshot (
        id TEXT PRIMARY KEY,
        events_json TEXT NOT NULL DEFAULT '[]',
        sources_json TEXT NOT NULL DEFAULT '{}',
        synced_at INTEGER NOT NULL
      )`,
    )
    .run()
}

function parseEvents(raw: string | null | undefined): ScheduleEvent[] {
  try {
    const value = JSON.parse(raw || '[]')
    return Array.isArray(value) ? (value as ScheduleEvent[]) : []
  } catch {
    return []
  }
}

function parseSources(raw: string | null | undefined): Partial<ScheduleSources> {
  try {
    const value = JSON.parse(raw || '{}')
    return value && typeof value === 'object' ? (value as Partial<ScheduleSources>) : {}
  } catch {
    return {}
  }
}

export async function readScheduleSnapshot(db: D1Database): Promise<{
  events: ScheduleEvent[]
  sources: Partial<ScheduleSources>
  syncedAt: number | null
}> {
  await ensureScheduleTable(db)
  const row = await db
    .prepare('SELECT events_json, sources_json, synced_at FROM schedule_snapshot WHERE id = ?')
    .bind(SNAPSHOT_ID)
    .first<{ events_json: string; sources_json: string; synced_at: number }>()

  if (!row) return { events: [], sources: {}, syncedAt: null }
  return {
    events: parseEvents(row.events_json),
    sources: parseSources(row.sources_json),
    syncedAt: row.synced_at ?? null,
  }
}

function eventsForSeries(events: ScheduleEvent[], series: SeriesId): ScheduleEvent[] {
  return events.filter((e) => e.series === series)
}

/**
 * Fetch each series independently. Keep last-good rows per series on failure.
 * Never wipe the whole calendar when one (or all) adapters fail.
 */
export async function syncSchedule(db: D1Database): Promise<{
  events: ScheduleEvent[]
  sources: ScheduleSources
  syncedAt: number
  changed: boolean
}> {
  await ensureScheduleTable(db)
  const previous = await readScheduleSnapshot(db)
  const now = Date.now()

  const results = await Promise.all([
    fetchF1Schedule(),
    fetchF2Schedule(),
    fetchF3Schedule(),
    fetchFeSchedule(),
    fetchIndyCarSchedule(),
    fetchAcademySchedule(),
  ])

  const bySeries = new Map(results.map((r) => [r.series, r]))
  const merged: ScheduleEvent[] = []
  const sources = {} as ScheduleSources

  for (const series of SERIES) {
    const result = bySeries.get(series)
    const prevEvents = eventsForSeries(previous.events, series)
    const prevMeta = previous.sources[series]

    if (result?.ok && result.events.length > 0) {
      merged.push(...result.events)
      sources[series] = {
        ok: true,
        source: result.source,
        count: result.events.length,
        syncedAt: now,
      }
    } else {
      merged.push(...prevEvents)
      sources[series] = {
        ok: false,
        source: result?.source || prevMeta?.source || 'unknown',
        count: prevEvents.length,
        error: result?.error || 'sync failed',
        syncedAt: prevMeta?.syncedAt || previous.syncedAt || now,
      }
    }
  }

  const events = sortEventsChronologically(merged)
  const changed =
    JSON.stringify(events) !== JSON.stringify(sortEventsChronologically(previous.events))

  // Persist even when nothing changed so synced_at / source health stay current.
  await db
    .prepare(
      `INSERT INTO schedule_snapshot (id, events_json, sources_json, synced_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         events_json = excluded.events_json,
         sources_json = excluded.sources_json,
         synced_at = excluded.synced_at`,
    )
    .bind(SNAPSHOT_ID, JSON.stringify(events), JSON.stringify(sources), now)
    .run()

  return { events, sources, syncedAt: now, changed }
}

export type { ScheduleSourceMeta }
