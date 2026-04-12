import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { useArticles } from '../hooks/useArticles'
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../lib/types'
import type { Article } from '../lib/types'
import { Clock, ArrowRight } from 'lucide-react'

interface Props {
  current: Article
}

function safeTimeAgo(ts: number | null | undefined): string {
  if (!ts || isNaN(ts)) return ''
  try {
    return formatDistanceToNow(new Date(ts), { addSuffix: true })
  } catch {
    return ''
  }
}

function scoreRelevance(candidate: Article, current: Article): number {
  let score = 0
  if (candidate.category === current.category) score += 10
  if (candidate.authorId && candidate.authorId === current.authorId) score += 3
  if (candidate.contentType === current.contentType) score += 2
  const sharedTags = candidate.tags.filter((t) => current.tags.includes(t))
  score += sharedTags.length * 4
  return score
}

export default function ReadNext({ current }: Props) {
  const { articles } = useArticles()
  const [recommendations, setRecommendations] = useState<Article[]>([])

  useEffect(() => {
    const published = articles.filter(
      (a) => a.status === 'published' && a.id !== current.id,
    )
    const scored = published.map((a) => ({ article: a, score: scoreRelevance(a, current) }))
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return (b.article.publishedAt ?? b.article.createdAt) -
        (a.article.publishedAt ?? a.article.createdAt)
    })
    setRecommendations(scored.slice(0, 3).map((s) => s.article))
  }, [articles, current])

  if (recommendations.length === 0) return null

  return (
    <div className="mt-12 pt-8 border-t border-gray-200 dark:border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-text-primary dark:text-white">
          Read Next
        </h3>
        <Link
          to={`/category/${current.category}`}
          className="text-primary text-sm font-medium flex items-center gap-1 hover:underline"
        >
          More in {CATEGORY_LABELS[current.category]}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {recommendations.map((article) => (
          <Link
            key={article.id}
            to={`/article/${article.slug}`}
            className="group block rounded-xl overflow-hidden bg-surface-card dark:bg-white/5 shadow-sm hover:shadow-md transition-shadow"
          >
            {article.featuredImage && (
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={article.featuredImage}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            )}
            <div className="p-4">
              <span className={`${CATEGORY_COLORS[article.category]} text-white text-[10px] font-semibold px-2 py-0.5 rounded inline-block mb-2`}>
                {CATEGORY_LABELS[article.category]}
              </span>
              <h4 className="text-text-primary dark:text-white font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-2">
                {article.title}
              </h4>
              <span className="text-text-secondary dark:text-white/50 text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {safeTimeAgo(article.publishedAt ?? article.createdAt)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
