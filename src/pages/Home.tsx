import { useRef, useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Clock, User } from 'lucide-react'
import ArticleCard from '../components/ArticleCard'
import SEO from '../components/SEO'
import RacingLoader from '../components/RacingLoader'
import { useArticles } from '../hooks/useArticles'
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../lib/types'
import { formatDistanceToNow } from 'date-fns'

function safeTimeAgo(ts: number | null | undefined): string {
  if (!ts || isNaN(ts)) return ''
  try {
    return formatDistanceToNow(new Date(ts), { addSuffix: true })
  } catch {
    return ''
  }
}

const AUTOPLAY_MS = 6000

export default function Home() {
  const { articles, loading } = useArticles()
  const carouselRef = useRef<HTMLDivElement>(null)

  const published = articles.filter((a) => a.status === 'published')
  const heroArticles = published.slice(0, 6)
  const latest = published.slice(0, 8)
  const older = published.slice(6)

  const [currentSlide, setCurrentSlide] = useState(0)
  const [paused, setPaused] = useState(false)
  const slideCount = heroArticles.length

  const goTo = useCallback(
    (idx: number) => setCurrentSlide(((idx % slideCount) + slideCount) % slideCount),
    [slideCount],
  )

  useEffect(() => {
    if (paused || slideCount < 2) return
    const timer = setInterval(() => goTo(currentSlide + 1), AUTOPLAY_MS)
    return () => clearInterval(timer)
  }, [currentSlide, paused, slideCount, goTo])

  const scrollMissed = (dir: 'left' | 'right') => {
    if (!carouselRef.current) return
    carouselRef.current.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' })
  }

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

      {/* Hero carousel */}
      {heroArticles.length > 0 && (
        <section
          className="relative max-w-7xl mx-auto px-4 pt-6 pb-8"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="relative rounded-2xl overflow-hidden aspect-[16/7] sm:aspect-[16/7] md:aspect-[21/9]">
            {heroArticles.map((article, i) => {
              const timeAgo = safeTimeAgo(article.publishedAt ?? article.createdAt)
              return (
                <Link
                  key={article.id}
                  to={`/article/${article.slug}`}
                  className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                    i === currentSlide
                      ? 'opacity-100 scale-100 z-10'
                      : 'opacity-0 scale-105 z-0'
                  }`}
                  aria-hidden={i !== currentSlide}
                  tabIndex={i === currentSlide ? 0 : -1}
                >
                  <img
                    src={article.featuredImage || '/placeholder.jpg'}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 md:p-10">
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`${CATEGORY_COLORS[article.category]} text-white text-xs font-semibold px-2.5 py-1 rounded`}
                      >
                        {CATEGORY_LABELS[article.category]}
                      </span>
                      {i === 0 && (
                        <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded">
                          Featured
                        </span>
                      )}
                    </div>
                    <h2 className="text-white text-xl sm:text-2xl md:text-4xl font-black leading-tight mb-2 md:mb-3 max-w-3xl">
                      {article.title}
                    </h2>
                    <p className="text-white/70 text-sm md:text-base line-clamp-2 mb-3 max-w-2xl hidden sm:block">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-white/60 text-xs md:text-sm">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {article.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {timeAgo}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}

            {/* Arrows */}
            {slideCount > 1 && (
              <>
                <button
                  onClick={(e) => { e.preventDefault(); goTo(currentSlide - 1) }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-colors"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); goTo(currentSlide + 1) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-colors"
                  aria-label="Next slide"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Dots */}
            {slideCount > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                {heroArticles.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.preventDefault(); goTo(i) }}
                    className={`rounded-full transition-all duration-300 ${
                      i === currentSlide
                        ? 'w-8 h-2 bg-primary'
                        : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                    }`}
                    aria-label={`Go to slide ${i + 1}`}
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
          </div>
        </section>
      )}

      {/* Latest section */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-text-primary dark:text-white">Latest</h2>
          <div className="h-1 w-16 bg-primary mt-2 rounded-full" />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {latest.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </section>

      {/* You May Have Missed carousel */}
      {older.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8 pb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-text-primary dark:text-white">You May Have Missed</h2>
              <div className="h-1 w-16 bg-primary mt-2 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => scrollMissed('left')}
                className="p-2 rounded-full bg-white dark:bg-surface-dark shadow hover:shadow-md transition-shadow"
              >
                <ChevronLeft className="w-5 h-5 text-text-primary dark:text-white" />
              </button>
              <button
                onClick={() => scrollMissed('right')}
                className="p-2 rounded-full bg-white dark:bg-surface-dark shadow hover:shadow-md transition-shadow"
              >
                <ChevronRight className="w-5 h-5 text-text-primary dark:text-white" />
              </button>
            </div>
          </div>
          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {older.map((article) => (
              <div key={article.id} className="flex-shrink-0 w-72">
                <ArticleCard article={article} variant="compact" />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
