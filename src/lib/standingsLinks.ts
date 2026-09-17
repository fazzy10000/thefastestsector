export const STANDINGS_SERIES = [
  'formula-1',
  'f2',
  'f3',
  'f1-academy',
  'formula-e',
  'indycar',
] as const

export type StandingsSeriesId = (typeof STANDINGS_SERIES)[number]

export function standingsPath(series?: StandingsSeriesId | null): string {
  if (!series) return '/standings'
  return `/standings?series=${series}`
}

export function parseStandingsSeries(value: string | null): StandingsSeriesId {
  if (value && (STANDINGS_SERIES as readonly string[]).includes(value)) {
    return value as StandingsSeriesId
  }
  return 'formula-1'
}
