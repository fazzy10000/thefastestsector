import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { AlertTriangle, Clock, Share2, Copy, ChevronRight } from 'lucide-react'
import { useArticles } from '../hooks/useArticles'
import { useAuth } from '../hooks/useAuth'
import { fetchF1Standings } from '../lib/standingsApi'
import { buildRaceSchedule, sortEventsChronologically } from '../data/raceSchedule2026'
import { flagEmojiFromCountryCode } from '../lib/countryFlags'
import RacingLoader from '../components/RacingLoader'
import SEO from '../components/SEO'
import AuthorBlock from '../components/AuthorBlock'
import ReadNext from '../components/ReadNext'
import LatestResults from '../components/LatestResults'
import RaceCountdown from '../components/RaceCountdown'
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../lib/types'
import type { Article } from '../lib/types'

interface StandingsRow {
  position: number
  name: string
  code: string
  team: string
  points: number
}

function safeTimeAgo(ts: number | null | undefined): string {
  if (!ts || isNaN(ts)) return ''
  try { return formatDistanceToNow(new Date(ts), { addSuffix: true }) } catch { return '' }
}

function shareUrl(): string {
  return typeof window !== 'undefined' ? window.location.href : ''
}

function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)
  const url = shareUrl()
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const copyLink = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2 py-3 border-y border-gray-100 dark:border-white/10">
      <span className="text-xs font-bold uppercase tracking-wider text-text-secondary dark:text-white/50 flex items-center gap-1.5">
        <Share2 className="w-3.5 h-3.5" />
        Share
      </span>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-xs font-bold rounded hover:bg-gray-800 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        X
      </a>
      <a
        href={`https://facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noreferrer"
        className="px-3 py-1.5 bg-[#1877F2] text-white text-xs font-bold rounded hover:bg-[#166FE5] transition-colors"
      >
        Facebook
      </a>
      <a
        href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
        target="_blank"
        rel="noreferrer"
        className="px-3 py-1.5 bg-[#25D366] text-white text-xs font-bold rounded hover:bg-[#1EBD59] transition-colors"
      >
        WhatsApp
      </a>
      <button
        onClick={copyLink}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-white/10 text-text-primary dark:text-white text-xs font-bold rounded hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
      >
        <Copy className="w-3 h-3" />
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
      <h4 className="text-xs font-black uppercase tracking-wider text-text-secondary dark:text-white/50 mb-3 pb-2 border-b border-gray-200 dark:border-white/10">
        {title}
      </h4>
      {children}
    </div>
  )
}

function RelatedArticleCard({ article }: { article: Article }) {
  const timeAgo = safeTimeAgo(article.publishedAt ?? article.createdAt)
  return (
    <Link to={`/article/${article.slug}`} className="flex gap-3 py-2.5 border-b border-gray-200 dark:border-white/10 last:border-0 group">
      {article.featuredImage && (
        <img src={article.featuredImage} alt={article.title} className="w-14 h-14 object-cover rounded flex-none" />
      )}
      <div className="min-w-0">
        <span className={`${CATEGORY_COLORS[article.category]} text-white text-[10px] font-bold px-1.5 py-0.5 rounded mb-1 inline-block`}>
          {CATEGORY_LABELS[article.category]}
        </span>
        <p className="text-xs font-bold text-text-primary dark:text-white line-clamp-2 group-hover:text-primary transition-colors leading-snug">
          {article.title}
        </p>
        {timeAgo && <p className="text-[10px] text-text-secondary dark:text-white/50 mt-0.5">{timeAgo}</p>}
      </div>
    </Link>
  )
}

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams] = useSearchParams()
  const isPreview = searchParams.get('preview') === 'true'
  const { getArticleBySlug, articles } = useArticles()
  const { isAuthenticated } = useAuth()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [standingsDrivers, setStandingsDrivers] = useState<StandingsRow[]>([])
  const [standingsTab, setStandingsTab] = useState<'drivers' | 'constructors'>('drivers')
  const [standingsConstructors, setStandingsConstructors] = useState<{ position: number; name: string; points: number }[]>([])

  useEffect(() => {
    async function load() {
      if (!slug) return
      const found = await getArticleBySlug(slug, isPreview && isAuthenticated)
      if (found && found.status !== 'published' && !(isPreview && isAuthenticated)) {
        setArticle(null)
      } else {
        setArticle(found)
      }
      setLoading(false)
    }
    load()
  }, [slug, getArticleBySlug, isPreview, isAuthenticated])

  useEffect(() => {
    fetchF1Standings()
      .then((data) => {
        setStandingsDrivers(
          data.drivers.slice(0, 5).map((d) => ({
            position: d.position,
            name: d.name,
            code: d.code,
            team: d.team,
            points: d.points,
          })),
        )
        setStandingsConstructors(
          data.constructors.slice(0, 5).map((c) => ({
            position: c.position,
            name: c.name,
            points: c.points,
          })),
        )
      })
      .catch(() => {
        setStandingsDrivers([
          { position: 1, name: 'Max Verstappen', code: 'VER', team: 'Red Bull', points: 195 },
          { position: 2, name: 'Lando Norris', code: 'NOR', team: 'McLaren', points: 171 },
          { position: 3, name: 'Lewis Hamilton', code: 'HAM', team: 'Mercedes', points: 140 },
          { position: 4, name: 'Charles Leclerc', code: 'LEC', team: 'Ferrari', points: 132 },
          { position: 5, name: 'George Russell', code: 'RUS', team: 'Mercedes', points: 118 },
        ])
      })
  }, [])

  const schedule = useMemo(() => buildRaceSchedule(Date.now()), [])
  const nextF1Event = useMemo(
    () =>
      sortEventsChronologically(
        schedule.filter((e) => e.series === 'f1' && e.status === 'upcoming'),
      )[0] ?? null,
    [schedule],
  )
  const nextF1Date = useMemo(
    () => (nextF1Event ? new Date(nextF1Event.date + 'T00:00:00') : null),
    [nextF1Event],
  )

  const relatedArticles = useMemo(
    () =>
      article
        ? articles
            .filter((a) => a.id !== article.id && a.status === 'published' && a.category === article.category)
            .slice(0, 3)
        : [],
    [article, articles],
  )

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <RacingLoader message="Fetching article..." />
      </div>
    )
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-text-primary dark:text-white mb-4">Article Not Found</h1>
        <Link to="/" className="text-primary hover:underline">Back to Home</Link>
      </div>
    )
  }

  const timeAgo = safeTimeAgo(article.publishedAt ?? article.createdAt)
  const wordCount = article.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length
  const readTime = Math.max(1, Math.ceil(wordCount / 200))

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <SEO
        title={article.title}
        description={article.excerpt}
        image={article.featuredImage}
        type="article"
        article={{
          author: article.author,
          publishedTime: article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined,
          tags: article.tags,
        }}
      />

      {isPreview && article.status !== 'published' && (
        <div className="mb-6 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>You are viewing a <strong>{article.status}</strong> preview. This article is not publicly visible.</span>
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-text-secondary dark:text-white/50 mb-6">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to={`/category/${article.category}`} className="hover:text-primary transition-colors capitalize">
          {CATEGORY_LABELS[article.category]}
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="truncate max-w-[200px] text-text-primary dark:text-white/70">{article.title}</span>
      </nav>

      <div className="grid lg:grid-cols-[1fr_320px] gap-10">
        {/* Article content */}
        <article>
          {/* Category badge */}
          <div className="mb-3">
            <span className={`${CATEGORY_COLORS[article.category]} text-white text-xs font-bold px-2.5 py-1 rounded`}>
              {CATEGORY_LABELS[article.category]}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-black text-text-primary dark:text-white leading-tight mb-4">
            {article.title}
          </h1>

          {/* Author + meta row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-black flex-none">
              {article.author.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary dark:text-white">{article.author}</p>
              <div className="flex items-center gap-2 text-xs text-text-secondary dark:text-white/50">
                {timeAgo && <span>{timeAgo}</span>}
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {readTime} min read
                </span>
              </div>
            </div>
          </div>

          {/* Share buttons */}
          <ShareButtons title={article.title} />

          {/* Featured image */}
          {article.featuredImage && (
            <div className="rounded-xl overflow-hidden my-6">
              <img
                src={article.featuredImage}
                alt={article.title}
                className="w-full h-auto object-cover max-h-[500px]"
              />
            </div>
          )}

          {/* Article body */}
          <div
            className="article-content text-text-primary dark:text-white/90 text-lg leading-relaxed"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="mt-10 pt-6 border-t border-gray-200 dark:border-white/10">
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-gray-100 dark:bg-white/10 text-text-secondary dark:text-white/60 text-xs rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <AuthorBlock authorId={article.authorId} authorName={article.author} />
          <ReadNext current={article} />
        </article>

        {/* Sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
          {/* Latest Results */}
          <SidebarSection title="Latest Results">
            <LatestResults series="f1" />
          </SidebarSection>

          {/* Next F1 Event */}
          {nextF1Event && nextF1Date && (
            <SidebarSection title="Next F1 Event">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{flagEmojiFromCountryCode(nextF1Event.countryCode)}</span>
                <div>
                  <p className="text-sm font-black text-text-primary dark:text-white leading-tight">{nextF1Event.name}</p>
                  <p className="text-[11px] text-text-secondary dark:text-white/50">{nextF1Event.circuit}</p>
                </div>
              </div>
              <div className="bg-surface-dark rounded-lg p-3 text-white">
                <RaceCountdown targetDate={nextF1Date} />
              </div>
              <Link
                to="/schedule"
                className="block text-center text-[11px] font-bold uppercase tracking-wider text-primary hover:underline mt-3"
              >
                View Full Schedule
              </Link>
            </SidebarSection>
          )}

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <SidebarSection title="Related Articles">
              {relatedArticles.map((a) => (
                <RelatedArticleCard key={a.id} article={a} />
              ))}
              <Link
                to={`/category/${article.category}`}
                className="block text-center text-[11px] font-bold uppercase tracking-wider text-primary hover:underline mt-3"
              >
                More {CATEGORY_LABELS[article.category]} <ChevronRight className="inline w-3 h-3" />
              </Link>
            </SidebarSection>
          )}

          {/* Standings */}
          {standingsDrivers.length > 0 && (
            <SidebarSection title="F1 Standings">
              {/* Tabs */}
              <div className="flex gap-1 mb-3 bg-gray-100 dark:bg-white/10 p-0.5 rounded-lg">
                {(['drivers', 'constructors'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setStandingsTab(tab)}
                    className={`flex-1 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors ${
                      standingsTab === tab
                        ? 'bg-white dark:bg-white/20 text-text-primary dark:text-white shadow-sm'
                        : 'text-text-secondary dark:text-white/50 hover:text-text-primary dark:hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {standingsTab === 'drivers' && standingsDrivers.map((row) => (
                <div key={row.position} className="flex items-center gap-2 py-1.5 border-b border-gray-200 dark:border-white/5 last:border-0">
                  <span className="text-[11px] font-bold text-text-secondary dark:text-white/50 w-4">{row.position}</span>
                  <span className="text-[11px] font-black text-text-primary dark:text-white flex-1 truncate">{row.name}</span>
                  <span className="text-[11px] font-bold text-text-primary dark:text-white">{row.points}</span>
                </div>
              ))}

              {standingsTab === 'constructors' && standingsConstructors.map((row) => (
                <div key={row.position} className="flex items-center gap-2 py-1.5 border-b border-gray-200 dark:border-white/5 last:border-0">
                  <span className="text-[11px] font-bold text-text-secondary dark:text-white/50 w-4">{row.position}</span>
                  <span className="text-[11px] font-black text-text-primary dark:text-white flex-1 truncate">{row.name}</span>
                  <span className="text-[11px] font-bold text-text-primary dark:text-white">{row.points}</span>
                </div>
              ))}

              <Link to="/standings" className="block text-center text-[11px] font-bold uppercase tracking-wider text-primary hover:underline mt-3">
                Full Standings
              </Link>
            </SidebarSection>
          )}
        </aside>
      </div>
    </div>
  )
}
