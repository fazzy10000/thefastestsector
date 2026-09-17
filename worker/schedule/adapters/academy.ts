import type { ScheduleEvent, SeriesSyncResult } from '../types'

/**
 * F1 Academy official site sits behind a WAF that often blocks automated fetch.
 * Seed from the last known published 2026 calendar; replace when a scrape succeeds.
 */
const ACADEMY_SEED_2026: ScheduleEvent[] = [
  {
    id: 'fa-2026-shanghai',
    name: 'F1 Academy — Shanghai',
    circuit: 'Shanghai International Circuit',
    location: 'Shanghai, China',
    country: 'China',
    countryCode: 'CHN',
    date: '2026-03-13',
    endDate: '2026-03-15',
    series: 'f1-academy',
    round: 1,
  },
  {
    id: 'fa-2026-montreal',
    name: 'F1 Academy — Montreal',
    circuit: 'Circuit Gilles Villeneuve',
    location: 'Montreal, Canada',
    country: 'Canada',
    countryCode: 'CAN',
    date: '2026-05-22',
    endDate: '2026-05-24',
    series: 'f1-academy',
    round: 2,
  },
  {
    id: 'fa-2026-silverstone',
    name: 'F1 Academy — Silverstone',
    circuit: 'Silverstone Circuit',
    location: 'Silverstone, United Kingdom',
    country: 'United Kingdom',
    countryCode: 'GBR',
    date: '2026-07-03',
    endDate: '2026-07-05',
    series: 'f1-academy',
    round: 3,
  },
  {
    id: 'fa-2026-zandvoort',
    name: 'F1 Academy — Zandvoort',
    circuit: 'Circuit Zandvoort',
    location: 'Zandvoort, Netherlands',
    country: 'Netherlands',
    countryCode: 'NLD',
    date: '2026-08-21',
    endDate: '2026-08-23',
    series: 'f1-academy',
    round: 4,
  },
  {
    id: 'fa-2026-austin',
    name: 'F1 Academy — Austin',
    circuit: 'Circuit of the Americas',
    location: 'Austin, USA',
    country: 'United States',
    countryCode: 'USA',
    date: '2026-10-22',
    endDate: '2026-10-25',
    series: 'f1-academy',
    round: 5,
  },
  {
    id: 'fa-2026-las-vegas',
    name: 'F1 Academy — Las Vegas',
    circuit: 'Las Vegas Strip Circuit',
    location: 'Las Vegas, USA',
    country: 'United States',
    countryCode: 'USA',
    date: '2026-11-19',
    endDate: '2026-11-21',
    series: 'f1-academy',
    round: 6,
  },
]

async function tryScrapeAcademy(year: number): Promise<ScheduleEvent[] | null> {
  try {
    const res = await fetch('https://www.f1academy.com/Racing-Series/Calendar', {
      headers: {
        Accept: 'text/html',
        'User-Agent': 'TheFastestSectorScheduleBot/1.0 (+https://thefastestsector.com)',
      },
    })
    if (!res.ok) return null
    const html = await res.text()
    // Pulselive-backed pages sometimes embed race JSON; keep opportunistic.
    const match = html.match(/"races"\s*:\s*(\[[\s\S]*?\])\s*[,}]/)
    if (!match) return null
    const races = JSON.parse(match[1]) as Array<{
      name?: string
      startDate?: string
      endDate?: string
      circuitName?: string
      countryName?: string
    }>
    if (!Array.isArray(races) || races.length < 4) return null
    return races.map((race, index) => {
      const date = String(race.startDate || '').slice(0, 10)
      const endDate = String(race.endDate || race.startDate || '').slice(0, 10)
      const name = race.name || `F1 Academy Round ${index + 1}`
      return {
        id: `fa-${year}-${index + 1}`,
        name: name.startsWith('F1 Academy') ? name : `F1 Academy — ${name}`,
        circuit: race.circuitName || name,
        location: race.countryName || '',
        country: race.countryName || '',
        countryCode: 'OTH',
        date,
        endDate: endDate || date,
        series: 'f1-academy' as const,
        round: index + 1,
      }
    })
  } catch {
    return null
  }
}

export async function fetchAcademySchedule(
  year = new Date().getUTCFullYear(),
): Promise<SeriesSyncResult> {
  const scraped = await tryScrapeAcademy(year)
  if (scraped && scraped.length >= 4) {
    return {
      series: 'f1-academy',
      ok: true,
      events: scraped,
      source: 'f1academy.com/Racing-Series/Calendar',
    }
  }

  if (year === 2026) {
    return {
      series: 'f1-academy',
      ok: true,
      events: ACADEMY_SEED_2026,
      source: 'seed:f1-academy-2026',
    }
  }

  return {
    series: 'f1-academy',
    ok: false,
    events: [],
    source: 'f1academy.com|seed',
    error: `No Academy calendar available for ${year}`,
  }
}
