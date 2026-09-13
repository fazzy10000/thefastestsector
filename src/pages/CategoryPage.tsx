import { useState, useEffect, useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ChevronRight } from 'lucide-react'
import ArticleCard from '../components/ArticleCard'
import Pagination from '../components/Pagination'
import RacingLoader from '../components/RacingLoader'
import RaceCountdown from '../components/RaceCountdown'
import LatestResults from '../components/LatestResults'
import SEO from '../components/SEO'
import { useArticles } from '../hooks/useArticles'
import { fetchF1Standings, getFeederSeriesStandings, getIndyCarStandings, getFormulaEStandings, getF1AcademyStandings } from '../lib/standingsApi'
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../lib/types'
import type { Article, Category } from '../lib/types'
import { useRaceSchedule } from '../hooks/useRaceSchedule'
import { sortEventsChronologically } from '../data/raceSchedule2026'
import { flagEmojiFromCountryCode } from '../lib/countryFlags'
import { schedulePath } from '../lib/scheduleLinks'
import { formatDistanceToNow } from 'date-fns'

const PAGE_SIZE = 12

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
  news: 'The latest motorsport news from Formula 1, IndyCar, Formula E, feeder series and more.',
  'formula-1': 'The latest Formula 1 news, results, features and expert analysis from around the world.',
  'formula-e': 'Electric. Global. Cities. The latest Formula E news, results and features.',
  'indycar': 'The latest IndyCar news, results, features and exclusive interviews.',
  'feeder-series': 'Rising stars. Fierce battles. The future of motorsport starts here.',
  'exclusive': 'Exclusive interviews, behind-the-scenes access and premium content.',
  'f1-academy': 'Empowering the next generation of female racing drivers.',
  'other': 'More motorsport content from The Fastest Sector.',
}

const TABS = ['news', 'results', 'features'] as const
type Tab = typeof TABS[number]

function isTab(value: string | null): value is Tab {
  return TABS.includes(value as Tab)
}

interface StandingsDriver {
  position: number
  name: string
  team: string
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
  const [searchParams, setSearchParams] = useSearchParams()
  const isNewsHub = category === 'news'
  const cat = (category ?? 'other') as Category
  const { articles, meta, loading, fetchArticles } = useArticles()
  const tabParam = searchParams.get('tab')
  const page = Math.max(1, Number(searchParams.get('page') || '1') || 1)
  const [activeTab, setActiveTab] = useState<Tab>(() => (isTab(tabParam) ? tabParam : 'news'))
  const [standingsDrivers, setStandingsDrivers] = useState<StandingsDriver[]>([])

  useEffect(() => {
    setActiveTab(isTab(tabParam) ? tabParam : 'news')
  }, [tabParam, category])

  const contentTypeForTab =
    activeTab === 'results' ? 'results' : activeTab === 'features' ? 'opinion' : 'news'

  useEffect(() => {
    const opts: Parameters<typeof fetchArticles>[0] = {
      status: 'published',
      contentType: contentTypeForTab,
      page,
      limit: PAGE_SIZE,
    }
    if (!isNewsHub) opts.category = cat
    void fetchArticles(opts)
  }, [fetchArticles, cat, isNewsHub, contentTypeForTab, page])

  const label = isNewsHub ? 'News' : (CATEGORY_LABELS[cat] ?? 'Other')
  const tagline = CATEGORY_TAGLINES[isNewsHub ? 'news' : cat] ?? ''
  const seriesKey = isNewsHub ? null : (CATEGORY_SERIES[cat] ?? null)

  const { events: schedule } = useRaceSchedule()

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
      } catch {
        // standings unavailable
      }
    }
    if (!isNewsHub) load()
  }, [cat, isNewsHub])

  const selectTab = (tab: Tab) => {
    setActiveTab(tab)
    const next = new URLSearchParams(searchParams)
    next.delete('page')
    if (tab === 'news') next.delete('tab')
    else next.set('tab', tab)
    setSearchParams(next, { replace: true })
  }

  const setPage = (p: number) => {
    const next = new URLSearchParams(searchParams)
    if (p <= 1) next.delete('page')
    else next.set('page', String(p))
    setSearchParams(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Page 1 news tab: featured + 3 compact + rest as cards. Later pages: all cards.
  const featuredArticle = activeTab === 'news' && page === 1 ? articles[0] ?? null : null
  const moreNews = activeTab === 'news' && page === 1 ? articles.slice(1, 4) : []
  const latestNewsGrid =
    activeTab === 'news' ? (page === 1 ? articles.slice(4) : articles) : []
  const tabArticles = activeTab === 'news' ? [] : articles

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
                to={schedulePath(seriesKey)}
                className="block text-center mt-3 text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
              >
                View Full Schedule
              </Link>
            </div>
          )}
        </div>
      </section>

      <div className="bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-white/10 sticky top-[88px] z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => selectTab(tab)}
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
        {activeTab === 'news' && (
          <div className="grid lg:grid-cols-[1fr_300px] gap-8">
            <div>
              {articles.length === 0 ? (
                <p className="text-text-secondary dark:text-white/50">No {label.toLowerCase()} articles yet.</p>
              ) : (
                <>
                  <h2 className="text-xs font-black uppercase tracking-wider text-text-secondary dark:text-white/50 mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 bg-primary rounded-full inline-block" />
                    Top Stories
                  </h2>

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
                              {isNewsHub ? CATEGORY_LABELS[featuredArticle.category] : 'Top Story'}
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
                            {isNewsHub ? CATEGORY_LABELS[featuredArticle.category] : 'Top Story'}
                          </span>
                          <h3 className="text-lg font-black text-text-primary dark:text-white group-hover:text-primary transition-colors">
                            {featuredArticle.title}
                          </h3>
                        </div>
                      )}
                    </Link>
                  )}

                  <div className="mb-6">
                    {moreNews.map((a) => (
                      <CompactArticleRow key={a.id} article={a} />
                    ))}
                  </div>

                  {latestNewsGrid.length > 0 && (
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-text-secondary dark:text-white/50 mb-4 flex items-center gap-2">
                        <span className="w-1 h-4 bg-primary rounded-full inline-block" />
                        {page === 1 ? 'Latest News' : `Page ${page}`}
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {latestNewsGrid.map((a) => (
                          <ArticleCard key={a.id} article={a} variant="compact" />
                        ))}
                      </div>
                    </div>
                  )}

                  <Pagination
                    className="mt-8"
                    page={page}
                    total={meta.total}
                    pageSize={PAGE_SIZE}
                    onChange={setPage}
                  />
                </>
              )}
            </div>

            <aside className="space-y-5">
              {!isNewsHub && (
                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-text-secondary dark:text-white/50 mb-3 pb-2 border-b border-gray-200 dark:border-white/10">
                    Latest Results
                  </h4>
                  <LatestResults series={seriesKey === 'f1' ? 'f1' : seriesKey === 'fe' ? 'fe' : seriesKey === 'indycar' ? 'indycar' : seriesKey === 'f1-academy' ? 'f1-academy' : 'f2'} compact />
                </div>
              )}

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

              {seriesCalendar.length > 0 && (
                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-text-secondary dark:text-white/50 mb-3 pb-2 border-b border-gray-200 dark:border-white/10">
                    {label} Calendar
                  </h4>
                  {seriesCalendar.map((event) => (
                    <div key={event.id} className="flex items-center gap-2 py-1.5 border-b border-gray-200 dark:border-white/5 last:border-0">
                      <span className="text-base">{flagEmojiFromCountryCode(event.countryCode)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-text-primary dark:text-white truncate">{event.name}</p>
                        <p className="text-[10px] text-text-secondary dark:text-white/50">{formatDateRange(event.date, event.endDate)}</p>
                      </div>
                    </div>
                  ))}
                  <Link to={schedulePath(seriesKey)} className="block text-center text-[11px] font-bold uppercase tracking-wider text-primary hover:underline mt-3">
                    Full Calendar <ChevronRight className="inline w-3 h-3" />
                  </Link>
                </div>
              )}

              {isNewsHub && (
                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-text-secondary dark:text-white/50 mb-3 pb-2 border-b border-gray-200 dark:border-white/10">
                    Browse by Series
                  </h4>
                  {[
                    { label: 'Formula 1', to: '/category/formula-1' },
                    { label: 'Feeder Series', to: '/category/feeder-series' },
                    { label: 'F1 Academy', to: '/category/f1-academy' },
                    { label: 'IndyCar', to: '/category/indycar' },
                    { label: 'Formula E', to: '/category/formula-e' },
                  ].map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="flex items-center justify-between py-2 text-sm font-semibold text-text-primary dark:text-white hover:text-primary border-b border-gray-200 dark:border-white/5 last:border-0"
                    >
                      {item.label}
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  ))}
                </div>
              )}
            </aside>
          </div>
        )}

        {activeTab === 'results' && (
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-text-secondary dark:text-white/50 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full inline-block" />
              Results
            </h2>
            {tabArticles.length === 0 ? (
              <p className="text-text-secondary dark:text-white/50">No results articles yet.</p>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  {tabArticles.map((a) => <ArticleCard key={a.id} article={a} />)}
                </div>
                <Pagination
                  className="mt-8"
                  page={page}
                  total={meta.total}
                  pageSize={PAGE_SIZE}
                  onChange={setPage}
                />
              </>
            )}
          </div>
        )}

        {activeTab === 'features' && (
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-text-secondary dark:text-white/50 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full inline-block" />
              Features &amp; Analysis
            </h2>
            {tabArticles.length === 0 ? (
              <p className="text-text-secondary dark:text-white/50">No feature articles yet.</p>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-6">
                  {tabArticles.map((a) => <ArticleCard key={a.id} article={a} />)}
                </div>
                <Pagination
                  className="mt-8"
                  page={page}
                  total={meta.total}
                  pageSize={PAGE_SIZE}
                  onChange={setPage}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
