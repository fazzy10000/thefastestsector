import { useState, useEffect, useCallback, useRef } from 'react'
import { Trophy, Users, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import SEO from '../components/SEO'
import {
  fetchF1Standings,
  getFormulaEStandings,
  getIndyCarStandings,
  getFeederSeriesStandings,
  getF1AcademyStandings,
  getTeamColor,
} from '../lib/standingsApi'
import type { StandingsData, DriverRow, ConstructorRow } from '../lib/standingsApi'

const CATEGORIES = [
  { id: 'formula-1', label: 'Formula 1', live: true },
  { id: 'formula-e', label: 'Formula E', live: false },
  { id: 'indycar', label: 'IndyCar', live: false },
  { id: 'feeder-series', label: 'F2', live: false },
  { id: 'f1-academy', label: 'F1 Academy', live: false },
] as const

type CategoryId = (typeof CATEGORIES)[number]['id']

const REFRESH_INTERVAL = 60_000

export default function StandingsPage() {
  const [category, setCategory] = useState<CategoryId>('formula-1')
  const [tab, setTab] = useState<'drivers' | 'constructors'>('drivers')
  const [data, setData] = useState<StandingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<number>(0)
  const [isLive, setIsLive] = useState(true)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const catMeta = CATEGORIES.find((c) => c.id === category)!

  const loadData = useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true)
      setError(null)

      try {
        let result: StandingsData
        switch (category) {
          case 'formula-1':
            result = await fetchF1Standings()
            break
          case 'formula-e':
            result = getFormulaEStandings()
            break
          case 'indycar':
            result = getIndyCarStandings()
            break
          case 'feeder-series':
            result = getFeederSeriesStandings()
            break
          case 'f1-academy':
            result = getF1AcademyStandings()
            break
        }
        setData(result)
        setLastRefresh(Date.now())
        setIsLive(true)
      } catch {
        setError('Failed to fetch standings. Will retry shortly.')
        setIsLive(false)
      } finally {
        setLoading(false)
      }
    },
    [category],
  )

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    timerRef.current = setInterval(() => loadData(false), REFRESH_INTERVAL)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [loadData])

  useEffect(() => {
    setTab('drivers')
  }, [category])

  const showConstructors = data && data.constructors.length > 0

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <SEO
        title={`${catMeta.label} Standings`}
        description={`Live ${catMeta.label} championship standings — drivers and constructors.`}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-text-primary dark:text-white">
            Championship Standings
          </h1>
          {data && (
            <p className="text-text-secondary dark:text-white/50 text-sm mt-1">
              {data.season} Season &middot; After Round {data.round}
            </p>
          )}
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-3 text-xs">
          {catMeta.live && (
            <span className="flex items-center gap-1.5">
              {isLive ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                    <Wifi className="w-3 h-3" /> LIVE
                  </span>
                </>
              ) : (
                <span className="text-red-500 font-medium flex items-center gap-1">
                  <WifiOff className="w-3 h-3" /> Offline
                </span>
              )}
            </span>
          )}
          {!catMeta.live && (
            <span className="text-text-secondary dark:text-white/40 font-medium">Sample data</span>
          )}
          {lastRefresh > 0 && (
            <span className="text-text-secondary dark:text-white/40">
              Updated {new Date(lastRefresh).toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => loadData()}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 text-text-secondary dark:text-white/50 transition-colors"
            title="Refresh now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-6 -mx-1 px-1 scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
              category === cat.id
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-secondary dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/10'
            }`}
          >
            {cat.label}
            {cat.live && (
              <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-green-500 align-middle" />
            )}
          </button>
        ))}
      </div>

      {/* Drivers / Constructors toggle */}
      {showConstructors && (
        <div className="flex gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-lg w-fit mb-6">
          <button
            onClick={() => setTab('drivers')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
              tab === 'drivers'
                ? 'bg-white dark:bg-white/15 text-text-primary dark:text-white shadow-sm'
                : 'text-text-secondary dark:text-white/50'
            }`}
          >
            <Trophy className="w-4 h-4" /> Drivers
          </button>
          <button
            onClick={() => setTab('constructors')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
              tab === 'constructors'
                ? 'bg-white dark:bg-white/15 text-text-primary dark:text-white shadow-sm'
                : 'text-text-secondary dark:text-white/50'
            }`}
          >
            <Users className="w-4 h-4" /> Constructors
          </button>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !data && (
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Table */}
      {data && tab === 'drivers' && <DriverTable rows={data.drivers} leader={data.drivers[0]} />}
      {data && tab === 'constructors' && <ConstructorTable rows={data.constructors} leader={data.constructors[0]} />}
    </div>
  )
}

function DriverTable({ rows, leader }: { rows: DriverRow[]; leader: DriverRow }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
      {/* Header */}
      <div className="hidden sm:grid grid-cols-[3.5rem_1fr_1fr_5rem_4rem_4rem] gap-2 px-4 py-3 bg-gray-50 dark:bg-white/5 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-white/40 border-b border-gray-200 dark:border-white/10">
        <span className="text-center">Pos</span>
        <span>Driver</span>
        <span>Team</span>
        <span className="text-right">Points</span>
        <span className="text-right">Wins</span>
        <span className="text-right">Gap</span>
      </div>

      {rows.map((row, i) => {
        const gap = leader.points - row.points
        const barWidth = leader.points > 0 ? (row.points / leader.points) * 100 : 0
        const teamColor = getTeamColor(row.team)

        return (
          <div
            key={`${row.code}-${i}`}
            className={`relative grid grid-cols-[3.5rem_1fr] sm:grid-cols-[3.5rem_1fr_1fr_5rem_4rem_4rem] gap-2 px-4 py-3 items-center border-b border-gray-100 dark:border-white/5 last:border-b-0 transition-colors hover:bg-gray-50 dark:hover:bg-white/[.03] ${
              i < 3 ? '' : ''
            }`}
          >
            {/* Points bar */}
            <div
              className="absolute inset-y-0 left-0 opacity-[0.06] dark:opacity-[0.08]"
              style={{ width: `${barWidth}%`, backgroundColor: teamColor }}
            />

            {/* Position */}
            <span className={`text-center font-bold relative z-10 ${
              i === 0 ? 'text-yellow-500' :
              i === 1 ? 'text-gray-400' :
              i === 2 ? 'text-amber-700 dark:text-amber-600' :
              'text-text-secondary dark:text-white/40'
            }`}>
              {row.position}
            </span>

            {/* Driver name */}
            <div className="flex items-center gap-2 relative z-10 min-w-0">
              <span
                className="w-1 h-8 rounded-full shrink-0"
                style={{ backgroundColor: teamColor }}
              />
              <div className="min-w-0">
                <span className="font-bold text-text-primary dark:text-white text-sm block truncate">
                  {row.name}
                </span>
                <span className="text-xs text-text-secondary dark:text-white/40 sm:hidden block">
                  {row.team}
                </span>
              </div>
            </div>

            {/* Team (desktop) */}
            <span className="hidden sm:block text-sm text-text-secondary dark:text-white/60 relative z-10 truncate">
              {row.team}
            </span>

            {/* Points */}
            <span className="hidden sm:block text-right font-bold text-text-primary dark:text-white relative z-10">
              {row.points}
            </span>

            {/* Wins */}
            <span className="hidden sm:block text-right text-text-secondary dark:text-white/50 text-sm relative z-10">
              {row.wins > 0 ? row.wins : '–'}
            </span>

            {/* Gap */}
            <span className="hidden sm:block text-right text-text-secondary dark:text-white/40 text-xs relative z-10">
              {i === 0 ? '–' : `−${gap}`}
            </span>

            {/* Mobile points */}
            <div className="sm:hidden flex items-center justify-end gap-3 relative z-10 col-start-2">
              <span className="font-bold text-text-primary dark:text-white text-sm">
                {row.points} pts
              </span>
              {row.wins > 0 && (
                <span className="text-xs text-yellow-600 dark:text-yellow-500">
                  {row.wins}W
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ConstructorTable({ rows, leader }: { rows: ConstructorRow[]; leader: ConstructorRow }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
      {/* Header */}
      <div className="hidden sm:grid grid-cols-[3.5rem_1fr_8rem_5rem_4rem_4rem] gap-2 px-4 py-3 bg-gray-50 dark:bg-white/5 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-white/40 border-b border-gray-200 dark:border-white/10">
        <span className="text-center">Pos</span>
        <span>Constructor</span>
        <span>Nationality</span>
        <span className="text-right">Points</span>
        <span className="text-right">Wins</span>
        <span className="text-right">Gap</span>
      </div>

      {rows.map((row, i) => {
        const gap = leader.points - row.points
        const barWidth = leader.points > 0 ? (row.points / leader.points) * 100 : 0
        const teamColor = getTeamColor(row.name)

        return (
          <div
            key={`${row.name}-${i}`}
            className="relative grid grid-cols-[3.5rem_1fr] sm:grid-cols-[3.5rem_1fr_8rem_5rem_4rem_4rem] gap-2 px-4 py-3.5 items-center border-b border-gray-100 dark:border-white/5 last:border-b-0 transition-colors hover:bg-gray-50 dark:hover:bg-white/[.03]"
          >
            <div
              className="absolute inset-y-0 left-0 opacity-[0.08] dark:opacity-[0.1]"
              style={{ width: `${barWidth}%`, backgroundColor: teamColor }}
            />

            <span className={`text-center font-bold relative z-10 ${
              i === 0 ? 'text-yellow-500' :
              i === 1 ? 'text-gray-400' :
              i === 2 ? 'text-amber-700 dark:text-amber-600' :
              'text-text-secondary dark:text-white/40'
            }`}>
              {row.position}
            </span>

            <div className="flex items-center gap-2 relative z-10 min-w-0">
              <span
                className="w-1.5 h-10 rounded-full shrink-0"
                style={{ backgroundColor: teamColor }}
              />
              <span className="font-bold text-text-primary dark:text-white text-sm truncate">
                {row.name}
              </span>
            </div>

            <span className="hidden sm:block text-sm text-text-secondary dark:text-white/60 relative z-10">
              {row.nationality}
            </span>

            <span className="hidden sm:block text-right font-bold text-text-primary dark:text-white relative z-10">
              {row.points}
            </span>

            <span className="hidden sm:block text-right text-text-secondary dark:text-white/50 text-sm relative z-10">
              {row.wins > 0 ? row.wins : '–'}
            </span>

            <span className="hidden sm:block text-right text-text-secondary dark:text-white/40 text-xs relative z-10">
              {i === 0 ? '–' : `−${gap}`}
            </span>

            <div className="sm:hidden flex items-center justify-end gap-3 relative z-10 col-start-2">
              <span className="font-bold text-text-primary dark:text-white text-sm">
                {row.points} pts
              </span>
              {row.wins > 0 && (
                <span className="text-xs text-yellow-600 dark:text-yellow-500">
                  {row.wins}W
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
