import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import ArticleCard from '../components/ArticleCard'
import { useArticles } from '../hooks/useArticles'
import type { Article } from '../lib/types'
import { Search } from 'lucide-react'
import SEO from '../components/SEO'

export default function SearchPage() {
  const [params] = useSearchParams()
  const query = params.get('q') || ''
  const { articles } = useArticles()
  const [results, setResults] = useState<Article[]>([])

  useEffect(() => {
    if (!query) {
      setResults([])
      return
    }
    const q = query.toLowerCase()
    const filtered = articles.filter(
      (a) =>
        a.status === 'published' &&
        (a.title.toLowerCase().includes(q) ||
          a.excerpt.toLowerCase().includes(q) ||
          a.author.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q)))
    )
    setResults(filtered)
  }, [query, articles])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <SEO title={query ? `Search: ${query}` : 'Search'} description={`Search results for "${query}" on The Fastest Sector.`} />
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Search className="w-6 h-6 text-text-secondary" />
          <h1 className="text-3xl font-bold text-text-primary dark:text-white">
            {query ? `Results for "${query}"` : 'Search'}
          </h1>
        </div>
        <div className="h-1 w-16 bg-primary mt-2 rounded-full" />
      </div>

      {!query ? (
        <p className="text-text-secondary text-center py-16">Enter a search term to find articles.</p>
      ) : results.length === 0 ? (
        <p className="text-text-secondary text-center py-16">No articles found matching "{query}".</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {results.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  )
}
