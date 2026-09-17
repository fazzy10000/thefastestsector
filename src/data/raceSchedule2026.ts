import type { RaceEvent } from '../lib/types'

/** Static calendar rows; `status` is filled by `buildRaceSchedule`. */
type RaceRow = Omit<RaceEvent, 'status'>

function ev(
  id: string,
  name: string,
  circuit: string,
  location: string,
  country: string,
  countryCode: string,
  date: string,
  endDate: string,
  series: RaceRow['series'],
  round: number,
): RaceRow {
  return { id, name, circuit, location, country, countryCode, date, endDate, series, round }
}

/**
 * Emergency static fallback when `/api/schedule` is empty/unreachable.
 * Live calendars are synced by the Worker (cron → D1). Keep this roughly in
 * sync with published calendars so offline/dev still looks sane.
 *
 * F1 2026: OpenF1 meetings (Sakhir Bahrain + Saudi marked cancelled; Malaysia Bahrain added).
 * IndyCar / Academy / FE Season 13: last known published calendars.
 */
const RAW: RaceRow[] = [
  // Formula 1 — 2026
  ev('f1-2026-australia', 'Australian Grand Prix', 'Albert Park Circuit', 'Melbourne, Australia', 'Australia', 'AUS', '2026-03-06', '2026-03-08', 'f1', 1),
  ev('f1-2026-china', 'Chinese Grand Prix', 'Shanghai International Circuit', 'Shanghai, China', 'China', 'CHN', '2026-03-13', '2026-03-15', 'f1', 2),
  ev('f1-2026-japan', 'Japanese Grand Prix', 'Suzuka International Racing Course', 'Suzuka, Japan', 'Japan', 'JPN', '2026-03-27', '2026-03-29', 'f1', 3),
  ev('f1-2026-miami', 'Miami Grand Prix', 'Miami International Autodrome', 'Miami, USA', 'United States', 'USA', '2026-05-01', '2026-05-03', 'f1', 4),
  ev('f1-2026-canada', 'Canadian Grand Prix', 'Circuit Gilles Villeneuve', 'Montreal, Canada', 'Canada', 'CAN', '2026-05-22', '2026-05-24', 'f1', 5),
  ev('f1-2026-monaco', 'Monaco Grand Prix', 'Circuit de Monaco', 'Monte Carlo, Monaco', 'Monaco', 'MCO', '2026-06-05', '2026-06-07', 'f1', 6),
  ev('f1-2026-barcelona', 'Barcelona Grand Prix', 'Circuit de Barcelona-Catalunya', 'Barcelona, Spain', 'Spain', 'ESP', '2026-06-12', '2026-06-14', 'f1', 7),
  ev('f1-2026-austria', 'Austrian Grand Prix', 'Red Bull Ring', 'Spielberg, Austria', 'Austria', 'AUT', '2026-06-26', '2026-06-28', 'f1', 8),
  ev('f1-2026-britain', 'British Grand Prix', 'Silverstone Circuit', 'Silverstone, United Kingdom', 'United Kingdom', 'GBR', '2026-07-03', '2026-07-05', 'f1', 9),
  ev('f1-2026-belgium', 'Belgian Grand Prix', 'Circuit de Spa-Francorchamps', 'Spa, Belgium', 'Belgium', 'BEL', '2026-07-17', '2026-07-19', 'f1', 10),
  ev('f1-2026-hungary', 'Hungarian Grand Prix', 'Hungaroring', 'Budapest, Hungary', 'Hungary', 'HUN', '2026-07-24', '2026-07-26', 'f1', 11),
  ev('f1-2026-dutch', 'Dutch Grand Prix', 'Circuit Zandvoort', 'Zandvoort, Netherlands', 'Netherlands', 'NLD', '2026-08-21', '2026-08-23', 'f1', 12),
  ev('f1-2026-italy', 'Italian Grand Prix', 'Autodromo Nazionale Monza', 'Monza, Italy', 'Italy', 'ITA', '2026-09-04', '2026-09-06', 'f1', 13),
  ev('f1-2026-madrid', 'Spanish Grand Prix', 'Madring', 'Madrid, Spain', 'Spain', 'ESP', '2026-09-11', '2026-09-13', 'f1', 14),
  ev('f1-2026-azerbaijan', 'Azerbaijan Grand Prix', 'Baku City Circuit', 'Baku, Azerbaijan', 'Azerbaijan', 'AZE', '2026-09-24', '2026-09-26', 'f1', 15),
  ev('f1-2026-malaysia', 'Bahrain Grand Prix', 'Sepang International Circuit', 'Kuala Lumpur, Malaysia', 'Malaysia', 'MYS', '2026-10-02', '2026-10-04', 'f1', 16),
  ev('f1-2026-singapore', 'Singapore Grand Prix', 'Marina Bay Street Circuit', 'Singapore, Singapore', 'Singapore', 'SGP', '2026-10-09', '2026-10-11', 'f1', 17),
  ev('f1-2026-usa', 'United States Grand Prix', 'Circuit of the Americas', 'Austin, USA', 'United States', 'USA', '2026-10-23', '2026-10-25', 'f1', 18),
  ev('f1-2026-mexico', 'Mexico City Grand Prix', 'Autódromo Hermanos Rodríguez', 'Mexico City, Mexico', 'Mexico', 'MEX', '2026-10-30', '2026-11-01', 'f1', 19),
  ev('f1-2026-brazil', 'São Paulo Grand Prix', 'Autódromo José Carlos Pace', 'São Paulo, Brazil', 'Brazil', 'BRA', '2026-11-06', '2026-11-08', 'f1', 20),
  ev('f1-2026-las-vegas', 'Las Vegas Grand Prix', 'Las Vegas Strip Circuit', 'Las Vegas, USA', 'United States', 'USA', '2026-11-19', '2026-11-21', 'f1', 21),
  ev('f1-2026-qatar', 'Qatar Grand Prix', 'Lusail International Circuit', 'Lusail, Qatar', 'Qatar', 'QAT', '2026-11-27', '2026-11-29', 'f1', 22),
  ev('f1-2026-abu-dhabi', 'Abu Dhabi Grand Prix', 'Yas Marina Circuit', 'Abu Dhabi, UAE', 'United Arab Emirates', 'ARE', '2026-12-04', '2026-12-06', 'f1', 23),

  // IndyCar — 2026
  ev('indy-2026-st-pete', 'Firestone Grand Prix of St. Petersburg', 'St. Petersburg Street Circuit', 'St. Petersburg, USA', 'United States', 'USA', '2026-03-01', '2026-03-01', 'indycar', 1),
  ev('indy-2026-phoenix', 'Phoenix Grand Prix', 'Phoenix Raceway', 'Avondale, USA', 'United States', 'USA', '2026-03-07', '2026-03-07', 'indycar', 2),
  ev('indy-2026-arlington', 'Arlington Grand Prix', 'Streets of Arlington', 'Arlington, USA', 'United States', 'USA', '2026-03-15', '2026-03-15', 'indycar', 3),
  ev('indy-2026-barber', 'Grand Prix of Alabama', 'Barber Motorsports Park', 'Birmingham, USA', 'United States', 'USA', '2026-03-29', '2026-03-29', 'indycar', 4),
  ev('indy-2026-long-beach', 'Acura Grand Prix of Long Beach', 'Long Beach Street Circuit', 'Long Beach, USA', 'United States', 'USA', '2026-04-19', '2026-04-19', 'indycar', 5),
  ev('indy-2026-ims-road', 'GMR Grand Prix', 'Indianapolis Motor Speedway Road Course', 'Indianapolis, USA', 'United States', 'USA', '2026-05-09', '2026-05-09', 'indycar', 6),
  ev('indy-2026-indy500', 'Indianapolis 500', 'Indianapolis Motor Speedway', 'Indianapolis, USA', 'United States', 'USA', '2026-05-24', '2026-05-24', 'indycar', 7),
  ev('indy-2026-detroit', 'Detroit Grand Prix', 'Detroit Street Circuit', 'Detroit, USA', 'United States', 'USA', '2026-05-31', '2026-05-31', 'indycar', 8),
  ev('indy-2026-gateway', 'Grand Prix of Illinois', 'World Wide Technology Raceway', 'Madison, USA', 'United States', 'USA', '2026-06-07', '2026-06-07', 'indycar', 9),
  ev('indy-2026-road-america', 'Sonsio Grand Prix at Road America', 'Road America', 'Elkhart Lake, USA', 'United States', 'USA', '2026-06-21', '2026-06-21', 'indycar', 10),
  ev('indy-2026-mid-ohio', 'Honda Indy 200 at Mid-Ohio', 'Mid-Ohio Sports Car Course', 'Lexington, USA', 'United States', 'USA', '2026-07-05', '2026-07-05', 'indycar', 11),
  ev('indy-2026-nashville', 'Music City Grand Prix', 'Nashville Superspeedway', 'Lebanon, USA', 'United States', 'USA', '2026-07-19', '2026-07-19', 'indycar', 12),
  ev('indy-2026-portland', 'Grand Prix of Portland', 'Portland International Raceway', 'Portland, USA', 'United States', 'USA', '2026-08-09', '2026-08-09', 'indycar', 13),
  ev('indy-2026-markham', 'Ontario Honda Dealers Indy at Markham', 'Streets of Markham', 'Markham, Canada', 'Canada', 'CAN', '2026-08-16', '2026-08-16', 'indycar', 14),
  ev('indy-2026-dc', 'Freedom 250 Grand Prix of Washington, D.C.', 'Streets of Washington', 'Washington, D.C., USA', 'United States', 'USA', '2026-08-23', '2026-08-23', 'indycar', 15),
  ev('indy-2026-milwaukee-1', 'Milwaukee Mile Race 1', 'Milwaukee Mile', 'West Allis, USA', 'United States', 'USA', '2026-08-29', '2026-08-29', 'indycar', 16),
  ev('indy-2026-milwaukee-2', 'Milwaukee Mile Race 2', 'Milwaukee Mile', 'West Allis, USA', 'United States', 'USA', '2026-08-30', '2026-08-30', 'indycar', 17),
  ev('indy-2026-laguna', 'INDYCAR Grand Prix of Monterey', 'WeatherTech Raceway Laguna Seca', 'Monterey, USA', 'United States', 'USA', '2026-09-06', '2026-09-06', 'indycar', 18),

  // Formula 2 — 2026 (Miami/Montreal replace cancelled Sakhir/Jeddah)
  ev('f2-2026-melbourne', 'Formula 2 — Melbourne', 'Albert Park Circuit', 'Melbourne, Australia', 'Australia', 'AUS', '2026-03-06', '2026-03-08', 'f2', 1),
  ev('f2-2026-miami', 'Formula 2 — Miami', 'Miami International Autodrome', 'Miami, USA', 'United States', 'USA', '2026-05-01', '2026-05-03', 'f2', 2),
  ev('f2-2026-montreal', 'Formula 2 — Montreal', 'Circuit Gilles Villeneuve', 'Montreal, Canada', 'Canada', 'CAN', '2026-05-22', '2026-05-24', 'f2', 3),
  ev('f2-2026-monaco', 'Formula 2 — Monaco', 'Circuit de Monaco', 'Monte Carlo, Monaco', 'Monaco', 'MCO', '2026-06-04', '2026-06-07', 'f2', 4),
  ev('f2-2026-barcelona', 'Formula 2 — Barcelona', 'Circuit de Barcelona-Catalunya', 'Barcelona, Spain', 'Spain', 'ESP', '2026-06-12', '2026-06-14', 'f2', 5),
  ev('f2-2026-spielberg', 'Formula 2 — Spielberg', 'Red Bull Ring', 'Spielberg, Austria', 'Austria', 'AUT', '2026-06-26', '2026-06-28', 'f2', 6),
  ev('f2-2026-silverstone', 'Formula 2 — Silverstone', 'Silverstone Circuit', 'Silverstone, United Kingdom', 'United Kingdom', 'GBR', '2026-07-03', '2026-07-05', 'f2', 7),
  ev('f2-2026-spa', 'Formula 2 — Spa-Francorchamps', 'Circuit de Spa-Francorchamps', 'Spa, Belgium', 'Belgium', 'BEL', '2026-07-17', '2026-07-19', 'f2', 8),
  ev('f2-2026-budapest', 'Formula 2 — Budapest', 'Hungaroring', 'Budapest, Hungary', 'Hungary', 'HUN', '2026-07-24', '2026-07-26', 'f2', 9),
  ev('f2-2026-monza', 'Formula 2 — Monza', 'Autodromo Nazionale Monza', 'Monza, Italy', 'Italy', 'ITA', '2026-09-04', '2026-09-06', 'f2', 10),
  ev('f2-2026-madrid', 'Formula 2 — Madrid', 'Madring', 'Madrid, Spain', 'Spain', 'ESP', '2026-09-11', '2026-09-13', 'f2', 11),
  ev('f2-2026-baku', 'Formula 2 — Baku', 'Baku City Circuit', 'Baku, Azerbaijan', 'Azerbaijan', 'AZE', '2026-09-24', '2026-09-26', 'f2', 12),
  ev('f2-2026-lusail', 'Formula 2 — Lusail', 'Lusail International Circuit', 'Lusail, Qatar', 'Qatar', 'QAT', '2026-11-27', '2026-11-29', 'f2', 13),
  ev('f2-2026-yas', 'Formula 2 — Yas Marina', 'Yas Marina Circuit', 'Abu Dhabi, UAE', 'United Arab Emirates', 'ARE', '2026-12-04', '2026-12-06', 'f2', 14),

  // Formula 3 — 2026
  ev('f3-2026-melbourne', 'Formula 3 — Melbourne', 'Albert Park Circuit', 'Melbourne, Australia', 'Australia', 'AUS', '2026-03-06', '2026-03-08', 'f3', 1),
  ev('f3-2026-monaco', 'Formula 3 — Monaco', 'Circuit de Monaco', 'Monte Carlo, Monaco', 'Monaco', 'MCO', '2026-06-04', '2026-06-07', 'f3', 2),
  ev('f3-2026-barcelona', 'Formula 3 — Barcelona', 'Circuit de Barcelona-Catalunya', 'Barcelona, Spain', 'Spain', 'ESP', '2026-06-12', '2026-06-14', 'f3', 3),
  ev('f3-2026-spielberg', 'Formula 3 — Spielberg', 'Red Bull Ring', 'Spielberg, Austria', 'Austria', 'AUT', '2026-06-26', '2026-06-28', 'f3', 4),
  ev('f3-2026-silverstone', 'Formula 3 — Silverstone', 'Silverstone Circuit', 'Silverstone, United Kingdom', 'United Kingdom', 'GBR', '2026-07-03', '2026-07-05', 'f3', 5),
  ev('f3-2026-spa', 'Formula 3 — Spa-Francorchamps', 'Circuit de Spa-Francorchamps', 'Spa, Belgium', 'Belgium', 'BEL', '2026-07-17', '2026-07-19', 'f3', 6),
  ev('f3-2026-budapest', 'Formula 3 — Budapest', 'Hungaroring', 'Budapest, Hungary', 'Hungary', 'HUN', '2026-07-24', '2026-07-26', 'f3', 7),
  ev('f3-2026-monza', 'Formula 3 — Monza', 'Autodromo Nazionale Monza', 'Monza, Italy', 'Italy', 'ITA', '2026-09-04', '2026-09-06', 'f3', 8),
  ev('f3-2026-madrid', 'Formula 3 — Madrid', 'Madring', 'Madrid, Spain', 'Spain', 'ESP', '2026-09-11', '2026-09-13', 'f3', 9),

  // F1 Academy — 2026 (Jeddah cancelled; Montreal and Austin are three-race weekends)
  ev('fa-2026-shanghai', 'F1 Academy — Shanghai', 'Shanghai International Circuit', 'Shanghai, China', 'China', 'CHN', '2026-03-13', '2026-03-15', 'f1-academy', 1),
  ev('fa-2026-montreal', 'F1 Academy — Montreal', 'Circuit Gilles Villeneuve', 'Montreal, Canada', 'Canada', 'CAN', '2026-05-22', '2026-05-24', 'f1-academy', 2),
  ev('fa-2026-silverstone', 'F1 Academy — Silverstone', 'Silverstone Circuit', 'Silverstone, United Kingdom', 'United Kingdom', 'GBR', '2026-07-03', '2026-07-05', 'f1-academy', 3),
  ev('fa-2026-zandvoort', 'F1 Academy — Zandvoort', 'Circuit Zandvoort', 'Zandvoort, Netherlands', 'Netherlands', 'NLD', '2026-08-21', '2026-08-23', 'f1-academy', 4),
  ev('fa-2026-austin', 'F1 Academy — Austin', 'Circuit of the Americas', 'Austin, USA', 'United States', 'USA', '2026-10-22', '2026-10-25', 'f1-academy', 5),
  ev('fa-2026-las-vegas', 'F1 Academy — Las Vegas', 'Las Vegas Strip Circuit', 'Las Vegas, USA', 'United States', 'USA', '2026-11-19', '2026-11-21', 'f1-academy', 6),

  // Formula E — Season 13 (2026–27)
  ev('fe-2026-jeddah-r1', 'Jeddah E-Prix — Race 1', 'Jeddah Corniche Circuit', 'Jeddah, Saudi Arabia', 'Saudi Arabia', 'SAU', '2026-12-18', '2026-12-18', 'fe', 1),
  ev('fe-2026-jeddah-r2', 'Jeddah E-Prix — Race 2', 'Jeddah Corniche Circuit', 'Jeddah, Saudi Arabia', 'Saudi Arabia', 'SAU', '2026-12-19', '2026-12-19', 'fe', 2),
  ev('fe-2027-mexico', 'Mexico City E-Prix', 'Autódromo Hermanos Rodríguez', 'Mexico City, Mexico', 'Mexico', 'MEX', '2027-01-16', '2027-01-16', 'fe', 3),
  ev('fe-2027-austin', 'Austin E-Prix', 'Circuit of the Americas', 'Austin, USA', 'United States', 'USA', '2027-02-06', '2027-02-06', 'fe', 4),
  ev('fe-2027-miami', 'Miami E-Prix', 'Miami International Autodrome', 'Miami, USA', 'United States', 'USA', '2027-02-20', '2027-02-20', 'fe', 5),
  ev('fe-2027-sao-paulo', 'São Paulo E-Prix', 'Anhembi Sambadrome Circuit', 'São Paulo, Brazil', 'Brazil', 'BRA', '2027-03-13', '2027-03-13', 'fe', 6),
  ev('fe-2027-sanya', 'Sanya E-Prix', 'Haitang Bay Circuit', 'Sanya, China', 'China', 'CHN', '2027-04-17', '2027-04-17', 'fe', 7),
  ev('fe-2027-monaco-r1', 'Monaco E-Prix — Race 1', 'Circuit de Monaco', 'Monte Carlo, Monaco', 'Monaco', 'MCO', '2027-05-01', '2027-05-01', 'fe', 8),
  ev('fe-2027-monaco-r2', 'Monaco E-Prix — Race 2', 'Circuit de Monaco', 'Monte Carlo, Monaco', 'Monaco', 'MCO', '2027-05-02', '2027-05-02', 'fe', 9),
  ev('fe-2027-berlin-r1', 'Berlin E-Prix — Race 1', 'Tempelhof Airport Street Circuit', 'Berlin, Germany', 'Germany', 'DEU', '2027-05-08', '2027-05-08', 'fe', 10),
  ev('fe-2027-berlin-r2', 'Berlin E-Prix — Race 2', 'Tempelhof Airport Street Circuit', 'Berlin, Germany', 'Germany', 'DEU', '2027-05-09', '2027-05-09', 'fe', 11),
  ev('fe-2027-london-r1', 'London E-Prix — Race 1', 'Brands Hatch', 'Kent, United Kingdom', 'United Kingdom', 'GBR', '2027-05-29', '2027-05-29', 'fe', 12),
  ev('fe-2027-london-r2', 'London E-Prix — Race 2', 'Brands Hatch', 'Kent, United Kingdom', 'United Kingdom', 'GBR', '2027-05-30', '2027-05-30', 'fe', 13),
  ev('fe-2027-zandvoort-r1', 'Zandvoort E-Prix — Race 1', 'Circuit Zandvoort', 'Zandvoort, Netherlands', 'Netherlands', 'NLD', '2027-06-18', '2027-06-18', 'fe', 14),
  ev('fe-2027-zandvoort-r2', 'Zandvoort E-Prix — Race 2', 'Circuit Zandvoort', 'Zandvoort, Netherlands', 'Netherlands', 'NLD', '2027-06-19', '2027-06-19', 'fe', 15),
  ev('fe-2027-madrid-r1', 'Madrid E-Prix — Race 1', 'Circuito de Madrid Jarama-RACE', 'Madrid, Spain', 'Spain', 'ESP', '2027-06-26', '2027-06-26', 'fe', 16),
  ev('fe-2027-madrid-r2', 'Madrid E-Prix — Race 2', 'Circuito de Madrid Jarama-RACE', 'Madrid, Spain', 'Spain', 'ESP', '2027-06-27', '2027-06-27', 'fe', 17),
  ev('fe-2027-shanghai-r1', 'Shanghai E-Prix — Race 1', 'Shanghai International Circuit', 'Shanghai, China', 'China', 'CHN', '2027-07-10', '2027-07-10', 'fe', 18),
  ev('fe-2027-shanghai-r2', 'Shanghai E-Prix — Race 2', 'Shanghai International Circuit', 'Shanghai, China', 'China', 'CHN', '2027-07-11', '2027-07-11', 'fe', 19),
  ev('fe-2027-tokyo-r1', 'Tokyo E-Prix — Race 1', 'Tokyo Street Circuit', 'Tokyo, Japan', 'Japan', 'JPN', '2027-07-24', '2027-07-24', 'fe', 20),
  ev('fe-2027-tokyo-r2', 'Tokyo E-Prix — Race 2', 'Tokyo Street Circuit', 'Tokyo, Japan', 'Japan', 'JPN', '2027-07-25', '2027-07-25', 'fe', 21),
]

function endOfDayTimestamp(isoDate: string): number {
  const d = new Date(`${isoDate}T23:59:59.999`)
  return d.getTime()
}

function startOfTodayTimestamp(now: number): number {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function withStatus(rows: RaceRow[], now: number): RaceEvent[] {
  const sod = startOfTodayTimestamp(now)
  return rows.map((row) => {
    const end = endOfDayTimestamp(row.endDate)
    return {
      ...row,
      status: end < sod ? 'completed' : 'upcoming',
    }
  })
}

/**
 * Assigns `status` from `now` (typically `Date.now()`).
 * Completed when the event end date is before the start of today.
 */
export function buildRaceSchedule(now: number = Date.now()): RaceEvent[] {
  return withStatus(RAW, now)
}

export function sortEventsChronologically(events: RaceEvent[]): RaceEvent[] {
  return [...events].sort((a, b) => {
    const diff = new Date(a.date).getTime() - new Date(b.date).getTime()
    if (diff !== 0) return diff
    return a.round - b.round || a.id.localeCompare(b.id)
  })
}
