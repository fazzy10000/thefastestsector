import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import ArticleCard from '../components/ArticleCard'
import { useArticles } from '../hooks/useArticles'
import SEO from '../components/SEO'
import { CATEGORY_LABELS, CONTENT_TYPE_LABELS } from '../lib/types'
import type { Article, Category, ContentType } from '../lib/types'

const TABS: ContentType[] = ['news', 'results', 'opinion']

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>()
  const { fetchArticles, loading } = useArticles()
  const [articles, setArticles] = useState<Article[]>([])
  const [activeTab, setActiveTab] = useState<ContentType>('news')

  useEffect(() => {
    async function load() {
      if (!category) return
      const results = await fetchArticles({ category: category as Category, status: 'published' })
      setArticles(results)
    }
    load()
  }, [category, fetchArticles])

  const label = category ? CATEGORY_LABELS[category as Category] || category : ''

  const filtered = articles.filter((a) => (a.contentType || 'news') === activeTab)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <SEO title={label} description={`Latest ${label} news, results and opinions from The Fastest Sector.`} />
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary dark:text-white">{label}</h1>
        <div className="h-1 w-16 bg-primary mt-2 rounded-full" />
      </div>

      {/* Content type tabs */}
      <div className="flex gap-1 mb-8 bg-gray-100 dark:bg-white/5 p-1 rounded-lg w-fit">
        {TABS.map((tab) => {
          const count = articles.filter((a) => (a.contentType || 'news') === tab).length
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary dark:text-white/50 hover:text-text-primary dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10'
              }`}
            >
              {CONTENT_TYPE_LABELS[tab]}
              {count > 0 && (
                <span className={`ml-1.5 text-xs ${isActive ? 'text-white/70' : 'text-text-secondary/60 dark:text-white/30'}`}>
                  ({count})
                </span>
              )}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[16/10] bg-gray-200 dark:bg-white/10 rounded-xl mb-4" />
              <div className="h-5 bg-gray-200 dark:bg-white/10 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-text-secondary dark:text-white/50 text-center py-16">
          No {CONTENT_TYPE_LABELS[activeTab].toLowerCase()} articles found in {label} yet.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filtered.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  )
}
