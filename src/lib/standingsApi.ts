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
  // Formula E
  Porsche: '#D5001C',
  Jaguar: '#006633',
  Andretti: '#ED1C24',
  Nissan: '#C3002F',
  Envision: '#00BE26',
  Maserati: '#001489',
  Mahindra: '#DD052B',
  NIO: '#000000',
  'DS Penske': '#C5A867',
  // IndyCar
  'Chip Ganassi': '#2D68C4',
  Penske: '#F7D633',
  Andretti_IC: '#E31837',
  'Arrow McLaren': '#FF8000',
  'A.J. Foyt': '#D52B1E',
  RLL: '#FFC72C',
  'Ed Carpenter': '#002244',
  Juncos: '#000000',
}

export function getTeamColor(team: string): string {
  return TEAM_COLORS[team] ?? '#6b7280'
}

// Sample standings for series without public APIs
export function getFormulaEStandings(): StandingsData {
  return {
    season: '2025–26',
    round: 'R8',
    drivers: [
      { position: 1, name: 'Pascal Wehrlein', team: 'Porsche', nationality: 'German', points: 118, wins: 3, code: 'WEH' },
      { position: 2, name: 'Jake Dennis', team: 'Andretti', nationality: 'British', points: 105, wins: 2, code: 'DEN' },
      { position: 3, name: 'Mitch Evans', team: 'Jaguar', nationality: 'New Zealander', points: 96, wins: 1, code: 'EVA' },
      { position: 4, name: 'Nick Cassidy', team: 'Jaguar', nationality: 'New Zealander', points: 88, wins: 1, code: 'CAS' },
      { position: 5, name: 'António Félix da Costa', team: 'Porsche', nationality: 'Portuguese', points: 72, wins: 1, code: 'AFC' },
      { position: 6, name: 'Oliver Rowland', team: 'Nissan', nationality: 'British', points: 58, wins: 0, code: 'ROW' },
      { position: 7, name: 'Sébastien Buemi', team: 'Envision', nationality: 'Swiss', points: 45, wins: 0, code: 'BUE' },
      { position: 8, name: 'Jean-Éric Vergne', team: 'DS Penske', nationality: 'French', points: 38, wins: 0, code: 'VER' },
      { position: 9, name: 'Sam Bird', team: 'McLaren', nationality: 'British', points: 30, wins: 0, code: 'BIR' },
      { position: 10, name: 'Maximilian Günther', team: 'Maserati', nationality: 'German', points: 22, wins: 0, code: 'GUN' },
    ],
    constructors: [
      { position: 1, name: 'Porsche', nationality: 'German', points: 190, wins: 4 },
      { position: 2, name: 'Jaguar', nationality: 'British', points: 184, wins: 2 },
      { position: 3, name: 'Andretti', nationality: 'American', points: 122, wins: 2 },
      { position: 4, name: 'Nissan', nationality: 'Japanese', points: 78, wins: 0 },
      { position: 5, name: 'DS Penske', nationality: 'French', points: 52, wins: 0 },
    ],
    fetchedAt: Date.now(),
  }
}

export function getIndyCarStandings(): StandingsData {
  return {
    season: '2026',
    round: 'R5',
    drivers: [
      { position: 1, name: 'Alex Palou', team: 'Chip Ganassi', nationality: 'Spanish', points: 178, wins: 2, code: 'PAL' },
      { position: 2, name: 'Colton Herta', team: 'Andretti', nationality: 'American', points: 165, wins: 1, code: 'HER' },
      { position: 3, name: 'Will Power', team: 'Penske', nationality: 'Australian', points: 152, wins: 1, code: 'POW' },
      { position: 4, name: 'Pato O\'Ward', team: 'Arrow McLaren', nationality: 'Mexican', points: 140, wins: 1, code: 'OWA' },
      { position: 5, name: 'Scott Dixon', team: 'Chip Ganassi', nationality: 'New Zealander', points: 128, wins: 0, code: 'DIX' },
      { position: 6, name: 'Josef Newgarden', team: 'Penske', nationality: 'American', points: 118, wins: 1, code: 'NEW' },
      { position: 7, name: 'Marcus Armstrong', team: 'Chip Ganassi', nationality: 'New Zealander', points: 95, wins: 0, code: 'ARM' },
      { position: 8, name: 'Kyle Kirkwood', team: 'Andretti', nationality: 'American', points: 82, wins: 0, code: 'KIR' },
      { position: 9, name: 'Scott McLaughlin', team: 'Penske', nationality: 'New Zealander', points: 75, wins: 0, code: 'MCL' },
      { position: 10, name: 'Alexander Rossi', team: 'Arrow McLaren', nationality: 'American', points: 60, wins: 0, code: 'ROS' },
    ],
    constructors: [],
    fetchedAt: Date.now(),
  }
}

export function getFeederSeriesStandings(): StandingsData {
  return {
    season: '2026',
    round: 'R4',
    drivers: [
      { position: 1, name: 'Gabriele Minì', team: 'Prema', nationality: 'Italian', points: 85, wins: 2, code: 'MIN' },
      { position: 2, name: 'Luke Browning', team: 'Hitech', nationality: 'British', points: 72, wins: 1, code: 'BRO' },
      { position: 3, name: 'Joshua Dürksen', team: 'AIX', nationality: 'Paraguayan', points: 64, wins: 1, code: 'DUR' },
      { position: 4, name: 'Pepe Martí', team: 'Campos', nationality: 'Spanish', points: 55, wins: 0, code: 'MAR' },
      { position: 5, name: 'Dino Beganovic', team: 'Prema', nationality: 'Swedish', points: 48, wins: 0, code: 'BEG' },
      { position: 6, name: 'Ritomo Miyata', team: 'Rodin', nationality: 'Japanese', points: 38, wins: 0, code: 'MIY' },
      { position: 7, name: 'Jak Crawford', team: 'DAMS', nationality: 'American', points: 30, wins: 0, code: 'CRA' },
      { position: 8, name: 'Oliver Goethe', team: 'MP', nationality: 'Danish', points: 22, wins: 0, code: 'GOE' },
      { position: 9, name: 'Amaury Cordeel', team: 'Hitech', nationality: 'Belgian', points: 18, wins: 0, code: 'COR' },
      { position: 10, name: 'Enzo Fittipaldi', team: 'Van Amersfoort', nationality: 'Brazilian', points: 12, wins: 0, code: 'FIT' },
    ],
    constructors: [],
    fetchedAt: Date.now(),
  }
}

export function getF1AcademyStandings(): StandingsData {
  return {
    season: '2026',
    round: 'R3',
    drivers: [
      { position: 1, name: 'Doriane Pin', team: 'Prema', nationality: 'French', points: 75, wins: 3, code: 'PIN' },
      { position: 2, name: 'Abbi Pulling', team: 'Rodin', nationality: 'British', points: 62, wins: 1, code: 'PUL' },
      { position: 3, name: 'Hamda Al Qubaisi', team: 'Prema', nationality: 'Emirati', points: 48, wins: 1, code: 'ALQ' },
      { position: 4, name: 'Alba Larsen', team: 'ART', nationality: 'Danish', points: 40, wins: 0, code: 'LAR' },
      { position: 5, name: 'Marta García', team: 'Campos', nationality: 'Spanish', points: 30, wins: 0, code: 'GAR' },
      { position: 6, name: 'Bianca Bustamante', team: 'ART', nationality: 'Filipino', points: 24, wins: 0, code: 'BUS' },
      { position: 7, name: 'Nerea Martí', team: 'Campos', nationality: 'Spanish', points: 18, wins: 0, code: 'NMA' },
      { position: 8, name: 'Lola Lovinfosse', team: 'MP', nationality: 'French', points: 10, wins: 0, code: 'LOV' },
    ],
    constructors: [],
    fetchedAt: Date.now(),
  }
}
