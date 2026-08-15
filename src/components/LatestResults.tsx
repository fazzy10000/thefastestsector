import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchF1Standings } from '../lib/standingsApi'

interface ResultRow {
  position: number
  code: string
  team: string
  gap: string
}

interface SeriesResult {
  series: string
  badge: string
  badgeColor: string
  raceName: string
  venue: string
  rows: ResultRow[]
}

const STATIC_RESULTS: Record<string, SeriesResult> = {
  f2: {
    series: 'F2',
    badge: 'F2',
    badgeColor: 'bg-blue-600',
    raceName: 'Feature Race',
    venue: 'Spain',
    rows: [
      { position: 1, code: 'BEA', team: 'Prema', gap: 'Winner' },
      { position: 2, code: 'MAL', team: 'Campos', gap: '+2.1s' },
      { position: 3, code: 'FOR', team: 'Invicta', gap: '+4.7s' },
    ],
  },
  indycar: {
    series: 'IndyCar',
    badge: 'INDYCAR',
    badgeColor: 'bg-indigo-900',
    raceName: 'Road America',
    venue: 'Elkhart Lake, USA',
    rows: [
      { position: 1, code: 'PAL', team: 'Chip Ganassi', gap: 'Winner' },
      { position: 2, code: "O'WA", team: 'Arrow McLaren', gap: '+0.8s' },
      { position: 3, code: 'BOS', team: 'Andretti', gap: '+3.2s' },
    ],
  },
  fe: {
    series: 'Formula E',
    badge: 'FORMULA E',
    badgeColor: 'bg-sky-600',
    raceName: 'Berlin E-Prix',
    venue: 'Tempelhof Airport',
    rows: [
      { position: 1, code: 'DAC', team: 'Porsche', gap: 'Winner' },
      { position: 2, code: 'WEH', team: 'Porsche', gap: '+1.4s' },
      { position: 3, code: 'EVE', team: 'Jaguar', gap: '+5.6s' },
    ],
  },
}

interface Props {
  series: 'f1' | 'f2' | 'indycar' | 'fe'
  compact?: boolean
}

export default function LatestResults({ series, compact = false }: Props) {
  const [f1Result, setF1Result] = useState<SeriesResult | null>(null)
  const [f1Loading, setF1Loading] = useState(series === 'f1')

  useEffect(() => {
    if (series !== 'f1') return
    fetchF1Standings()
      .then((data) => {
        setF1Result({
          series: 'Formula 1',
          badge: 'F1',
          badgeColor: 'bg-red-600',
          raceName: 'Spanish Grand Prix',
          venue: 'Circuit de Barcelona-Catalunya',
          rows: data.drivers.slice(0, 3).map((d) => ({
            position: d.position,
            code: d.code || d.name.split(' ').pop()?.slice(0, 3).toUpperCase() || '???',
            team: d.team,
            gap: d.position === 1 ? 'Winner' : `${d.points} pts`,
          })),
        })
      })
      .catch(() => {
        setF1Result({
          series: 'Formula 1',
          badge: 'F1',
          badgeColor: 'bg-red-600',
          raceName: 'Spanish Grand Prix',
          venue: 'Circuit de Barcelona-Catalunya',
          rows: [
            { position: 1, code: 'VER', team: 'Red Bull', gap: 'Winner' },
            { position: 2, code: 'NOR', team: 'McLaren', gap: '+2.2s' },
            { position: 3, code: 'HAM', team: 'Mercedes', gap: '+17.8s' },
          ],
        })
      })
      .finally(() => setF1Loading(false))
  }, [series])

  const data = series === 'f1' ? f1Result : STATIC_RESULTS[series]

  if (series === 'f1' && f1Loading) {
    return (
      <div className="animate-pulse space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 bg-gray-200 dark:bg-white/10 rounded" />
        ))}
      </div>
    )
  }

  if (!data) return null

  return (
    <div>
      {!compact && (
        <div className="flex items-center gap-2 mb-2">
          <span className={`${data.badgeColor} text-white text-[10px] font-bold px-2 py-0.5 rounded`}>
            {data.badge}
          </span>
          <div>
            <p className="text-xs font-semibold text-text-primary dark:text-white">{data.raceName}</p>
            <p className="text-[11px] text-text-secondary dark:text-white/50">{data.venue}</p>
          </div>
        </div>
      )}
      <table className="w-full text-xs">
        <tbody>
          {data.rows.map((row) => (
            <tr key={row.position} className="border-b border-gray-100 dark:border-white/5">
              <td className="py-1.5 pr-2 font-bold text-text-secondary dark:text-white/50 w-5">
                {row.position}
              </td>
              <td className="py-1.5 pr-2 font-bold text-text-primary dark:text-white">
                {row.code}
              </td>
              <td className="py-1.5 text-text-secondary dark:text-white/60 flex-1">{row.team}</td>
              <td className="py-1.5 pl-2 text-right font-medium text-text-primary dark:text-white whitespace-nowrap">
                {row.gap}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Link
        to="/standings"
        className="block text-center text-[11px] font-bold uppercase tracking-wider text-primary hover:underline mt-2"
      >
        Full Results
      </Link>
    </div>
  )
}
