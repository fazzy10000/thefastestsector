import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
  page: number
  total: number
  pageSize: number
  onChange: (page: number) => void
  /** admin = gray/light classes (dark-mode remapped); public = site dark: variants */
  variant?: 'admin' | 'public'
  className?: string
}

export function totalPages(total: number, pageSize: number) {
  if (pageSize <= 0) return 1
  return Math.max(1, Math.ceil(total / pageSize))
}

export default function Pagination({
  page,
  total,
  pageSize,
  onChange,
  variant = 'public',
  className = '',
}: Props) {
  const pages = totalPages(total, pageSize)
  if (total <= pageSize || pages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const isAdmin = variant === 'admin'

  const btn =
    isAdmin
      ? 'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none'
      : 'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-white/15 bg-white dark:bg-white/5 text-text-primary dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none'

  const muted = isAdmin
    ? 'text-sm text-gray-500'
    : 'text-sm text-text-secondary dark:text-white/50'

  return (
    <nav
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 ${className}`}
      aria-label="Pagination"
    >
      <p className={muted}>
        Showing <span className={isAdmin ? 'font-semibold text-gray-900' : 'font-semibold text-text-primary dark:text-white'}>{from}–{to}</span>
        {' '}of{' '}
        <span className={isAdmin ? 'font-semibold text-gray-900' : 'font-semibold text-text-primary dark:text-white'}>{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <button type="button" className={btn} disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <ChevronLeft className="w-4 h-4" />
          Prev
        </button>
        <span className={muted}>
          Page {page} / {pages}
        </span>
        <button type="button" className={btn} disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </nav>
  )
}
