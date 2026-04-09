import type { Category } from '../lib/types'
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../lib/types'

interface CategoryBadgeProps {
  category: Category
  size?: 'sm' | 'md'
}

export default function CategoryBadge({ category, size = 'md' }: CategoryBadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
  return (
    <span className={`${CATEGORY_COLORS[category]} text-white font-semibold rounded ${sizeClasses}`}>
      {CATEGORY_LABELS[category]}
    </span>
  )
}
