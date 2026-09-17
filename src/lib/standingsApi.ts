export interface DriverRow {
  position: number
  name: string
  team: string
  nationality: string
  points: number
  wins: number
  code: string
}

export interface ConstructorRow {
  position: number
  name: string
  nationality: string
  points: number
  wins: number
}

export interface StandingsData {
  season: string
  round: string
  drivers: DriverRow[]
  constructors: ConstructorRow[]
  fetchedAt: number
}

const F1_BASE = 'https://api.jolpi.ca/ergast/f1'

export async function fetchF1Standings(): Promise<StandingsData> {
  const [driverRes, constructorRes] = await Promise.all([
    fetch(`${F1_BASE}/current/driverstandings/?format=json`),
    fetch(`${F1_BASE}/current/constructorstandings/?format=json`),
  ])

  if (!driverRes.ok || !constructorRes.ok) {
    throw new Error('Failed to fetch F1 standings')
  }

  const driverJson = await driverRes.json()
  const constructorJson = await constructorRes.json()

  const driverList =
    driverJson?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? []
  const constructorList =
    constructorJson?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings ?? []

  const season = driverJson?.MRData?.StandingsTable?.season ?? ''
  const round = driverJson?.MRData?.StandingsTable?.round ?? ''

  const drivers: DriverRow[] = driverList.map((d: any) => ({
    position: Number(d.position),
    name: `${d.Driver.givenName} ${d.Driver.familyName}`,
    team: d.Constructors?.[0]?.name ?? '',
    nationality: d.Driver.nationality,
    points: Number(d.points),
    wins: Number(d.wins),
    code: d.Driver.code ?? '',
  }))

  const constructors: ConstructorRow[] = constructorList.map((c: any) => ({
    position: Number(c.position),
    name: c.Constructor.name,
    nationality: c.Constructor.nationality,
    points: Number(c.points),
    wins: Number(c.wins),
  }))

  return { season, round, drivers, constructors, fetchedAt: Date.now() }
}

const TEAM_COLORS: Record<string, string> = {
  Mercedes: '#27F4D2',
  Ferrari: '#E80020',
  McLaren: '#FF8000',
  'Red Bull': '#3671C6',
  'Aston Martin': '#229971',
  'Alpine F1 Team': '#0093CC',
  'Haas F1 Team': '#B6BABD',
  'RB F1 Team': '#6692FF',
  Williams: '#64C4FF',
  Audi: '#E00400',
  'Cadillac F1 Team': '#1E1E1E',
}

export function getTeamColor(team: string): string {
  return TEAM_COLORS[team] ?? '#6b7280'
}

export interface LastRaceResult {
  raceName: string
  circuit: string
  location: string
  date: string
  rows: {
    position: number
    code: string
    name: string
    team: string
    gap: string
  }[]
}

export async function fetchF1LastRaceResults(): Promise<LastRaceResult> {
  const res = await fetch(`${F1_BASE}/current/last/results.json`)
  if (!res.ok) throw new Error('Failed to fetch F1 race results')

  const json = await res.json()
  const race = json?.MRData?.RaceTable?.Races?.[0]
  if (!race) throw new Error('No F1 race results returned')

  const locality = race.Circuit?.Location?.locality ?? ''
  const country = race.Circuit?.Location?.country ?? ''

  const rows = (race.Results ?? []).slice(0, 3).map((r: any) => {
    const position = Number(r.position)
    let gap = r.status ?? ''
    if (position === 1 && r.Time?.time) gap = 'Winner'
    else if (r.Time?.time) {
      // Ergast often already includes a leading "+" (e.g. "+4.351")
      const raw = String(r.Time.time).trim()
      gap = raw.startsWith('+') ? raw : `+${raw}`
    } else if (r.positionText === 'R') gap = 'DNF'

    return {
      position,
      code: r.Driver?.code ?? '',
      name: `${r.Driver?.givenName ?? ''} ${r.Driver?.familyName ?? ''}`.trim(),
      team: r.Constructor?.name ?? '',
      gap,
    }
  })

  return {
    raceName: race.raceName,
    circuit: race.Circuit?.circuitName ?? '',
    location: [locality, country].filter(Boolean).join(', '),
    date: race.date,
    rows,
  }
}
