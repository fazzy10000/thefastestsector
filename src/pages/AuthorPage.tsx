import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import SEO from '../components/SEO'
import ArticleCard from '../components/ArticleCard'
import Pagination from '../components/Pagination'
import RacingLoader from '../components/RacingLoader'
import { useAuthors } from '../hooks/useAuthors'
import { useArticles } from '../hooks/useArticles'
import type { Author } from '../lib/types'
import { displayAuthorName } from '../lib/formatAuthor'

const PAGE_SIZE = 12

export default function AuthorPage() {
  const { authorId } = useParams<{ authorId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get('page') || '1') || 1)
  const { getAuthor, loading: authorsLoading } = useAuthors()
  const { articles, meta, fetchArticles } = useArticles()
  const [author, setAuthor] = useState<Author | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!authorId || authorsLoading) return
      setLoading(true)
      const found = getAuthor(authorId)
      await fetchArticles({ status: 'published', authorId, page, limit: PAGE_SIZE })
      if (cancelled) return
      setAuthor(found)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [authorId, getAuthor, fetchArticles, authorsLoading, page])

  const setPage = (p: number) => {
    const next = new URLSearchParams(searchParams)
    if (p <= 1) next.delete('page')
    else next.set('page', String(p))
    setSearchParams(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16">
        <RacingLoader message="Loading author..." />
      </div>
    )
  }

  if (!author && articles.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <SEO title="Author not found" />
        <h1 className="text-2xl font-bold text-text-primary dark:text-white mb-2">Author not found</h1>
        <Link to="/" className="text-primary hover:underline text-sm font-semibold">
          Back to home
        </Link>
      </div>
    )
  }

  const name = displayAuthorName(author?.name || 'Author')

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <SEO
        title={name}
        description={author?.bio || `Articles by ${name} on The Fastest Sector.`}
      />

      <div className="flex flex-col sm:flex-row gap-5 items-start mb-10 pb-8 border-b border-gray-200 dark:border-white/10">
        {author?.avatar ? (
          <img
            src={author.avatar}
            alt={name}
            className="w-24 h-24 rounded-full object-cover ring-2 ring-primary/20"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold">
            {name.charAt(0)}
          </div>
        )}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">Author</p>
          <h1 className="text-3xl font-black text-text-primary dark:text-white mb-2">{name}</h1>
          {author?.bio && (
            <p className="text-text-secondary dark:text-white/65 max-w-2xl leading-relaxed">{author.bio}</p>
          )}
        </div>
      </div>

      <h2 className="text-xs font-black uppercase tracking-wider text-text-secondary dark:text-white/50 mb-4">
        Articles ({meta.total})
      </h2>

      {articles.length === 0 ? (
        <p className="text-text-secondary dark:text-white/50">No published articles yet.</p>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
