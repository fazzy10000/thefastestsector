import { alpha3ToCountryName, countryNameToAlpha3, slugify } from '../countries'
import type { ScheduleEvent, SeriesSyncResult } from '../types'

type OpenF1Meeting = {
  meeting_key: number
  meeting_name: string
  location: string
  country_code: string
  country_name: string
  circuit_short_name: string
  date_start: string
  date_end: string
  gmt_offset?: string
  year: number
  is_cancelled?: boolean
}

function parseOffsetSeconds(gmtOffset: string | undefined): number {
  if (!gmtOffset) return 0
  const m = gmtOffset.trim().match(/^([+-]?)(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (!m) return 0
  const sign = m[1] === '-' ? -1 : 1
  const hours = Number(m[2])
  const mins = Number(m[3])
  const secs = Number(m[4] || 0)
  return sign * (hours * 3600 + mins * 60 + secs)
}

/** Calendar day in the meeting's local timezone. */
function localIsoDate(isoUtc: string, gmtOffset?: string): string {
  const ms = new Date(isoUtc).getTime() + parseOffsetSeconds(gmtOffset) * 1000
  return new Date(ms).toISOString().slice(0, 10)
}

function isTesting(name: string): boolean {
  return /testing|pre-season|preseason/i.test(name)
}

export async function fetchF1Schedule(year = new Date().getUTCFullYear()): Promise<SeriesSyncResult> {
  const source = `openf1:/v1/meetings?year=${year}`
  try {
    const res = await fetch(`https://api.openf1.org/v1/meetings?year=${year}`, {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`OpenF1 HTTP ${res.status}`)
    const meetings = (await res.json()) as OpenF1Meeting[]
    if (!Array.isArray(meetings) || meetings.length === 0) {
      throw new Error('OpenF1 returned no meetings')
    }

    const races = meetings
      .filter((m) => !m.is_cancelled && !isTesting(m.meeting_name))
      .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime())

    if (races.length < 10) throw new Error(`OpenF1 returned too few races (${races.length})`)

    const events: ScheduleEvent[] = races.map((m, index) => {
      const date = localIsoDate(m.date_start, m.gmt_offset)
      const endDate = localIsoDate(m.date_end || m.date_start, m.gmt_offset)
      // Malaysia stand-in for Bahrain GP: prefer venue country for flags
      let countryCode = (m.country_code || '').toUpperCase()
      if (/kuala lumpur|sepang/i.test(m.location) || /kuala lumpur/i.test(m.circuit_short_name)) {
        countryCode = 'MYS'
      } else if (countryCode.length !== 3) {
        countryCode = countryNameToAlpha3(m.country_name)
      }
      const country =
        countryCode === 'MYS' ? 'Malaysia' : m.country_name || alpha3ToCountryName(countryCode)
      const slug = slugify(m.meeting_name.replace(/grand prix/i, '').trim() || m.location)

      return {
        id: `f1-${year}-${slug || m.meeting_key}`,
        name: m.meeting_name,
        circuit: m.circuit_short_name || m.location,
        location: `${m.location}, ${country}`,
        country,
        countryCode: countryCode || 'OTH',
        date,
        endDate: endDate >= date ? endDate : date,
        series: 'f1',
        round: index + 1,
      }
    })

    return { series: 'f1', ok: true, events, source }
  } catch (err) {
    return {
      series: 'f1',
      ok: false,
      events: [],
      source,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
