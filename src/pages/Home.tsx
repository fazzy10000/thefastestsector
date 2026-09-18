import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, CheckCircle } from 'lucide-react'
import SEO from '../components/SEO'
import RacingLoader from '../components/RacingLoader'
import RaceCountdown from '../components/RaceCountdown'
import AdSlot from '../components/AdSlot'
import { useArticles } from '../hooks/useArticles'
import { useQuizzes } from '../hooks/useQuizzes'
import { CATEGORY_LABELS, CATEGORY_COLORS, type Article } from '../lib/types'
import { useRaceSchedule } from '../hooks/useRaceSchedule'
import { sortEventsChronologically } from '../data/raceSchedule2026'
import { flagEmojiFromCountryCode } from '../lib/countryFlags'
import { quizCoverImage } from '../lib/quizCovers'
import { schedulePath } from '../lib/scheduleLinks'
import LatestResults from '../components/LatestResults'
import { formatDistanceToNow, format } from 'date-fns'
import { articlePath } from '../lib/articlePath'

const AUTOPLAY_MS = 6000

function safeTimeAgo(ts: number | null | undefined): string {
  if (!ts || isNaN(ts)) return ''
  try {
    return formatDistanceToNow(new Date(ts), { addSuffix: true })
  } catch {
    return ''
  }
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start + 'T12:00:00')
  const e = new Date(end + 'T12:00:00')
  if (start === end) return format(s, 'd MMM yyyy')
  if (s.getMonth() === e.getMonth())
    return `${format(s, 'd')}–${format(e, 'd MMM yyyy')}`
  return `${format(s, 'd MMM')} – ${format(e, 'd MMM yyyy')}`
}

const SERIES_LABELS: Record<string, string> = {
  f1: 'F1',
  f2: 'F2',
  f3: 'F3',
  fe: 'FORMULA E',
  indycar: 'INDYCAR',
  'f1-academy': 'F1 ACADEMY',
}

const SERIES_BADGE_COLORS: Record<string, string> = {
  f1: 'bg-red-600',
  f2: 'bg-orange-600',
  f3: 'bg-orange-500',
  fe: 'bg-sky-500',
  indycar: 'bg-indigo-800',
  'f1-academy': 'bg-red-500',
}

function SectionHeading({
  title,
  linkLabel = 'View All',
  linkTo,
}: {
  title: string
  linkLabel?: string
  linkTo: string
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="flex items-center gap-3 text-xl font-black uppercase tracking-wide text-text-primary dark:text-white">
        <span className="w-1 h-6 bg-primary rounded-full inline-block" />
        {title}
      </h2>
      <Link
        to={linkTo}
        className="text-xs font-bold uppercase tracking-wider text-primary hover:underline flex items-center gap-1"
      >
        {linkLabel} <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  )
}

function CompactArticleItem({ article }: { article: Article }) {
  const timeAgo = safeTimeAgo(article.publishedAt ?? article.createdAt)
  return (
    <Link
      to={articlePath(article)}
      className="flex gap-3 py-3 border-b border-gray-100 dark:border-white/5 last:border-0 group"
    >
      {article.featuredImage && (
        <img
          src={article.featuredImage}
          alt={article.title}
          className="w-16 h-16 object-cover rounded flex-none"
        />
      )}
      <div className="min-w-0">
        <span
          className={`${CATEGORY_COLORS[article.category]} text-white text-[10px] font-bold px-1.5 py-0.5 rounded mb-1 inline-block`}
        >
          {CATEGORY_LABELS[article.category]}
        </span>
        <p className="text-sm font-bold text-text-primary dark:text-white line-clamp-2 group-hover:text-primary transition-colors leading-snug">
          {article.title}
        </p>
        {timeAgo && (
          <p className="text-[11px] text-text-secondary dark:text-white/50 mt-1">{timeAgo}</p>
        )}
      </div>
    </Link>
  )
}

export default function Home() {
  const { articles, loading, fetchArticles } = useArticles()
  const { quizzes, fetchQuizzes } = useQuizzes()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    void fetchArticles({ status: 'published', limit: 24 })
    void fetchQuizzes({ status: 'published' })
  }, [fetchArticles, fetchQuizzes])

  const published = articles.filter((a) => a.status === 'published')
  const heroArticles = published.slice(0, 5)
  const slideCount = heroArticles.length
  const heroIds = useMemo(
    () => new Set(published.slice(0, 5).map((a) => a.id)),
    [published],
  )

  // Latest news: skip hero carousel articles
  const latestNewsArticles = published.filter((a) => !heroIds.has(a.id)).slice(0, 4)
  const featuredNewsArticle = latestNewsArticles[0]
  const compactNewsArticles = latestNewsArticles.slice(1)

  // Featured stories: prefer opinion / featured, never repeat hero
  const featuredStories = useMemo(() => {
    const preferred = published.filter(
      (a) => !heroIds.has(a.id) && (a.contentType === 'opinion' || a.featured),
    )
    if (preferred.length >= 4) return preferred.slice(0, 4)
    const used = new Set([...heroIds, ...preferred.map((a) => a.id)])
    const fillers = published.filter((a) => !used.has(a.id))
    return [...preferred, ...fillers].slice(0, 4)
  }, [published, heroIds])

  // Quiz of the week
  const weekQuiz = useMemo(
    () => quizzes.find((q) => q.status === 'published') ?? null,
    [quizzes],
  )

  // Race schedule data
  const { events: schedule } = useRaceSchedule()
  const upcomingF1 = useMemo(
    () =>
      sortEventsChronologically(
        schedule.filter((e) => e.series === 'f1' && e.status === 'upcoming'),
      )[0] ?? null,
    [schedule],
  )

  const supportSeriesLabels = useMemo(() => {
    if (!upcomingF1) return [] as string[]
    const start = upcomingF1.date
    const end = upcomingF1.endDate
    const labels = sortEventsChronologically(
      schedule.filter((e) => {
        if (e.series === 'f1' || e.status !== 'upcoming') return false
        // Same race weekend: date ranges overlap
        return e.date <= end && e.endDate >= start
      }),
    ).map((e) => SERIES_LABELS[e.series] ?? e.series.toUpperCase())
    return [...new Set(labels)]
  }, [schedule, upcomingF1])

  const { thisWeekend, weekendHeading } = useMemo(() => {
    const now = new Date()
    const day = now.getDay() // 0 Sun … 5 Fri … 6 Sat
    let friday: Date
    if (day === 5 || day === 6 || day === 0) {
      const offset = day === 0 ? -2 : day === 6 ? -1 : 0
      friday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset)
    } else {
      friday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (5 - day))
    }
    const sunday = new Date(friday.getFullYear(), friday.getMonth(), friday.getDate() + 2)
    const weekendStart = friday.getTime()
    const weekendEnd = sunday.getTime() + 24 * 60 * 60 * 1000 - 1

    const overlapping = sortEventsChronologically(
      schedule.filter((e) => {
        if (e.status !== 'upcoming') return false
        const start = new Date(e.date + 'T00:00:00').getTime()
        const end = new Date(e.endDate + 'T23:59:59').getTime()
        return start <= weekendEnd && end >= weekendStart
      }),
    )

    if (overlapping.length > 0) {
      return { thisWeekend: overlapping, weekendHeading: 'This Weekend in Motorsport' }
    }

    return {
      thisWeekend: sortEventsChronologically(
        schedule.filter((e) => e.status === 'upcoming'),
      ).slice(0, 5),
      weekendHeading: 'Coming Up in Motorsport',
    }
  }, [schedule])

  const nextRaceDate = useMemo(
    () => (upcomingF1 ? new Date(upcomingF1.date + 'T00:00:00') : null),
    [upcomingF1],
  )

  const goTo = useCallback(
    (idx: number) => setCurrentSlide(((idx % slideCount) + slideCount) % slideCount),
    [slideCount],
  )

  useEffect(() => {
    if (paused || slideCount < 2) return
    const timer = setInterval(() => goTo(currentSlide + 1), AUTOPLAY_MS)
    return () => clearInterval(timer)
  }, [currentSlide, paused, slideCount, goTo])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <RacingLoader message="Loading the latest from the grid..." />
      </div>
    )
  }

  return (
    <div>
      <SEO />
      <h1 className="sr-only">The Fastest Sector — Motorsport news and analysis</h1>

      {/* ══════════════════════════════════════════
          SECTION 1: 3-Column Hero
      ══════════════════════════════════════════ */}
      <section className="bg-surface-dark text-white">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row min-h-[420px]">

          {/* Left: Featured Story Carousel */}
          <div
            className="relative lg:w-[45%] flex-none min-h-[320px] lg:min-h-[420px]"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {heroArticles.length > 0 ? (
              <>
                {heroArticles.map((article, i) => {
                  const timeAgo = safeTimeAgo(article.publishedAt ?? article.createdAt)
                  return (
                    <Link
                      key={article.id}
                      to={articlePath(article)}
                      className={`absolute inset-0 transition-opacity duration-700 ${
                        i === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                      }`}
                      tabIndex={i === currentSlide ? 0 : -1}
                    >
                      <img
                        src={article.featuredImage || '/placeholder.jpg'}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                      <div className="absolute top-4 left-4">
                        <span className="bg-primary text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded">
                          Top Story
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                        <h2 className="text-white text-xl md:text-2xl font-black leading-tight mb-2 max-w-lg">
                          {article.title}
                        </h2>
                        <p className="text-white/70 text-sm line-clamp-2 mb-3 max-w-md hidden sm:block">
                          {article.excerpt}
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="inline-block px-4 py-1.5 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-primary-dark transition-colors">
                            Read More
                          </span>
                          {timeAgo && (
                            <span className="text-white/50 text-xs">{timeAgo}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  )
                })}

                {/* Dots */}
                {slideCount > 1 && (
                  <div className="absolute bottom-3 right-4 z-20 flex items-center gap-1.5">
                    {heroArticles.map((_, i) => (
                      <button
                        key={i}
                        onClick={(e) => {
                          e.preventDefault()
                          goTo(i)
                        }}
                        className={`rounded-full transition-all ${
                          i === currentSlide ? 'w-6 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-white/40'
                        }`}
                        aria-label={`Slide ${i + 1}`}
                      />
                    ))}
                  </div>
                )}

                {/* Progress bar */}
                {slideCount > 1 && !paused && (
                  <div className="absolute top-0 left-0 right-0 z-20 h-0.5 bg-white/10">
                    <div
                      className="h-full bg-primary carousel-progress"
                      style={{ animationDuration: `${AUTOPLAY_MS}ms` }}
                      key={currentSlide}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-white/40 text-sm">
                No articles published yet
              </div>
            )}
          </div>

          {/* Center: Upcoming Race Weekend */}
          <div className="lg:w-[30%] flex-none bg-surface-darker border-l border-r border-white/5 p-5 flex flex-col">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">
              Upcoming Race Weekend
            </p>

            {upcomingF1 ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{flagEmojiFromCountryCode(upcomingF1.countryCode)}</span>
                  <div>
                    <h3 className="font-black text-lg leading-tight">{upcomingF1.name}</h3>
                    <p className="text-xs text-white/60">
                      {formatDateRange(upcomingF1.date, upcomingF1.endDate)}
                    </p>
                  </div>
                </div>

                {nextRaceDate && <RaceCountdown targetDate={nextRaceDate} />}

                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-[10px] uppercase tracking-widest text-white/50 mb-2">
                    Support Series
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {supportSeriesLabels.length > 0 ? (
                      supportSeriesLabels.map((label) => (
                        <span
                          key={label}
                          className="text-[11px] font-bold border border-white/20 px-2 py-0.5 rounded text-white/70"
                        >
                          {label}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-white/40">None scheduled</span>
                    )}
                  </div>
                </div>

                <div className="mt-auto pt-5">
                  <Link
                    to={schedulePath('f1')}
                    className="block w-full text-center py-2 bg-primary text-xs font-bold uppercase tracking-wider hover:bg-primary-dark transition-colors rounded"
                  >
                    Full Schedule
                  </Link>
                </div>
              </>
            ) : (
              <p className="text-white/50 text-sm">Season schedule TBC</p>
            )}
          </div>

          {/* Right: This Weekend in Motorsport */}
          <div className="lg:flex-1 bg-gray-50 dark:bg-surface-darker border-l border-white/5 p-5 flex flex-col">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-900 dark:text-white mb-3">
              {weekendHeading}
            </p>
            <div className="flex-1 space-y-0 overflow-y-auto">
              {thisWeekend.length > 0 ? (
                thisWeekend.map((event) => (
                  <Link
                    key={event.id}
                    to="/schedule"
                    className="flex items-center gap-3 py-2.5 border-b border-gray-200 dark:border-white/5 last:border-0 group"
                  >
                    <span
                      className={`${SERIES_BADGE_COLORS[event.series] ?? 'bg-gray-500'} text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex-none`}
                    >
                      {SERIES_LABELS[event.series] ?? event.series.toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors">
                        {event.name}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-white/50">
                        {formatDateRange(event.date, event.endDate)}
                      </p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400 dark:text-white/30 flex-none" />
                  </Link>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-white/50">
                  {weekendHeading.startsWith('This')
                    ? 'No events this weekend'
                    : 'No upcoming events'}
                </p>
              )}
            </div>
            <Link
              to="/schedule"
              className="mt-4 block text-center py-2 border border-gray-300 dark:border-white/20 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors rounded"
            >
              View All Schedules
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 2: Latest News + Sector Sweep
      ══════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 py-10 grid lg:grid-cols-[1fr_240px] gap-8 items-start">
        {/* Latest News */}
        <div>
          <SectionHeading title="Latest News" linkLabel="View All News" linkTo="/category/news" />

          {featuredNewsArticle && (
            <Link
              to={articlePath(featuredNewsArticle)}
              className="group flex flex-col sm:flex-row gap-4 mb-4 p-4 rounded-xl bg-surface-card dark:bg-white/5 hover:shadow-md dark:hover:bg-white/8 transition-all"
            >
              {featuredNewsArticle.featuredImage && (
                <img
                  src={featuredNewsArticle.featuredImage}
                  alt={featuredNewsArticle.title}
                  className="w-full sm:w-52 h-36 object-cover rounded-lg flex-none"
                />
              )}
              <div className="min-w-0">
                <span
                  className={`${CATEGORY_COLORS[featuredNewsArticle.category]} text-white text-[10px] font-bold px-2 py-0.5 rounded mb-2 inline-block`}
                >
                  {CATEGORY_LABELS[featuredNewsArticle.category]}
                </span>
                <h3 className="text-base font-black text-text-primary dark:text-white group-hover:text-primary transition-colors leading-snug mb-1">
                  {featuredNewsArticle.title}
                </h3>
                <p className="text-sm text-text-secondary dark:text-white/60 line-clamp-2 mb-2">
                  {featuredNewsArticle.excerpt}
                </p>
                <p className="text-[11px] text-text-secondary dark:text-white/40">
                  {safeTimeAgo(featuredNewsArticle.publishedAt ?? featuredNewsArticle.createdAt)}
                </p>
              </div>
            </Link>
          )}

          <div>
            {compactNewsArticles.map((a) => (
              <CompactArticleItem key={a.id} article={a} />
            ))}
          </div>
        </div>

        {/* Sector Sweep promo + ad */}
        <div className="space-y-4">
        <div className="bg-surface-darker text-white rounded-lg p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
            Newsletter
          </p>
          <h3 className="text-lg font-black mb-1 leading-tight">
            SECTOR <span className="text-primary">SWEEP</span>
          </h3>
          <p className="text-xs text-white/55 mb-3">
            Motorsport news in your inbox.
          </p>

          <ul className="space-y-1.5 mb-4">
            {[
              'Top stories & analysis',
              'Exclusives',
              'Monthly digest',
            ].map((item) => (
              <li key={item} className="flex items-start gap-1.5 text-[11px] text-white/65">
                <CheckCircle className="w-3 h-3 text-primary flex-none mt-0.5" />
                {item}
              </li>
            ))}
          </ul>

          <Link
            to="/sector-sweep"
            className="text-[11px] font-bold uppercase tracking-wider text-primary hover:underline inline-flex items-center gap-1"
          >
            View Latest Edition <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <AdSlot placement="home" />
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 3: Quiz of the Week
      ══════════════════════════════════════════ */}
      {weekQuiz && (
        <section className="max-w-7xl mx-auto px-4 py-4 pb-10">
          <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-6 flex flex-col sm:flex-row gap-6 items-center">
            <img
              src={quizCoverImage(weekQuiz.category, weekQuiz.featuredImage)}
              alt={weekQuiz.title}
              className="w-full sm:w-56 h-40 object-cover rounded-lg flex-none"
            />
            <div className="flex-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2">
                Quiz of the Week
              </p>
              <h3 className="text-xl font-black text-text-primary dark:text-white mb-2">
                {weekQuiz.title}
              </h3>
              <p className="text-sm text-text-secondary dark:text-white/60 mb-4">
                {weekQuiz.description}
              </p>
              <Link
                to={`/quiz/${weekQuiz.slug}`}
                className="inline-block px-5 py-2 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-primary-dark transition-colors"
              >
                Take the Quiz
              </Link>
            </div>
            <div className="hidden sm:block">
              <Link
                to="/quizzes"
                className="text-xs font-bold uppercase tracking-wider text-primary hover:underline flex items-center gap-1 whitespace-nowrap"
              >
                View All Quizzes <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          SECTION 4: Latest Results
      ══════════════════════════════════════════ */}
      <section className="bg-gray-50 dark:bg-surface-darker py-10">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeading title="Latest Results" linkLabel="View Standings" linkTo="/standings" />
          <div className="max-w-md bg-white dark:bg-white/5 rounded-xl p-4">
            <LatestResults series="f1" standingsHref="/standings" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SECTION 5: Featured Stories
      ══════════════════════════════════════════ */}
      {featuredStories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-10">
          <SectionHeading
            title="Featured Stories"
            linkLabel="View All Features"
            linkTo="/category/news?tab=features"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredStories.map((article) => {
              const timeAgo = safeTimeAgo(article.publishedAt ?? article.createdAt)
              return (
                <Link
                  key={article.id}
                  to={articlePath(article)}
                  className="group rounded-xl overflow-hidden bg-surface-card dark:bg-white/5 hover:shadow-lg transition-shadow"
                >
                  <div className="relative">
                    <img
                      src={article.featuredImage || '/placeholder.jpg'}
                      alt={article.title}
                      className="w-full h-40 object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <span
                        className={`${CATEGORY_COLORS[article.category]} text-white text-[10px] font-bold px-2 py-0.5 rounded`}
                      >
                        {CATEGORY_LABELS[article.category]}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-black text-text-primary dark:text-white group-hover:text-primary transition-colors leading-snug mb-2 line-clamp-3">
                      {article.title}
                    </h3>
                    {timeAgo && (
                      <p className="text-[11px] text-text-secondary dark:text-white/40">{timeAgo}</p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
