import { alpha2ToAlpha3, alpha3ToCountryName, slugify } from '../countries'
import type { ScheduleEvent, SeriesSyncResult } from '../types'

type FeSportsEvent = {
  '@type'?: string
  name?: string
  startDate?: string
  endDate?: string
  location?: {
    name?: string
    address?: { addressLocality?: string; addressCountry?: string }
  }
}

type FeListItem = {
  '@type'?: string
  position?: number
  item?: FeSportsEvent
}

const FE_VENUE: Record<
  string,
  { name: string; circuit: string; city: string }
> = {
  jeddah: { name: 'Jeddah E-Prix', circuit: 'Jeddah Corniche Circuit', city: 'Jeddah, Saudi Arabia' },
  'mexico city': {
    name: 'Mexico City E-Prix',
    circuit: 'Autódromo Hermanos Rodríguez',
    city: 'Mexico City, Mexico',
  },
  americas: { name: 'Austin E-Prix', circuit: 'Circuit of the Americas', city: 'Austin, USA' },
  austin: { name: 'Austin E-Prix', circuit: 'Circuit of the Americas', city: 'Austin, USA' },
  'miami ia': { name: 'Miami E-Prix', circuit: 'Miami International Autodrome', city: 'Miami, USA' },
  miami: { name: 'Miami E-Prix', circuit: 'Miami International Autodrome', city: 'Miami, USA' },
  'sao paulo': {
    name: 'São Paulo E-Prix',
    circuit: 'Anhembi Sambadrome Circuit',
    city: 'São Paulo, Brazil',
  },
  sanya: { name: 'Sanya E-Prix', circuit: 'Haitang Bay Circuit', city: 'Sanya, China' },
  'monte carlo': { name: 'Monaco E-Prix', circuit: 'Circuit de Monaco', city: 'Monte Carlo, Monaco' },
  monaco: { name: 'Monaco E-Prix', circuit: 'Circuit de Monaco', city: 'Monte Carlo, Monaco' },
  tempelhof: {
    name: 'Berlin E-Prix',
    circuit: 'Tempelhof Airport Street Circuit',
    city: 'Berlin, Germany',
  },
  berlin: {
    name: 'Berlin E-Prix',
    circuit: 'Tempelhof Airport Street Circuit',
    city: 'Berlin, Germany',
  },
  'brands hatch': { name: 'London E-Prix', circuit: 'Brands Hatch', city: 'Kent, United Kingdom' },
  london: { name: 'London E-Prix', circuit: 'Brands Hatch', city: 'Kent, United Kingdom' },
  zandvoort: { name: 'Zandvoort E-Prix', circuit: 'Circuit Zandvoort', city: 'Zandvoort, Netherlands' },
  jarama: {
    name: 'Madrid E-Prix',
    circuit: 'Circuito de Madrid Jarama-RACE',
    city: 'Madrid, Spain',
  },
  madrid: {
    name: 'Madrid E-Prix',
    circuit: 'Circuito de Madrid Jarama-RACE',
    city: 'Madrid, Spain',
  },
  shanghai: {
    name: 'Shanghai E-Prix',
    circuit: 'Shanghai International Circuit',
    city: 'Shanghai, China',
  },
  tokyo: { name: 'Tokyo E-Prix', circuit: 'Tokyo Street Circuit', city: 'Tokyo, Japan' },
}

function venueKey(locName: string, city: string): string {
  return (locName || city || '').trim().toLowerCase()
}

function decodeHtmlEntities(raw: string): string {
  return raw
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function extractSeason13List(html: string): FeListItem[] {
  const blocks = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
  for (const block of blocks) {
    try {
      const data = JSON.parse(decodeHtmlEntities(block[1].trim())) as {
        '@type'?: string
        name?: string
        itemListElement?: FeListItem[]
      }
      if (
        data['@type'] === 'ItemList' &&
        Array.isArray(data.itemListElement) &&
        /season\s*13/i.test(data.name || '')
      ) {
        return data.itemListElement
      }
    } catch {
      // try next block
    }
  }
  throw new Error('Season 13 ItemList JSON-LD not found')
}

export async function fetchFeSchedule(): Promise<SeriesSyncResult> {
  const source = 'fiaformulae.com/en/calendar#json-ld'
  try {
    const res = await fetch('https://www.fiaformulae.com/en/calendar', {
      headers: {
        Accept: 'text/html',
        'User-Agent': 'TheFastestSectorScheduleBot/1.0 (+https://thefastestsector.com)',
      },
    })
    if (!res.ok) throw new Error(`Formula E calendar HTTP ${res.status}`)
    const html = await res.text()
    const items = extractSeason13List(html)
    if (items.length < 8) throw new Error(`Too few FE events (${items.length})`)

    const sorted = items
      .map((row) => row.item)
      .filter((item): item is FeSportsEvent => Boolean(item?.startDate))
      .sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)))

    // Tag double-headers (same city on consecutive days)
    const twinCounts = new Map<string, number>()
    const twinIndex = new Map<string, number>()
    for (const item of sorted) {
      const city = item.location?.address?.addressLocality || item.location?.name || ''
      twinCounts.set(city, (twinCounts.get(city) || 0) + 1)
    }

    const events: ScheduleEvent[] = sorted.map((item, index) => {
      const city = item.location?.address?.addressLocality || ''
      const locName = item.location?.name || city
      const key = venueKey(locName, city)
      const meta = FE_VENUE[key] || FE_VENUE[city.toLowerCase()]
      const countryCode = alpha2ToAlpha3(item.location?.address?.addressCountry || '')
      const country = alpha3ToCountryName(countryCode)
      const date = String(item.startDate).slice(0, 10)
      const endDate = String(item.endDate || item.startDate).slice(0, 10)

      let name = meta?.name || (item.name && item.name !== 'TBC' ? item.name : `${city || locName} E-Prix`)
      if ((twinCounts.get(city) || 0) > 1) {
        const n = (twinIndex.get(city) || 0) + 1
        twinIndex.set(city, n)
        name = `${name.replace(/ — Race \d+$/, '')} — Race ${n}`
      }

      const slug = slugify(`${city || locName}-${date}`)
      return {
        id: `fe-${slug}`,
        name,
        circuit: meta?.circuit || locName || city,
        location: meta?.city || `${city}, ${country}`,
        country,
        countryCode,
        date,
        endDate,
        series: 'fe',
        round: index + 1,
      }
    })

    return { series: 'fe', ok: true, events, source }
  } catch (err) {
    return {
      series: 'fe',
      ok: false,
      events: [],
      source,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
