import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import ArticleCard from '../components/ArticleCard'
import { useArticles } from '../hooks/useArticles'
import { SAMPLE_ARTICLES } from '../lib/sampleData'
import { CATEGORY_LABELS } from '../lib/types'
import type { Article, Category } from '../lib/types'

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>()
  const { fetchArticles, loading } = useArticles()
  const [articles, setArticles] = useState<Article[]>([])

  useEffect(() => {
    async function load() {
      if (!category) return
      const cat = category as Category
      const results = await fetchArticles({ category: cat, status: 'published' })
      if (results.length === 0) {
        const filtered = SAMPLE_ARTICLES.filter((a) => a.category === cat && a.status === 'published')
        setArticles(filtered)
      } else {
        setArticles(results)
      }
    }
    load()
  }, [category, fetchArticles])

  const label = category ? CATEGORY_LABELS[category as Category] || category : ''

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary dark:text-white">{label}</h1>
        <div className="h-1 w-16 bg-primary mt-2 rounded-full" />
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[16/10] bg-gray-200 rounded-xl mb-4" />
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <p className="text-text-secondary text-center py-16">No articles found in this category yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  )
}
