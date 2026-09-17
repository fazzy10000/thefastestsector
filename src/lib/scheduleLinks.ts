import type { RaceEvent } from './types'

export type SeriesFilter = 'all' | RaceEvent['series']

const VALID_SERIES = new Set<RaceEvent['series']>(['f1', 'f2', 'f3', 'fe', 'indycar', 'f1-academy'])

export function schedulePath(series?: RaceEvent['series'] | null): string {
  if (!series) return '/schedule'
  return `/schedule?series=${series}`
}

export function parseSeriesFilter(value: string | null): SeriesFilter {
  if (value && VALID_SERIES.has(value as RaceEvent['series'])) {
    return value as RaceEvent['series']
  }
  return 'all'
}
