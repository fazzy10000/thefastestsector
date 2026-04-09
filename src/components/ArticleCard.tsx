import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import type { Article } from '../lib/types'
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../lib/types'
import { Clock, User } from 'lucide-react'

interface ArticleCardProps {
  article: Article
  variant?: 'default' | 'hero' | 'compact'
}

export default function ArticleCard({ article, variant = 'default' }: ArticleCardProps) {
  const timeAgo = article.publishedAt
    ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })
    : formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })

  if (variant === 'hero') {
    return (
      <Link to={`/article/${article.slug}`} className="group block relative rounded-xl overflow-hidden">
        <div className="aspect-[16/10] md:aspect-[16/9]">
          <img
            src={article.featuredImage || '/placeholder.jpg'}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className={`${CATEGORY_COLORS[article.category]} text-white text-xs font-semibold px-2.5 py-1 rounded`}>
              {CATEGORY_LABELS[article.category]}
            </span>
          </div>
          <h2 className="text-white text-2xl md:text-3xl font-bold leading-tight mb-2 group-hover:text-primary transition-colors">
            {article.title}
          </h2>
          <p className="text-white/70 text-sm line-clamp-2 mb-3 hidden md:block">{article.excerpt}</p>
          <div className="flex items-center gap-4 text-white/60 text-xs">
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
  }

  if (variant === 'compact') {
    return (
      <Link to={`/article/${article.slug}`} className="group block rounded-xl overflow-hidden bg-surface-card shadow-sm hover:shadow-md transition-shadow">
        <div className="aspect-[16/10] overflow-hidden">
          <img
            src={article.featuredImage || '/placeholder.jpg'}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={`${CATEGORY_COLORS[article.category]} text-white text-[10px] font-semibold px-2 py-0.5 rounded`}>
              {CATEGORY_LABELS[article.category]}
            </span>
          </div>
          <h3 className="text-text-primary dark:text-white font-bold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {article.title}
          </h3>
          <span className="text-text-secondary text-xs mt-2 block">{timeAgo}</span>
        </div>
      </Link>
    )
  }

  return (
    <Link to={`/article/${article.slug}`} className="group block rounded-xl overflow-hidden bg-surface-card shadow-sm hover:shadow-md transition-shadow">
      <div className="aspect-[16/10] overflow-hidden">
        <img
          src={article.featuredImage || '/placeholder.jpg'}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className={`${CATEGORY_COLORS[article.category]} text-white text-xs font-semibold px-2.5 py-1 rounded`}>
            {CATEGORY_LABELS[article.category]}
          </span>
        </div>
        <h3 className="text-text-primary dark:text-white font-bold text-lg leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {article.title}
        </h3>
        <p className="text-text-secondary text-sm line-clamp-2 mb-3">{article.excerpt}</p>
        <div className="flex items-center gap-4 text-text-secondary text-xs">
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
}
