import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { PlusCircle, Pencil, Trash2, Trophy, Eye, FileEdit } from 'lucide-react'
import { useQuizzes } from '../../hooks/useQuizzes'
import { CATEGORY_LABELS } from '../../lib/types'
import type { Quiz } from '../../lib/types'

function nowMs() {
  return Date.now()
}

export default function QuizList() {
  const { fetchQuizzes, removeQuiz, updateQuiz } = useQuizzes()
  const [list, setList] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const data = await fetchQuizzes()
    setList(data)
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const data = await fetchQuizzes()
      if (cancelled) return
      setList(data)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [fetchQuizzes])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this quiz permanently?')) return
    await removeQuiz(id)
    load()
  }

  const toggleStatus = async (quiz: Quiz) => {
    const next = quiz.status === 'published' ? 'draft' : 'published'
    await updateQuiz(quiz.id, { status: next, updatedAt: nowMs() })
    load()
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quizzes</h1>
          <p className="text-gray-500 text-sm mt-1">Create and manage interactive quizzes</p>
        </div>
        <Link
          to="/admin/quiz/new"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
        >
          <PlusCircle className="w-4 h-4" />
          New quiz
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No quizzes yet.</p>
          <Link
            to="/admin/quiz/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark"
          >
            <PlusCircle className="w-4 h-4" />
            Create your first quiz
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Title</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 hidden md:table-cell">
                    Category
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 hidden sm:table-cell">
                    Questions
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 hidden lg:table-cell">
                    Updated
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((quiz) => (
                  <tr key={quiz.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900 max-w-[200px] sm:max-w-xs truncate">
                        {quiz.title}
                      </div>
                      <div className="text-xs text-gray-400 truncate">{quiz.slug}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 hidden md:table-cell">
                      {CATEGORY_LABELS[quiz.category]}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => toggleStatus(quiz)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          quiz.status === 'published'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {quiz.status === 'published' ? (
                          <>
                            <Eye className="w-3 h-3" /> Published
                          </>
                        ) : (
                          <>
                            <FileEdit className="w-3 h-3" /> Draft
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-gray-600 hidden sm:table-cell">
                      {quiz.questions?.length ?? 0}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs hidden lg:table-cell whitespace-nowrap">
                      {formatDistanceToNow(quiz.updatedAt, { addSuffix: true })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/admin/quiz/edit/${quiz.id}`}
                          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-primary"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(quiz.id)}
                          className="p-2 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600"
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
          </div>
        </div>
      )}
    </div>
  )
}
