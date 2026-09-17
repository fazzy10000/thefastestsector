export type SeriesId = 'f1' | 'f2' | 'f3' | 'fe' | 'indycar' | 'f1-academy'

/** Calendar row without derived `status` (status is computed at read time). */
export interface ScheduleEvent {
  id: string
  name: string
  circuit: string
  location: string
  country: string
  countryCode: string
  date: string
  endDate: string
  series: SeriesId
  round: number
}

export interface SeriesSyncResult {
  series: SeriesId
  ok: boolean
  events: ScheduleEvent[]
  error?: string
  source: string
}

export interface ScheduleSourceMeta {
  ok: boolean
  source: string
  count: number
  error?: string
  syncedAt: number
}

export type ScheduleSources = Record<SeriesId, ScheduleSourceMeta>
