import { slugify } from '../countries'
import type { ScheduleEvent, SeriesId, SeriesSyncResult } from '../types'

const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
}

const VENUE_META: Record<
  string,
  { name: string; circuit: string; location: string; country: string; countryCode: string }
> = {
  melbourne: {
    name: 'Melbourne',
    circuit: 'Albert Park Circuit',
    location: 'Melbourne, Australia',
    country: 'Australia',
    countryCode: 'AUS',
  },
  miami: {
    name: 'Miami',
    circuit: 'Miami International Autodrome',
    location: 'Miami, USA',
    country: 'United States',
    countryCode: 'USA',
  },
  montreal: {
    name: 'Montreal',
    circuit: 'Circuit Gilles Villeneuve',
    location: 'Montreal, Canada',
    country: 'Canada',
    countryCode: 'CAN',
  },
  montréal: {
    name: 'Montreal',
    circuit: 'Circuit Gilles Villeneuve',
    location: 'Montreal, Canada',
    country: 'Canada',
    countryCode: 'CAN',
  },
  monaco: {
    name: 'Monaco',
    circuit: 'Circuit de Monaco',
    location: 'Monte Carlo, Monaco',
    country: 'Monaco',
    countryCode: 'MCO',
  },
  'monte carlo': {
    name: 'Monaco',
    circuit: 'Circuit de Monaco',
    location: 'Monte Carlo, Monaco',
    country: 'Monaco',
    countryCode: 'MCO',
  },
  barcelona: {
    name: 'Barcelona',
    circuit: 'Circuit de Barcelona-Catalunya',
    location: 'Barcelona, Spain',
    country: 'Spain',
    countryCode: 'ESP',
  },
  spielberg: {
    name: 'Spielberg',
    circuit: 'Red Bull Ring',
    location: 'Spielberg, Austria',
    country: 'Austria',
    countryCode: 'AUT',
  },
  silverstone: {
    name: 'Silverstone',
    circuit: 'Silverstone Circuit',
    location: 'Silverstone, United Kingdom',
    country: 'United Kingdom',
    countryCode: 'GBR',
  },
  'spa-francorchamps': {
    name: 'Spa-Francorchamps',
    circuit: 'Circuit de Spa-Francorchamps',
    location: 'Spa, Belgium',
    country: 'Belgium',
    countryCode: 'BEL',
  },
  spa: {
    name: 'Spa-Francorchamps',
    circuit: 'Circuit de Spa-Francorchamps',
    location: 'Spa, Belgium',
    country: 'Belgium',
    countryCode: 'BEL',
  },
  budapest: {
    name: 'Budapest',
    circuit: 'Hungaroring',
    location: 'Budapest, Hungary',
    country: 'Hungary',
    countryCode: 'HUN',
  },
  monza: {
    name: 'Monza',
    circuit: 'Autodromo Nazionale Monza',
    location: 'Monza, Italy',
    country: 'Italy',
    countryCode: 'ITA',
  },
  madrid: {
    name: 'Madrid',
    circuit: 'Madring',
    location: 'Madrid, Spain',
    country: 'Spain',
    countryCode: 'ESP',
  },
  baku: {
    name: 'Baku',
    circuit: 'Baku City Circuit',
    location: 'Baku, Azerbaijan',
    country: 'Azerbaijan',
    countryCode: 'AZE',
  },
  lusail: {
    name: 'Lusail',
    circuit: 'Lusail International Circuit',
    location: 'Lusail, Qatar',
    country: 'Qatar',
    countryCode: 'QAT',
  },
  'yas marina': {
    name: 'Yas Marina',
    circuit: 'Yas Marina Circuit',
    location: 'Abu Dhabi, UAE',
    country: 'United Arab Emirates',
    countryCode: 'ARE',
  },
  'abu dhabi': {
    name: 'Yas Marina',
    circuit: 'Yas Marina Circuit',
    location: 'Abu Dhabi, UAE',
    country: 'United Arab Emirates',
    countryCode: 'ARE',
  },
}

function toIso(day: number, monthAbbr: string, year: number): string | null {
  const month = MONTHS[monthAbbr.toLowerCase().slice(0, 3)]
  if (month === undefined) return null
  return new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10)
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
}

function venueKey(raw: string): string {
  return raw
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function metaForVenue(venue: string) {
  const key = venueKey(venue)
  return (
    VENUE_META[key] ||
    Object.entries(VENUE_META).find(([k]) => key.includes(k) || k.includes(key))?.[1] || {
      name: venue.trim(),
      circuit: venue.trim(),
      location: venue.trim(),
      country: '',
      countryCode: 'OTH',
    }
  )
}

/** Parse official F2/F3 calendar pages (`ROUND N DD - DD Mon Venue …`). */
export function parseFeederCalendarHtml(
  html: string,
  series: 'f2' | 'f3',
  year: number,
): ScheduleEvent[] {
  const text = stripTags(html)
  const byRound = new Map<number, ScheduleEvent>()

  // Prefer known venue tokens after the date range (avoids "Flag of …" alt text).
  const venueNames = Object.keys(VENUE_META)
    .filter((k) => k.length > 3)
    .sort((a, b) => b.length - a.length)
  const venueAlt = venueNames.map((v) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')

  const re = new RegExp(
    `ROUND\\s+(\\d+)\\D{0,60}?(\\d{2})\\s*-\\s*(\\d{2})\\s+([A-Za-z]{3})\\D{0,80}?(${venueAlt})`,
    'gi',
  )

  for (const match of text.matchAll(re)) {
    const round = Number(match[1])
    const date = toIso(Number(match[2]), match[4], year)
    const endDate = toIso(Number(match[3]), match[4], year)
    if (!date || !endDate || !round || byRound.has(round)) continue
    const meta = metaForVenue(match[5])
    if (meta.countryCode === 'OTH') continue
    const label = series === 'f2' ? 'Formula 2' : 'Formula 3'
    byRound.set(round, {
      id: `${series}-${year}-${slugify(meta.name) || round}`,
      name: `${label} — ${meta.name}`,
      circuit: meta.circuit,
      location: meta.location,
      country: meta.country,
      countryCode: meta.countryCode,
      date,
      endDate,
      series,
      round,
    })
  }

  return [...byRound.values()].sort((a, b) => a.round - b.round)
}

const F2_SEED_2026: ScheduleEvent[] = [
  seed('f2', 2026, 1, 'Melbourne', '2026-03-06', '2026-03-08'),
  seed('f2', 2026, 2, 'Miami', '2026-05-01', '2026-05-03'),
  seed('f2', 2026, 3, 'Montreal', '2026-05-22', '2026-05-24'),
  seed('f2', 2026, 4, 'Monaco', '2026-06-04', '2026-06-07'),
  seed('f2', 2026, 5, 'Barcelona', '2026-06-12', '2026-06-14'),
  seed('f2', 2026, 6, 'Spielberg', '2026-06-26', '2026-06-28'),
  seed('f2', 2026, 7, 'Silverstone', '2026-07-03', '2026-07-05'),
  seed('f2', 2026, 8, 'Spa-Francorchamps', '2026-07-17', '2026-07-19'),
  seed('f2', 2026, 9, 'Budapest', '2026-07-24', '2026-07-26'),
  seed('f2', 2026, 10, 'Monza', '2026-09-04', '2026-09-06'),
  seed('f2', 2026, 11, 'Madrid', '2026-09-11', '2026-09-13'),
  seed('f2', 2026, 12, 'Baku', '2026-09-24', '2026-09-26'),
  seed('f2', 2026, 13, 'Lusail', '2026-11-27', '2026-11-29'),
  seed('f2', 2026, 14, 'Yas Marina', '2026-12-04', '2026-12-06'),
]

const F3_SEED_2026: ScheduleEvent[] = [
  seed('f3', 2026, 1, 'Melbourne', '2026-03-06', '2026-03-08'),
  seed('f3', 2026, 2, 'Monaco', '2026-06-04', '2026-06-07'),
  seed('f3', 2026, 3, 'Barcelona', '2026-06-12', '2026-06-14'),
  seed('f3', 2026, 4, 'Spielberg', '2026-06-26', '2026-06-28'),
  seed('f3', 2026, 5, 'Silverstone', '2026-07-03', '2026-07-05'),
  seed('f3', 2026, 6, 'Spa-Francorchamps', '2026-07-17', '2026-07-19'),
  seed('f3', 2026, 7, 'Budapest', '2026-07-24', '2026-07-26'),
  seed('f3', 2026, 8, 'Monza', '2026-09-04', '2026-09-06'),
  seed('f3', 2026, 9, 'Madrid', '2026-09-11', '2026-09-13'),
]

function seed(
  series: 'f2' | 'f3',
  year: number,
  round: number,
  venue: string,
  date: string,
  endDate: string,
): ScheduleEvent {
  const meta = metaForVenue(venue)
  const label = series === 'f2' ? 'Formula 2' : 'Formula 3'
  return {
    id: `${series}-${year}-${slugify(meta.name)}`,
    name: `${label} — ${meta.name}`,
    circuit: meta.circuit,
    location: meta.location,
    country: meta.country,
    countryCode: meta.countryCode,
    date,
    endDate,
    series,
    round,
  }
}

async function fetchFeederSeries(
  series: 'f2' | 'f3',
  year: number,
): Promise<SeriesSyncResult> {
  const host = series === 'f2' ? 'www.fiaformula2.com' : 'www.fiaformula3.com'
  const source = `${host}/en/racing/${year}`
  const seed = series === 'f2' ? F2_SEED_2026 : F3_SEED_2026

  try {
    const res = await fetch(`https://${host}/en/racing/${year}`, {
      headers: {
        Accept: 'text/html',
        'User-Agent': 'TheFastestSectorScheduleBot/1.0 (+https://thefastestsector.com)',
      },
    })
    if (!res.ok) throw new Error(`${series.toUpperCase()} calendar HTTP ${res.status}`)
    const html = await res.text()
    const parsed = parseFeederCalendarHtml(html, series, year)
    const minRounds = series === 'f2' ? 12 : 8
    if (parsed.length >= minRounds) {
      return { series, ok: true, events: parsed, source }
    }
    if (year === 2026) {
      // Official pages are heavily client-rendered; keep published seed when parse is incomplete.
      return {
        series,
        ok: true,
        events: seed,
        source: parsed.length
          ? `seed:${series}-2026+partial-html(${parsed.length})`
          : `seed:${series}-2026`,
      }
    }
    throw new Error(`Parsed only ${parsed.length} ${series.toUpperCase()} rounds`)
  } catch (err) {
    if (year === 2026) {
      return {
        series,
        ok: true,
        events: seed,
        source: `seed:${series}-2026`,
      }
    }
    return {
      series,
      ok: false,
      events: [],
      source,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

export async function fetchF2Schedule(year = new Date().getUTCFullYear()): Promise<SeriesSyncResult> {
  return fetchFeederSeries('f2', year)
}

export async function fetchF3Schedule(year = new Date().getUTCFullYear()): Promise<SeriesSyncResult> {
  return fetchFeederSeries('f3', year)
}

export type { SeriesId }
