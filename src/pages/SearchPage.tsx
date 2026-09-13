import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import ArticleCard from '../components/ArticleCard'
import Pagination from '../components/Pagination'
import { useArticles } from '../hooks/useArticles'
import { Search } from 'lucide-react'
import SEO from '../components/SEO'

const PAGE_SIZE = 12

export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') || ''
  const page = Math.max(1, Number(params.get('page') || '1') || 1)
  const { articles, meta, loading, fetchArticles } = useArticles()

  useEffect(() => {
    if (!query) return
    void fetchArticles({ status: 'published', q: query, page, limit: PAGE_SIZE })
  }, [fetchArticles, query, page])

  const setPage = (p: number) => {
    const next = new URLSearchParams(params)
    if (p <= 1) next.delete('page')
    else next.set('page', String(p))
    setParams(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
        {query && !loading && (
          <p className="text-sm text-text-secondary dark:text-white/50 mt-3">
            {meta.total} result{meta.total === 1 ? '' : 's'}
          </p>
        )}
      </div>

      {!query ? (
        <p className="text-text-secondary text-center py-16">Enter a search term to find articles.</p>
      ) : loading ? (
        <p className="text-text-secondary text-center py-16">Searching…</p>
      ) : articles.length === 0 ? (
        <p className="text-text-secondary text-center py-16">No articles found matching "{query}".</p>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
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
  )
}
