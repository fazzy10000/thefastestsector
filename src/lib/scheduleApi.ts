import type { RaceEvent } from './types'

const F1_BASE = 'https://api.jolpi.ca/ergast/f1'
const MOTO_DB = 'https://cdn.jsdelivr.net/gh/vishwapramuditha/moto-db@main/data'

interface ErgastSession {
  date: string
  time?: string
}

interface ErgastRace {
  season: string
  round: string
  raceName: string
  date: string
  time?: string
  Circuit: {
    circuitId: string
    circuitName: string
    Location: {
      locality: string
      country: string
    }
  }
  FirstPractice?: ErgastSession
  SecondPractice?: ErgastSession
  ThirdPractice?: ErgastSession
  Qualifying?: ErgastSession
  Sprint?: ErgastSession
  SprintQualifying?: ErgastSession
}

interface MotoDbIndyRace {
  event_id: string
  name: string
  date: string
  completed?: boolean
  status?: string
}

interface MotoDbIndySchedule {
  races: MotoDbIndyRace[]
}

const COUNTRY_NAME_TO_ALPHA3: Record<string, string> = {
  Australia: 'AUS',
  Austria: 'AUT',
  Azerbaijan: 'AZE',
  Bahrain: 'BHR',
  Belgium: 'BEL',
  Brazil: 'BRA',
  Canada: 'CAN',
  China: 'CHN',
  France: 'FRA',
  Germany: 'DEU',
  Hungary: 'HUN',
  Italy: 'ITA',
  Japan: 'JPN',
  Malaysia: 'MYS',
  Mexico: 'MEX',
  Monaco: 'MCO',
  Netherlands: 'NLD',
  Qatar: 'QAT',
  'Saudi Arabia': 'SAU',
  Singapore: 'SGP',
  Spain: 'ESP',
  UAE: 'ARE',
  'United Arab Emirates': 'ARE',
  UK: 'GBR',
  'United Kingdom': 'GBR',
  USA: 'USA',
  'United States': 'USA',
}

export function countryNameToAlpha3(country: string): string {
  return COUNTRY_NAME_TO_ALPHA3[country] ?? 'OTH'
}

function sessionDates(race: ErgastRace): string[] {
  return [
    race.FirstPractice?.date,
    race.SecondPractice?.date,
    race.ThirdPractice?.date,
    race.Qualifying?.date,
    race.SprintQualifying?.date,
    race.Sprint?.date,
    race.date,
  ].filter((d): d is string => Boolean(d))
}

function mapErgastRace(race: ErgastRace): Omit<RaceEvent, 'status'> {
  const dates = sessionDates(race).sort()
  const startDate = dates[0] ?? race.date
  const endDate = race.date
  const { locality, country } = race.Circuit.Location

  return {
    id: `f1-${race.season}-r${race.round}`,
    name: race.raceName,
    circuit: race.Circuit.circuitName,
    location: `${locality}, ${country}`,
    country,
    countryCode: countryNameToAlpha3(country),
    date: startDate,
    endDate,
    series: 'f1',
    round: Number(race.round),
  }
}

function parseIndyCarVenue(name: string): Pick<RaceEvent, 'circuit' | 'location' | 'country' | 'countryCode'> {
  const match = name.match(/Grand Prix of (.+)/i)
  const place = match?.[1]?.trim() ?? name
  const lower = place.toLowerCase()

  if (lower.includes('toronto')) {
    return {
      circuit: 'Exhibition Place',
      location: 'Toronto, Canada',
      country: 'Canada',
      countryCode: 'CAN',
    }
  }
  if (lower.includes('motegi')) {
    return {
      circuit: 'Mobility Resort Motegi',
      location: 'Motegi, Japan',
      country: 'Japan',
      countryCode: 'JPN',
    }
  }
  if (lower.includes('são paulo') || lower.includes('sao paulo')) {
    return {
      circuit: 'Autódromo de Interlagos',
      location: 'São Paulo, Brazil',
      country: 'Brazil',
      countryCode: 'BRA',
    }
  }

  return {
    circuit: place,
    location: `${place}, USA`,
    country: 'United States',
    countryCode: 'USA',
  }
}

function mapIndyCarRace(race: MotoDbIndyRace, round: number): Omit<RaceEvent, 'status'> {
  const venue = parseIndyCarVenue(race.name)
  const raceDate = race.date.slice(0, 10)

  return {
    id: `indycar-${race.event_id}`,
    name: race.name,
    ...venue,
    date: raceDate,
    endDate: raceDate,
    series: 'indycar',
    round,
  }
}

export async function fetchF1Schedule(): Promise<Omit<RaceEvent, 'status'>[]> {
  const res = await fetch(`${F1_BASE}/current/races.json?limit=100`)
  if (!res.ok) throw new Error('Failed to fetch F1 schedule')

  const json = await res.json()
  const races: ErgastRace[] = json?.MRData?.RaceTable?.Races ?? []
  if (!races.length) throw new Error('No F1 races returned')

  return races.map(mapErgastRace)
}

export async function fetchIndyCarSchedule(): Promise<Omit<RaceEvent, 'status'>[]> {
  const year = new Date().getFullYear()
  const res = await fetch(`${MOTO_DB}/indycar/${year}/schedule.json`)
  if (!res.ok) throw new Error('Failed to fetch IndyCar schedule')

  const json = (await res.json()) as MotoDbIndySchedule
  const races = json.races ?? []
  if (!races.length) throw new Error('No IndyCar races returned')

  return races.map((race, index) => mapIndyCarRace(race, index + 1))
}

export function applyEventStatus(
  rows: Omit<RaceEvent, 'status'>[],
  now: number = Date.now(),
): RaceEvent[] {
  const sod = new Date(now)
  sod.setHours(0, 0, 0, 0)
  const startOfToday = sod.getTime()

  return rows.map((row) => {
    const end = new Date(`${row.endDate}T23:59:59`).getTime()
    return {
      ...row,
      status: end < startOfToday ? 'completed' : 'upcoming',
    }
  })
}
