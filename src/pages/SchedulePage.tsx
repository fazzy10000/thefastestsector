import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, MapPin, Sparkles } from 'lucide-react'
import SEO from '../components/SEO'
import type { RaceEvent } from '../lib/types'
import { flagEmojiFromCountryCode } from '../lib/countryFlags'
import { buildRaceSchedule, sortEventsChronologically } from '../data/raceSchedule2026'

type SeriesFilter = 'all' | RaceEvent['series']

const SERIES_TABS: { id: SeriesFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'f1', label: 'Formula 1' },
  { id: 'fe', label: 'Formula E' },
  { id: 'indycar', label: 'IndyCar' },
  { id: 'f1-academy', label: 'F1 Academy' },
]

const SERIES_LABEL: Record<RaceEvent['series'], string> = {
  f1: 'Formula 1',
  fe: 'Formula E',
  indycar: 'IndyCar',
  'f1-academy': 'F1 Academy',
}

const SERIES_BADGE_CLASS: Record<RaceEvent['series'], string> = {
  f1: 'bg-badge-f1 text-white',
  fe: 'bg-badge-fe text-white',
  indycar: 'bg-badge-indycar text-white',
  'f1-academy': 'bg-badge-f1 text-white',
}

function formatRaceDateRange(dateIso: string, endIso: string): string {
  const start = new Date(`${dateIso}T12:00:00`)
  const end = new Date(`${endIso}T12:00:00`)
  const sameMonth =
    start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()
  const sameDay = dateIso === endIso

  const monthDay = (d: Date, withYear: boolean) =>
    d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      ...(withYear ? { year: 'numeric' } : {}),
    })

  if (sameDay) {
    return monthDay(start, true)
  }
  if (sameMonth) {
    return `${start.toLocaleDateString(undefined, { month: 'short' })} ${start.getDate()}-${end.getDate()}, ${end.getFullYear()}`
  }
  return `${monthDay(start, false)} – ${monthDay(end, true)}`
}

function findNextUpcomingId(events: RaceEvent[]): string | null {
  const sorted = sortEventsChronologically(events)
  for (const e of sorted) {
    if (e.status === 'upcoming') return e.id
  }
  return null
}

export default function SchedulePage() {
  const [series, setSeries] = useState<SeriesFilter>('all')
  const nextRef = useRef<HTMLDivElement | null>(null)
  const didScroll = useRef(false)

  const allEvents = useMemo(() => buildRaceSchedule(Date.now()), [])

  const filtered = useMemo(() => {
    const list = series === 'all' ? allEvents : allEvents.filter((e) => e.series === series)
    return sortEventsChronologically(list)
  }, [allEvents, series])

  const nextId = useMemo(() => findNextUpcomingId(filtered), [filtered])

  useEffect(() => {
    didScroll.current = false
  }, [series])

  useEffect(() => {
    if (!nextId || didScroll.current) return
    const t = window.setTimeout(() => {
      nextRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      didScroll.current = true
    }, 100)
    return () => window.clearTimeout(t)
  }, [nextId, filtered])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <SEO
        title="Race Schedule"
        description="2026 motorsport race calendar — Formula 1, Formula E, IndyCar, and F1 Academy. Filter by series and see what is next on track."
      />

      <header className="mb-8">
        <h1 className="text-3xl font-black text-text-primary dark:text-white tracking-tight">
          Race Schedule
        </h1>
        <p className="text-text-secondary dark:text-white/50 mt-2 max-w-2xl text-sm sm:text-base leading-relaxed">
          Key rounds for the 2026 season across Formula 1, Formula E, IndyCar, and F1 Academy. Dates
          are grouped by weekend; completed events are muted so you can focus on what is ahead.
        </p>
      </header>

      {/* Series tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-8 -mx-1 px-1 scrollbar-hide">
        {SERIES_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSeries(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              series === tab.id
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((event) => {
          const isNext = event.id === nextId
          const completed = event.status === 'completed'
          const flag = flagEmojiFromCountryCode(event.countryCode)

          return (
            <div
              key={event.id}
              ref={isNext ? nextRef : undefined}
              className={`rounded-xl border transition-colors ${
                completed
                  ? 'border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.03] opacity-70 dark:opacity-60'
                  : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.06] shadow-sm dark:shadow-none'
              } ${isNext ? 'ring-2 ring-primary/40 dark:ring-primary/50' : ''}`}
            >
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <span
                    className={`text-3xl sm:text-4xl leading-none shrink-0 ${completed ? 'grayscale' : ''}`}
                    aria-hidden
                  >
                    {flag}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2
                        className={`font-bold text-base sm:text-lg leading-snug ${
                          completed
                            ? 'text-text-secondary dark:text-white/45'
                            : 'text-text-primary dark:text-white'
                        }`}
                      >
                        {event.name}
                      </h2>
                      {isNext && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-primary text-white">
                          <Sparkles className="w-3 h-3" />
                          Next race
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-sm ${completed ? 'text-text-secondary/80 dark:text-white/35' : 'text-text-secondary dark:text-white/55'}`}
                    >
                      {event.circuit}
                    </p>
                    <p
                      className={`flex items-center gap-1.5 text-sm mt-2 ${completed ? 'text-text-secondary/70 dark:text-white/30' : 'text-text-secondary dark:text-white/45'}`}
                    >
                      <MapPin className="w-4 h-4 shrink-0 opacity-70" />
                      {event.location}
                    </p>
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col flex-wrap sm:items-end gap-2 sm:gap-3 shrink-0 sm:text-right w-full sm:w-auto justify-between sm:justify-start border-t border-gray-100 dark:border-white/5 pt-3 sm:pt-0 sm:border-0 sm:pl-2">
                  <div
                    className={`flex items-center gap-2 text-sm font-medium ${
                      completed ? 'text-text-secondary dark:text-white/40' : 'text-text-primary dark:text-white'
                    }`}
                  >
                    <CalendarDays className="w-4 h-4 opacity-70" />
                    {formatRaceDateRange(event.date, event.endDate)}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 justify-end">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-md ${SERIES_BADGE_CLASS[event.series]}`}
                    >
                      {SERIES_LABEL[event.series]}
                    </span>
                    <span
                      className={`text-xs font-semibold tabular-nums px-2 py-1 rounded-md ${
                        completed
                          ? 'bg-gray-200/80 dark:bg-white/10 text-text-secondary dark:text-white/45'
                          : 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-red-300'
                      }`}
                    >
                      R{event.round}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-text-secondary dark:text-white/50 py-12 text-sm">
          No races for this filter.
        </p>
      )}
    </div>
  )
}
