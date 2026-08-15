import { useState, useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ChevronRight } from 'lucide-react'
import ArticleCard from '../components/ArticleCard'
import RacingLoader from '../components/RacingLoader'
import RaceCountdown from '../components/RaceCountdown'
import LatestResults from '../components/LatestResults'
import SEO from '../components/SEO'
import { useArticles } from '../hooks/useArticles'
import { fetchF1Standings, getFeederSeriesStandings, getIndyCarStandings, getFormulaEStandings, getF1AcademyStandings } from '../lib/standingsApi'
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../lib/types'
import type { Article, Category } from '../lib/types'
import { buildRaceSchedule, sortEventsChronologically } from '../data/raceSchedule2026'
import { flagEmojiFromCountryCode } from '../lib/countryFlags'
import { formatDistanceToNow } from 'date-fns'

function safeTimeAgo(ts: number | null | undefined): string {
  if (!ts || isNaN(ts)) return ''
  try { return formatDistanceToNow(new Date(ts), { addSuffix: true }) } catch { return '' }
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start + 'T12:00:00')
  const e = new Date(end + 'T12:00:00')
  if (start === end) return format(s, 'd MMM yyyy')
  if (s.getMonth() === e.getMonth()) return `${format(s, 'd')}–${format(e, 'd MMM yyyy')}`
  return `${format(s, 'd MMM')} – ${format(e, 'd MMM yyyy')}`
}

const CATEGORY_SERIES: Record<string, 'f1' | 'fe' | 'indycar' | 'f1-academy'> = {
  'formula-1': 'f1',
  'formula-e': 'fe',
  'indycar': 'indycar',
  'feeder-series': 'f1-academy',
  'f1-academy': 'f1-academy',
}

const CATEGORY_TAGLINES: Record<string, string> = {
  'formula-1': 'The latest Formula 1 news, results, features and expert analysis from around the world.',
  'formula-e': 'Electric. Global. Cities. The latest Formula E news, results and features.',
  'indycar': 'The latest IndyCar news, results, features and exclusive interviews.',
  'feeder-series': 'Rising stars. Fierce battles. The future of motorsport starts here.',
  'exclusive': 'Exclusive interviews, behind-the-scenes access and premium content.',
  'f1-academy': 'Empowering the next generation of female racing drivers.',
  'other': 'More motorsport content from The Fastest Sector.',
}

const TABS = ['news', 'results', 'features', 'standings', 'calendar'] as const
type Tab = typeof TABS[number]

interface StandingsDriver {
  position: number
  name: string
  team: string
  points: number
}

interface StandingsConstructor {
  position: number
  name: string
  points: number
}

function CompactArticleRow({ article }: { article: Article }) {
  const timeAgo = safeTimeAgo(article.publishedAt ?? article.createdAt)
  return (
    <Link to={`/article/${article.slug}`} className="flex gap-3 py-2.5 border-b border-gray-100 dark:border-white/5 last:border-0 group">
      {article.featuredImage && (
        <img src={article.featuredImage} alt={article.title} className="w-14 h-14 object-cover rounded flex-none" />
      )}
      <div className="min-w-0">
        <span className={`${CATEGORY_COLORS[article.category]} text-white text-[10px] font-bold px-1.5 py-0.5 rounded mb-1 inline-block`}>
          {CATEGORY_LABELS[article.category]}
        </span>
        <p className="text-sm font-bold text-text-primary dark:text-white line-clamp-2 group-hover:text-primary transition-colors leading-snug">
          {article.title}
        </p>
        {timeAgo && <p className="text-[11px] text-text-secondary dark:text-white/50 mt-0.5">{timeAgo}</p>}
      </div>
    </Link>
  )
}

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>()
  const cat = (category ?? 'other') as Category
  const { articles, loading } = useArticles()
  const [activeTab, setActiveTab] = useState<Tab>('news')
  const [standingsDrivers, setStandingsDrivers] = useState<StandingsDriver[]>([])
  const [standingsConstructors, setStandingsConstructors] = useState<StandingsConstructor[]>([])
  const [standingsTab, setStandingsTab] = useState<'drivers' | 'constructors'>('drivers')

  const categoryArticles = useMemo(
    () => articles.filter((a) => a.status === 'published' && a.category === cat),
    [articles, cat],
  )

  const newsArticles = useMemo(
    () => categoryArticles.filter((a) => (a.contentType ?? 'news') === 'news'),
    [categoryArticles],
  )
  const resultsArticles = useMemo(
    () => categoryArticles.filter((a) => a.contentType === 'results'),
    [categoryArticles],
  )
  const featuresArticles = useMemo(
    () => categoryArticles.filter((a) => a.contentType === 'opinion'),
    [categoryArticles],
  )

  const label = CATEGORY_LABELS[cat] ?? 'Other'
  const tagline = CATEGORY_TAGLINES[cat] ?? ''
  const seriesKey = CATEGORY_SERIES[cat] ?? null

  const schedule = useMemo(() => buildRaceSchedule(Date.now()), [])

  const nextEvent = useMemo(() => {
    if (!seriesKey) return null
    return (
      sortEventsChronologically(
        schedule.filter((e) => e.series === seriesKey && e.status === 'upcoming'),
      )[0] ?? null
    )
  }, [schedule, seriesKey])

  const seriesCalendar = useMemo(() => {
    if (!seriesKey) return []
    return sortEventsChronologically(
      schedule.filter((e) => e.series === seriesKey && e.status === 'upcoming'),
    ).slice(0, 8)
  }, [schedule, seriesKey])

  const nextEventDate = useMemo(
    () => (nextEvent ? new Date(nextEvent.date + 'T00:00:00') : null),
    [nextEvent],
  )

  useEffect(() => {
    async function load() {
      try {
        let data
        if (cat === 'formula-1') data = await fetchF1Standings()
        else if (cat === 'formula-e') data = getFormulaEStandings()
        else if (cat === 'indycar') data = getIndyCarStandings()
        else if (cat === 'feeder-series') data = getFeederSeriesStandings()
        else if (cat === 'f1-academy') data = getF1AcademyStandings()
        else return

        setStandingsDrivers(
          data.drivers.slice(0, 10).map((d) => ({
            position: d.position,
            name: d.name,
            team: d.team,
            points: d.points,
          })),
        )
        setStandingsConstructors(
          data.constructors.slice(0, 10).map((c) => ({
            position: c.position,
            name: c.name,
            points: c.points,
          })),
        )
      } catch {
        // standings unavailable
      }
    }
    load()
  }, [cat])

  const featuredArticle = newsArticles[0] ?? null
  const moreNews = newsArticles.slice(1, 4)
  const latestNewsGrid = newsArticles.slice(4)

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <RacingLoader message={`Loading ${label} articles...`} />
      </div>
    )
  }

  return (
    <div>
      <SEO title={`${label} | The Fastest Sector`} description={tagline} />

      {/* Category header band */}
      <section className="bg-surface-dark text-white py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-5xl font-black text-primary mb-1">{label.toUpperCase()}</h1>
            <p className="text-sm text-white/60 max-w-xl">{tagline}</p>
          </div>

          {nextEvent && nextEventDate && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex-none min-w-[220px]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Next Race</p>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{flagEmojiFromCountryCode(nextEvent.countryCode)}</span>
                <div>
                  <p className="text-sm font-black leading-tight">{nextEvent.name}</p>
                  <p className="text-[11px] text-white/50">{formatDateRange(nextEvent.date, nextEvent.endDate)}</p>
                </div>
              </div>
              <RaceCountdown targetDate={nextEventDate} />
              <Link
                to="/schedule"
                className="block text-center mt-3 text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
              >
                View Full Schedule
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Tab bar */}
      <div className="bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-white/10 sticky top-[88px] z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary dark:text-white/50 hover:text-text-primary dark:hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* NEWS tab */}
        {activeTab === 'news' && (
          <div className="grid lg:grid-cols-[1fr_300px] gap-8">
            {/* Main content */}
            <div>
              {categoryArticles.length === 0 ? (
                <p className="text-text-secondary dark:text-white/50">No {label} articles yet.</p>
              ) : (
                <>
                  <h2 className="text-xs font-black uppercase tracking-wider text-text-secondary dark:text-white/50 mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-primary rounded-full inline-block" />
                    Top Stories
                  </h2>

                  {/* Featured article */}
                  {featuredArticle && (
                    <Link
                      to={`/article/${featuredArticle.slug}`}
                      className="group block rounded-xl overflow-hidden bg-gray-50 dark:bg-white/5 hover:shadow-lg transition-shadow mb-4"
                    >
                      {featuredArticle.featuredImage ? (
                        <div className="relative">
                          <img
                            src={featuredArticle.featuredImage}
                            alt={featuredArticle.title}
                            className="w-full h-56 object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                          <div className="absolute bottom-0 left-0 p-4">
                            <span className={`${CATEGORY_COLORS[featuredArticle.category]} text-white text-[10px] font-bold px-2 py-0.5 rounded mb-2 inline-block`}>
                              Top Story
                            </span>
                            <h3 className="text-white text-xl font-black leading-tight line-clamp-2 group-hover:text-primary/90 transition-colors">
                              {featuredArticle.title}
                            </h3>
                            <p className="text-white/60 text-xs mt-1">
                              {safeTimeAgo(featuredArticle.publishedAt ?? featuredArticle.createdAt)}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4">
                          <span className={`${CATEGORY_COLORS[featuredArticle.category]} text-white text-[10px] font-bold px-2 py-0.5 rounded mb-2 inline-block`}>
                            Top Story
                          </span>
                          <h3 className="text-lg font-black text-text-primary dark:text-white group-hover:text-primary transition-colors">
                            {featuredArticle.title}
                          </h3>
                        </div>
                      )}
                    </Link>
                  )}

                  {/* Secondary articles */}
                  <div className="mb-6">
                    {moreNews.map((a) => (
                      <CompactArticleRow key={a.id} article={a} />
                    ))}
                  </div>

                  {/* Latest news grid */}
                  {latestNewsGrid.length > 0 && (
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-text-secondary dark:text-white/50 mb-4 flex items-center gap-2">
                        <span className="w-1 h-4 bg-primary rounded-full inline-block" />
                        Latest News
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {latestNewsGrid.map((a) => (
                          <ArticleCard key={a.id} article={a} variant="compact" />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-5">
              {/* Latest Results */}
              <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-text-secondary dark:text-white/50 mb-3 pb-2 border-b border-gray-200 dark:border-white/10">
                  Latest Results
                </h4>
                <LatestResults series={seriesKey === 'f1' ? 'f1' : seriesKey === 'fe' ? 'fe' : seriesKey === 'indycar' ? 'indycar' : 'f1'} compact />
              </div>

              {/* Driver Standings */}
              {standingsDrivers.length > 0 && (
                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-text-secondary dark:text-white/50 mb-3 pb-2 border-b border-gray-200 dark:border-white/10">
                    Driver Standings
                  </h4>
                  {standingsDrivers.slice(0, 5).map((row) => (
                    <div key={row.position} className="flex items-center gap-2 py-1.5 border-b border-gray-200 dark:border-white/5 last:border-0">
                      <span className="text-xs font-bold text-text-secondary dark:text-white/50 w-4">{row.position}</span>
                      <span className="text-xs font-black text-text-primary dark:text-white flex-1 truncate">{row.name}</span>
                      <span className="text-xs font-bold text-text-primary dark:text-white">{row.points}</span>
                    </div>
                  ))}
                  <Link to="/standings" className="block text-center text-[11px] font-bold uppercase tracking-wider text-primary hover:underline mt-3">
                    Full Standings
                  </Link>
                </div>
              )}

              {/* Series Calendar */}
              {seriesCalendar.length > 0 && (
                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-text-secondary dark:text-white/50 mb-3 pb-2 border-b border-gray-200 dark:border-white/10">
                    {label} Calendar
                  </h4>
                  {seriesCalendar.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-center gap-2 py-1.5 border-b border-gray-200 dark:border-white/5 last:border-0">
                      <span className="text-base">{flagEmojiFromCountryCode(event.countryCode)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-text-primary dark:text-white truncate">{event.name}</p>
                        <p className="text-[10px] text-text-secondary dark:text-white/50">{formatDateRange(event.date, event.endDate)}</p>
                      </div>
                    </div>
                  ))}
                  <Link to="/schedule" className="block text-center text-[11px] font-bold uppercase tracking-wider text-primary hover:underline mt-3">
                    Full Calendar <ChevronRight className="inline w-3 h-3" />
                  </Link>
                </div>
              )}
            </aside>
          </div>
        )}

        {/* RESULTS tab */}
        {activeTab === 'results' && (
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-text-secondary dark:text-white/50 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full inline-block" />
              Results
            </h2>
            {resultsArticles.length === 0 ? (
              <p className="text-text-secondary dark:text-white/50">No results articles yet.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {resultsArticles.map((a) => <ArticleCard key={a.id} article={a} />)}
              </div>
            )}
          </div>
        )}

        {/* FEATURES tab */}
        {activeTab === 'features' && (
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-text-secondary dark:text-white/50 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full inline-block" />
              Features &amp; Analysis
            </h2>
            {featuresArticles.length === 0 ? (
              <p className="text-text-secondary dark:text-white/50">No feature articles yet.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {featuresArticles.map((a) => <ArticleCard key={a.id} article={a} />)}
              </div>
            )}
          </div>
        )}

        {/* STANDINGS tab */}
        {activeTab === 'standings' && (
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-text-secondary dark:text-white/50 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full inline-block" />
              {label} Standings
            </h2>
            {standingsDrivers.length === 0 ? (
              <p className="text-text-secondary dark:text-white/50">Standings not available for this series.</p>
            ) : (
              <div>
                {/* Tab toggle */}
                <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-white/10 p-1 rounded-lg w-fit">
                  {(['drivers', 'constructors'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setStandingsTab(tab)}
                      className={`px-5 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${
                        standingsTab === tab
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-text-secondary dark:text-white/50 hover:text-text-primary dark:hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {standingsTab === 'drivers' && (
                  <div className="bg-white dark:bg-white/5 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-white/10 text-left">
                          <th className="py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-text-secondary dark:text-white/50">#</th>
                          <th className="py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-text-secondary dark:text-white/50">Driver</th>
                          <th className="py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-text-secondary dark:text-white/50">Team</th>
                          <th className="py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-text-secondary dark:text-white/50 text-right">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standingsDrivers.map((row) => (
                          <tr key={row.position} className="border-t border-gray-100 dark:border-white/5">
                            <td className="py-2.5 px-4 font-bold text-text-secondary dark:text-white/50">{row.position}</td>
                            <td className="py-2.5 px-4 font-bold text-text-primary dark:text-white">{row.name}</td>
                            <td className="py-2.5 px-4 text-text-secondary dark:text-white/60">{row.team}</td>
                            <td className="py-2.5 px-4 font-black text-text-primary dark:text-white text-right">{row.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {standingsTab === 'constructors' && (
                  standingsConstructors.length === 0 ? (
                    <p className="text-text-secondary dark:text-white/50">No constructor standings available.</p>
                  ) : (
                    <div className="bg-white dark:bg-white/5 rounded-xl overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-white/10 text-left">
                            <th className="py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-text-secondary dark:text-white/50">#</th>
                            <th className="py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-text-secondary dark:text-white/50">Constructor</th>
                            <th className="py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-text-secondary dark:text-white/50 text-right">Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {standingsConstructors.map((row) => (
                            <tr key={row.position} className="border-t border-gray-100 dark:border-white/5">
                              <td className="py-2.5 px-4 font-bold text-text-secondary dark:text-white/50">{row.position}</td>
                              <td className="py-2.5 px-4 font-bold text-text-primary dark:text-white">{row.name}</td>
                              <td className="py-2.5 px-4 font-black text-text-primary dark:text-white text-right">{row.points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}

                <Link to="/standings" className="inline-block mt-4 text-sm font-bold text-primary hover:underline">
                  View Full Standings →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* CALENDAR tab */}
        {activeTab === 'calendar' && (
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-text-secondary dark:text-white/50 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full inline-block" />
              {label} Calendar
            </h2>
            {seriesCalendar.length === 0 ? (
              <p className="text-text-secondary dark:text-white/50">No upcoming events for this series.</p>
            ) : (
              <div className="space-y-3">
                {seriesCalendar.map((event) => (
                  <div key={event.id} className="flex items-center gap-4 p-4 bg-white dark:bg-white/5 rounded-xl">
                    <span className="text-3xl">{flagEmojiFromCountryCode(event.countryCode)}</span>
                    <div className="flex-1">
                      <p className="font-black text-text-primary dark:text-white">{event.name}</p>
                      <p className="text-sm text-text-secondary dark:text-white/60">{event.circuit}</p>
                      <p className="text-xs text-text-secondary dark:text-white/40 mt-0.5">{formatDateRange(event.date, event.endDate)}</p>
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary dark:text-white/40">
                      Round {event.round}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <Link to="/schedule" className="inline-block mt-4 text-sm font-bold text-primary hover:underline">
              View Full Schedule →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
