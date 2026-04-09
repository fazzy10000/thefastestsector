import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ArticleCard from '../components/ArticleCard'
import type { Article } from '../lib/types'
import { useArticles } from '../hooks/useArticles'
import { SAMPLE_ARTICLES } from '../lib/sampleData'

export default function Home() {
  const { articles: firebaseArticles, loading } = useArticles()
  const [articles, setArticles] = useState<Article[]>(SAMPLE_ARTICLES)
  const carouselRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!loading && firebaseArticles.length > 0) {
      setArticles(firebaseArticles)
    }
  }, [firebaseArticles, loading])

  const featured = articles.filter((a) => a.featured)
  const latest = articles.filter((a) => a.status === 'published').slice(0, 8)
  const older = articles.filter((a) => a.status === 'published').slice(4)

  const scrollCarousel = (dir: 'left' | 'right') => {
    if (!carouselRef.current) return
    const amount = 320
    carouselRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  return (
    <div>
      {/* Hero section */}
      <section className="max-w-7xl mx-auto px-4 pt-6 pb-8">
        {featured.length > 0 && (
          <div className="grid md:grid-cols-5 gap-4">
            <div className="md:col-span-3">
              <ArticleCard article={featured[0]} variant="hero" />
            </div>
            <div className="md:col-span-2 flex flex-col gap-4">
              {latest.slice(0, 2).map((article) => (
                <ArticleCard key={article.id} article={article} variant="hero" />
              ))}
            </div>
          </div>
        )}
      </section>

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
                onClick={() => scrollCarousel('left')}
                className="p-2 rounded-full bg-white dark:bg-surface-dark shadow hover:shadow-md transition-shadow"
              >
                <ChevronLeft className="w-5 h-5 text-text-primary dark:text-white" />
              </button>
              <button
                onClick={() => scrollCarousel('right')}
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
