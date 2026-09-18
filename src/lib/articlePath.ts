import type { Category } from './types'
import { CATEGORY_LABELS } from './types'

/** Public article path: /{category}/{slug} e.g. /indycar/2026-indycar-season-review */
export function articlePath(article: { category: string; slug: string }): string {
  const category = (article.category || 'other').trim() || 'other'
  const slug = (article.slug || '').trim()
  if (!slug) return '/'
  return `/${category}/${slug}`
}

export function isArticleCategory(value: string | undefined | null): value is Category {
  if (!value) return false
  return Object.prototype.hasOwnProperty.call(CATEGORY_LABELS, value)
}
