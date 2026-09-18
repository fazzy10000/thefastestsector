import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow, format } from 'date-fns'
import { useArticles } from '../../hooks/useArticles'
import { useAuth } from '../../hooks/useAuth'
import { CATEGORY_LABELS } from '../../lib/types'
import type { Article } from '../../lib/types'
import Pagination from '../../components/Pagination'
import {
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  FileText,
  CheckCircle,
  Clock,
  CalendarClock,
  ClipboardCheck,
} from 'lucide-react'

const PAGE_SIZE = 20

type ArticleFilter = 'all' | 'published' | 'draft' | 'ready_for_review' | 'scheduled'

const FILTER_TABS: { id: ArticleFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'published', label: 'Published' },
  { id: 'ready_for_review', label: 'Ready for review' },
  { id: 'draft', label: 'Drafts' },
  { id: 'scheduled', label: 'Scheduled' },
]

function statusBadgeClass(status: Article['status']) {
  switch (status) {
    case 'published':
      return 'bg-green-50 text-green-700'
    case 'ready_for_review':
      return 'bg-blue-50 text-blue-700'
    case 'scheduled':
      return 'bg-amber-50 text-amber-700'
    default:
      return 'bg-yellow-50 text-yellow-700'
  }
}

function statusLabel(status: Article['status']) {
  if (status === 'ready_for_review') return 'Ready for review'
  return status
}

export default function Dashboard() {
  const { fetchArticles, removeArticle, updateArticle, meta } = useArticles()
  const { can } = useAuth()
  const canPublish = can('publish_article')
  const canDelete = can('edit_any_article')
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<ArticleFilter>('all')
  const [page, setPage] = useState(1)

  const loadArticles = useCallback(async () => {
    setLoading(true)
    const opts =
      filter === 'all'
        ? { page, limit: PAGE_SIZE }
        : { status: filter, page, limit: PAGE_SIZE }
    const data = await fetchArticles(opts)
    setArticles(data)
    setLoading(false)
  }, [fetchArticles, filter, page])

  useEffect(() => {
    void loadArticles()
  }, [loadArticles])

  useEffect(() => {
    setPage(1)
  }, [filter])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return
    await removeArticle(id)
    void loadArticles()
  }

  const toggleStatus = async (article: Article) => {
    if (article.status === 'ready_for_review' || article.status === 'scheduled') return
    const newStatus = article.status === 'published' ? 'draft' : 'published'
    await updateArticle(article.id, {
      status: newStatus,
      publishedAt: newStatus === 'published' ? Date.now() : null,
      scheduledAt: null,
      updatedAt: Date.now(),
    })
    void loadArticles()
  }

  const published = meta.counts?.published ?? 0
  const drafts = meta.counts?.draft ?? 0
  const readyForReview = meta.counts?.ready_for_review ?? 0
  const scheduled = meta.counts?.scheduled ?? 0
  const totalAll = meta.counts?.all ?? meta.total
  const listTotal = meta.total

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div data-tour="dashboard-header">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your articles and content</p>
        </div>
        <Link
          to="/admin/new"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
        >
          <PlusCircle className="w-4 h-4" />
          New Article
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalAll}</p>
              <p className="text-xs text-gray-500">Total Articles</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{published}</p>
              <p className="text-xs text-gray-500">Published</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-50 rounded-lg">
              <ClipboardCheck className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{readyForReview}</p>
              <p className="text-xs text-gray-500">Ready for review</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-yellow-50 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{drafts}</p>
              <p className="text-xs text-gray-500">Drafts</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 rounded-lg">
              <CalendarClock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{scheduled}</p>
              <p className="text-xs text-gray-500">Scheduled</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-6 bg-white rounded-lg p-1 shadow-sm w-fit max-w-full overflow-x-auto">
        {FILTER_TABS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              filter === f.id
                ? 'bg-primary text-white'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {f.label}
            {f.id === 'ready_for_review' && readyForReview > 0 ? (
              <span className="ml-1.5 inline-flex min-w-[1.25rem] justify-center rounded-full bg-white/20 px-1.5 text-[11px]">
                {readyForReview}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Article list */}
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto" data-tour="dashboard-list">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading articles...</div>
        ) : articles.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            {filter === 'ready_for_review'
              ? 'No articles waiting for review.'
              : 'No articles found. Create your first article!'}
          </div>
        ) : (
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {article.featuredImage && (
                        <img
                          src={article.featuredImage}
                          alt=""
                          className="w-12 h-8 object-cover rounded"
                        />
                      )}
                      <div>
                        <p className="font-medium text-gray-900 text-sm line-clamp-1">{article.title}</p>
                        <p className="text-xs text-gray-400">
                          {article.author}
                          {article.reviewedBy ? (
                            <span className="text-emerald-600">
                              {' '}
                              · Reviewed by {article.reviewedBy}
                            </span>
                          ) : null}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs text-gray-600">{CATEGORY_LABELS[article.category]}</span>
                  </td>
                  <td className="px-5 py-4">
                    {article.status === 'scheduled' ? (
                      <div className="inline-flex flex-col">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                          <CalendarClock className="w-3 h-3" />
                          scheduled
                        </span>
                        {article.scheduledAt && (
                          <span className="text-[10px] text-amber-600 mt-0.5">
                            {format(new Date(article.scheduledAt), 'MMM d, h:mm a')}
                          </span>
                        )}
                      </div>
                    ) : article.status === 'ready_for_review' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        <ClipboardCheck className="w-3 h-3" />
                        Ready for review
                      </span>
                    ) : canPublish ? (
                      <button
                        onClick={() => toggleStatus(article)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusBadgeClass(article.status)}`}
                      >
                        {article.status === 'published' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {statusLabel(article.status)}
                      </button>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusBadgeClass(article.status)}`}
                      >
                        {article.status === 'published' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {statusLabel(article.status)}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-400">
                    {article.createdAt && !isNaN(article.createdAt) ? formatDistanceToNow(new Date(article.createdAt), { addSuffix: true }) : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/article/${article.slug}`}
                        className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        to={`/admin/edit/${article.id}`}
                        className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(article.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination
        variant="admin"
        className="mt-4"
        page={page}
        total={listTotal}
        pageSize={PAGE_SIZE}
        onChange={setPage}
      />
    </div>
  )
}
