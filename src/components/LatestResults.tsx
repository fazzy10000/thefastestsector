import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchF1LastRaceResults } from '../lib/standingsApi'

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

interface Props {
  series: 'f1' | 'f2' | 'f3' | 'indycar' | 'fe' | 'f1-academy'
  compact?: boolean
  standingsHref?: string
}

export default function LatestResults({ series, compact = false, standingsHref = '/standings' }: Props) {
  const [result, setResult] = useState<SeriesResult | null>(null)
  const [loading, setLoading] = useState(series === 'f1')
  const [unavailable, setUnavailable] = useState(series !== 'f1')

  useEffect(() => {
    if (series !== 'f1') {
      setResult(null)
      setUnavailable(true)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    fetchF1LastRaceResults()
      .then((data) => {
        if (cancelled) return
        setResult({
          series: 'Formula 1',
          badge: 'F1',
          badgeColor: 'bg-red-600',
          raceName: data.raceName,
          venue: data.circuit || data.location,
          rows: data.rows.map((row) => ({
            position: row.position,
            code: row.code,
            team: row.team,
            gap: row.gap,
          })),
        })
        setUnavailable(false)
      })
      .catch(() => {
        if (!cancelled) {
          setResult(null)
          setUnavailable(true)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [series])

  if (series === 'f1' && loading) {
    return (
      <div className="animate-pulse space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 bg-gray-200 dark:bg-white/10 rounded" />
        ))}
      </div>
    )
  }

  if (unavailable || !result) {
    return (
      <p className="text-xs text-text-secondary dark:text-white/50 py-2">
        Live results for this series are not available yet.
      </p>
    )
  }

  return (
    <div>
      {!compact && (
        <div className="flex items-center gap-2 mb-2">
          <span className={`${result.badgeColor} text-white text-[10px] font-bold px-2 py-0.5 rounded`}>
            {result.badge}
          </span>
          <div>
            <p className="text-xs font-semibold text-text-primary dark:text-white">{result.raceName}</p>
            <p className="text-[11px] text-text-secondary dark:text-white/50">{result.venue}</p>
          </div>
        </div>
      )}
      <table className="w-full text-xs">
        <tbody>
          {result.rows.map((row) => (
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
        to={standingsHref}
        className="block text-center text-[11px] font-bold uppercase tracking-wider text-primary hover:underline mt-2"
      >
        Full Standings
      </Link>
    </div>
  )
}
