import type { ScheduleEvent } from './types'

export type ScheduleEventWithStatus = ScheduleEvent & {
  status: 'upcoming' | 'completed' | 'live'
}

function endOfDayTimestamp(isoDate: string): number {
  return new Date(`${isoDate}T23:59:59.999`).getTime()
}

function startOfTodayTimestamp(now: number): number {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function withStatus(
  rows: ScheduleEvent[],
  now: number = Date.now(),
): ScheduleEventWithStatus[] {
  const sod = startOfTodayTimestamp(now)
  return rows.map((row) => {
    const end = endOfDayTimestamp(row.endDate)
    return {
      ...row,
      status: end < sod ? 'completed' : 'upcoming',
    }
  })
}

export function sortEventsChronologically<T extends ScheduleEvent>(events: T[]): T[] {
  return [...events].sort((a, b) => {
    const diff = new Date(a.date).getTime() - new Date(b.date).getTime()
    if (diff !== 0) return diff
    return a.round - b.round || a.id.localeCompare(b.id)
  })
}
