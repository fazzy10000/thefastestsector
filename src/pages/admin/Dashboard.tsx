import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { useArticles } from '../../hooks/useArticles'
import { CATEGORY_LABELS } from '../../lib/types'
import type { Article } from '../../lib/types'
import {
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  FileText,
  CheckCircle,
  Clock,
} from 'lucide-react'

export default function Dashboard() {
  const { fetchArticles, removeArticle, updateArticle } = useArticles()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')

  const loadArticles = async () => {
    setLoading(true)
    const opts = filter === 'all' ? {} : { status: filter as 'published' | 'draft' }
    const data = await fetchArticles(opts)
    setArticles(data)
    setLoading(false)
  }

  useEffect(() => {
    loadArticles()
  }, [filter])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return
    await removeArticle(id)
    loadArticles()
  }

  const toggleStatus = async (article: Article) => {
    const newStatus = article.status === 'published' ? 'draft' : 'published'
    await updateArticle(article.id, {
      status: newStatus,
      publishedAt: newStatus === 'published' ? Date.now() : null,
      updatedAt: Date.now(),
    })
    loadArticles()
  }

  const published = articles.filter((a) => a.status === 'published').length
  const drafts = articles.filter((a) => a.status === 'draft').length

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your articles and content</p>
        </div>
        <Link
          to="/admin/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
        >
          <PlusCircle className="w-4 h-4" />
          New Article
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{articles.length}</p>
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
            <div className="p-2.5 bg-yellow-50 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{drafts}</p>
              <p className="text-xs text-gray-500">Drafts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-6 bg-white rounded-lg p-1 shadow-sm w-fit">
        {(['all', 'published', 'draft'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
              filter === f
                ? 'bg-primary text-white'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Article list */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading articles...</div>
        ) : articles.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No articles found. Create your first article!
          </div>
        ) : (
          <table className="w-full">
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
                        <p className="text-xs text-gray-400">{article.author}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs text-gray-600">{CATEGORY_LABELS[article.category]}</span>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => toggleStatus(article)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        article.status === 'published'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-yellow-50 text-yellow-700'
                      }`}
                    >
                      {article.status === 'published' ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      {article.status}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-400">
                    {formatDistanceToNow(new Date(article.createdAt), { addSuffix: true })}
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
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
