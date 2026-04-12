import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, HelpCircle } from 'lucide-react'
import SEO from '../components/SEO'
import RacingLoader from '../components/RacingLoader'
import { useQuizzes } from '../hooks/useQuizzes'
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../lib/types'
import type { Quiz } from '../lib/types'

export default function QuizzesPage() {
  const { fetchQuizzes, loading } = useQuizzes()
  const [list, setList] = useState<Quiz[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const data = await fetchQuizzes({ status: 'published' })
      if (!cancelled) setList(data)
    })()
    return () => {
      cancelled = true
    }
  }, [fetchQuizzes])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <SEO
        title="Motorsport Quizzes"
        description="Test your motorsport knowledge with interactive quizzes on Formula 1, Formula E, and more."
      />

      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <HelpCircle className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-primary dark:text-white tracking-tight">
              Quizzes
            </h1>
            <p className="text-text-secondary dark:text-white/60 text-sm mt-0.5">
              Pick a quiz and prove you belong on the front row.
            </p>
          </div>
        </div>
        <div className="h-1 w-20 bg-primary rounded-full" />
      </div>

      {loading ? (
        <RacingLoader message="Loading quizzes..." />
      ) : list.length === 0 ? (
        <p className="text-center text-text-secondary dark:text-white/50 py-16">
          No quizzes published yet. Check back soon.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.map((quiz) => (
            <article
              key={quiz.id}
              className="group bg-surface-card dark:bg-white/5 rounded-2xl border border-gray-200/80 dark:border-white/10 overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 flex flex-col"
            >
              <Link to={`/quiz/${quiz.slug}`} className="block relative aspect-[16/10] overflow-hidden bg-gray-100 dark:bg-white/10">
                <img
                  src={quiz.featuredImage}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <span
                    className={`inline-block text-[10px] uppercase tracking-wider font-bold text-white px-2.5 py-1 rounded-full shadow-sm ${CATEGORY_COLORS[quiz.category]}`}
                  >
                    {CATEGORY_LABELS[quiz.category]}
                  </span>
                </div>
              </Link>
              <div className="p-5 flex flex-col flex-1">
                <h2 className="text-lg font-bold text-text-primary dark:text-white leading-snug mb-2 line-clamp-2">
                  {quiz.title}
                </h2>
                <p className="text-sm text-text-secondary dark:text-white/55 line-clamp-2 mb-4 flex-1">
                  {quiz.description}
                </p>
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-white/10">
                  <span className="text-xs font-medium text-text-secondary dark:text-white/45">
                    {quiz.questions.length} questions
                  </span>
                  <Link
                    to={`/quiz/${quiz.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
                  >
                    Start quiz
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
