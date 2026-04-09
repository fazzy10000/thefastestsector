import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { ArrowLeft, Clock, User } from 'lucide-react'
import { useArticles } from '../hooks/useArticles'
import { SAMPLE_ARTICLES } from '../lib/sampleData'
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../lib/types'
import type { Article } from '../lib/types'

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  const { getArticleBySlug } = useArticles()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!slug) return
      const found = await getArticleBySlug(slug)
      if (found) {
        setArticle(found)
      } else {
        const sample = SAMPLE_ARTICLES.find((a) => a.slug === slug)
        if (sample) setArticle(sample)
      }
      setLoading(false)
    }
    load()
  }, [slug, getArticleBySlug])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto" />
          <div className="h-64 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
        </div>
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

  const timeAgo = article.publishedAt
    ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })
    : formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })

  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/" className="inline-flex items-center gap-1 text-text-secondary hover:text-primary mb-6 text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <div className="flex items-center gap-2 mb-4">
        <span className={`${CATEGORY_COLORS[article.category]} text-white text-xs font-semibold px-2.5 py-1 rounded`}>
          {CATEGORY_LABELS[article.category]}
        </span>
      </div>

      <h1 className="text-3xl md:text-4xl font-bold text-text-primary dark:text-white leading-tight mb-4">
        {article.title}
      </h1>

      <div className="flex items-center gap-4 text-text-secondary text-sm mb-8">
        <span className="flex items-center gap-1.5">
          <User className="w-4 h-4" />
          {article.author}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          {timeAgo}
        </span>
      </div>

      {article.featuredImage && (
        <div className="rounded-xl overflow-hidden mb-8">
          <img
            src={article.featuredImage}
            alt={article.title}
            className="w-full h-auto object-cover max-h-[500px]"
          />
        </div>
      )}

      <div
        className="article-content text-text-primary dark:text-white/90 text-lg leading-relaxed"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

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
    </article>
  )
}
