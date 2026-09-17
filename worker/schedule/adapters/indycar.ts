import { slugify } from '../countries'
import type { ScheduleEvent, SeriesSyncResult } from '../types'

const INDY_META: {
  match: RegExp
  circuit: string
  location: string
  countryCode: string
  country: string
}[] = [
  {
    match: /st-?petersburg|st\.?\s*petersburg/i,
    circuit: 'St. Petersburg Street Circuit',
    location: 'St. Petersburg, USA',
    countryCode: 'USA',
    country: 'United States',
  },
  {
    match: /phoenix|good ranchers/i,
    circuit: 'Phoenix Raceway',
    location: 'Avondale, USA',
    countryCode: 'USA',
    country: 'United States',
  },
  {
    match: /arlington/i,
    circuit: 'Streets of Arlington',
    location: 'Arlington, USA',
    countryCode: 'USA',
    country: 'United States',
  },
  {
    match: /alabama|barber/i,
    circuit: 'Barber Motorsports Park',
    location: 'Birmingham, USA',
    countryCode: 'USA',
    country: 'United States',
  },
  {
    match: /long-?beach/i,
    circuit: 'Long Beach Street Circuit',
    location: 'Long Beach, USA',
    countryCode: 'USA',
    country: 'United States',
  },
  {
    match: /indianapolis-500|indianapolis 500|indy 500/i,
    circuit: 'Indianapolis Motor Speedway',
    location: 'Indianapolis, USA',
    countryCode: 'USA',
    country: 'United States',
  },
  {
    match: /indianapolis|sonsio/i,
    circuit: 'Indianapolis Motor Speedway Road Course',
    location: 'Indianapolis, USA',
    countryCode: 'USA',
    country: 'United States',
  },
  {
    match: /detroit/i,
    circuit: 'Detroit Street Circuit',
    location: 'Detroit, USA',
    countryCode: 'USA',
    country: 'United States',
  },
  {
    match: /wwtr|illinois|gateway|bommarito/i,
    circuit: 'World Wide Technology Raceway',
    location: 'Madison, USA',
    countryCode: 'USA',
    country: 'United States',
  },
  {
    match: /road-?america/i,
    circuit: 'Road America',
    location: 'Elkhart Lake, USA',
    countryCode: 'USA',
    country: 'United States',
  },
  {
    match: /mid-?ohio/i,
    circuit: 'Mid-Ohio Sports Car Course',
    location: 'Lexington, USA',
    countryCode: 'USA',
    country: 'United States',
  },
  {
    match: /nashville|music city/i,
    circuit: 'Nashville Superspeedway',
    location: 'Lebanon, USA',
    countryCode: 'USA',
    country: 'United States',
  },
  {
    match: /portland/i,
    circuit: 'Portland International Raceway',
    location: 'Portland, USA',
    countryCode: 'USA',
    country: 'United States',
  },
  {
    match: /ontario|markham/i,
    circuit: 'Streets of Markham',
    location: 'Markham, Canada',
    countryCode: 'CAN',
    country: 'Canada',
  },
  {
    match: /washington/i,
    circuit: 'Streets of Washington',
    location: 'Washington, D.C., USA',
    countryCode: 'USA',
    country: 'United States',
  },
  {
    match: /milwaukee|makers and fixers/i,
    circuit: 'Milwaukee Mile',
    location: 'West Allis, USA',
    countryCode: 'USA',
    country: 'United States',
  },
  {
    match: /monterey|laguna/i,
    circuit: 'WeatherTech Raceway Laguna Seca',
    location: 'Monterey, USA',
    countryCode: 'USA',
    country: 'United States',
  },
]

const MONTHS: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
}

function metaFor(nameOrSlug: string) {
  return (
    INDY_META.find((row) => row.match.test(nameOrSlug)) || {
      circuit: nameOrSlug,
      location: 'USA',
      countryCode: 'USA',
      country: 'United States',
    }
  )
}

function decodeEntities(raw: string): string {
  return raw
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\u00a0/g, ' ')
    .trim()
}

/** Parse "Mar 7" / "Aug 30" style headers into ISO dates. */
function parseCardDate(raw: string, year: number): string | null {
  const cleaned = decodeEntities(raw).replace(/\s+/g, ' ')
  const m = cleaned.match(/^([A-Za-z]+)\s+(\d{1,2})$/)
  if (!m) return null
  const month = MONTHS[m[1].toLowerCase()]
  const day = Number(m[2])
  if (month === undefined || !day) return null
  const dt = new Date(Date.UTC(year, month, day))
  return dt.toISOString().slice(0, 10)
}

function shiftIsoDay(iso: string, deltaDays: number): string {
  const dt = new Date(`${iso}T12:00:00Z`)
  dt.setUTCDate(dt.getUTCDate() + deltaDays)
  return dt.toISOString().slice(0, 10)
}

type ParsedCard = { date: string; name: string; slug: string }

/**
 * Official IndyCar schedule page event cards.
 * Card header dates are race days (more accurate than event-page JSON-LD,
 * which is usually the weekend start). Milwaukee Race 1 is often mistagged
 * with Race 2's Sunday date on the listing — correct that when both appear.
 */
function parseIndyCarScheduleHtml(html: string, year: number): ParsedCard[] {
  const cardRe =
    /class="event-card[^"]*"[\s\S]*?event-card-header-date[^>]*>([^<]+)<[\s\S]*?href="\/Schedule\/(\d{4})\/([^"]+)"[\s\S]*?<h3[^>]*class="event-card-title"[^>]*>\s*([^<]+)\s*<\/h3>/gi

  const seen = new Set<string>()
  const rows: ParsedCard[] = []

  for (const match of html.matchAll(cardRe)) {
    const cardYear = Number(match[2])
    if (cardYear !== year) continue
    const date = parseCardDate(match[1], year)
    if (!date) continue
    const slug = match[3].replace(/\/+$/, '')
    const name = decodeEntities(match[4])
    if (!name || !slug) continue
    const key = `${slug}|${name}`
    if (seen.has(key)) continue
    seen.add(key)
    rows.push({ date, name, slug })
  }

  // Listing bug: both Milwaukee races often share Race 2's Sunday date.
  const race1 = rows.find((r) => /milwaukee-race-?1/i.test(r.slug) || /makers and fixers/i.test(r.name))
  const race2 = rows.find((r) => /milwaukee-race-?2/i.test(r.slug) || (/milwaukee mile 250/i.test(r.name) && !/makers/i.test(r.name)))
  if (race1 && race2 && race1.date === race2.date) {
    race1.date = shiftIsoDay(race2.date, -1)
  }

  rows.sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name))
  return rows
}

export async function fetchIndyCarSchedule(
  year = new Date().getUTCFullYear(),
): Promise<SeriesSyncResult> {
  const source = 'indycar.com/Schedule'
  try {
    const res = await fetch('https://www.indycar.com/Schedule', {
      headers: {
        Accept: 'text/html',
        'User-Agent': 'TheFastestSectorScheduleBot/1.0 (+https://thefastestsector.com)',
      },
    })
    if (!res.ok) throw new Error(`IndyCar schedule HTTP ${res.status}`)
    const html = await res.text()
    const rows = parseIndyCarScheduleHtml(html, year)
    if (rows.length < 10) throw new Error(`IndyCar HTML parse found ${rows.length} events`)

    const events: ScheduleEvent[] = rows.map((row, index) => {
      const meta = metaFor(`${row.slug} ${row.name}`)
      return {
        id: `indy-${year}-${slugify(row.slug || row.name)}`,
        name: row.name,
        circuit: meta.circuit,
        location: meta.location,
        country: meta.country,
        countryCode: meta.countryCode,
        date: row.date,
        endDate: row.date,
        series: 'indycar',
        round: index + 1,
      }
    })

    return { series: 'indycar', ok: true, events, source }
  } catch (err) {
    return {
      series: 'indycar',
      ok: false,
      events: [],
      source,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
