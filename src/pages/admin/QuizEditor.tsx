import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  Send,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
} from 'lucide-react'
import { useQuizzes } from '../../hooks/useQuizzes'
import { CATEGORY_LABELS } from '../../lib/types'
import type { Category, Quiz, QuizQuestion } from '../../lib/types'

const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[]

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function emptyQuestion(): QuizQuestion {
  return {
    id: crypto.randomUUID(),
    question: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    explanation: '',
  }
}

export default function QuizEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getQuiz, createQuiz, updateQuiz } = useQuizzes()
  const isNew = !id

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('formula-1')
  const [featuredImage, setFeaturedImage] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [questions, setQuestions] = useState<QuizQuestion[]>([emptyQuestion()])
  const [createdAt, setCreatedAt] = useState(() => Date.now())
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!isNew)

  useEffect(() => {
    if (!id) return
    getQuiz(id).then((q) => {
      if (q) {
        setTitle(q.title)
        setSlug(q.slug)
        setDescription(q.description)
        setCategory(q.category)
        setFeaturedImage(q.featuredImage)
        setStatus(q.status)
        setCreatedAt(q.createdAt)
        setQuestions(q.questions.length ? q.questions : [emptyQuestion()])
      }
      setLoading(false)
    })
  }, [id, getQuiz])

  useEffect(() => {
    if (isNew && title) {
      setSlug(slugify(title))
    }
  }, [title, isNew])

  const updateQuestion = (index: number, patch: Partial<QuizQuestion>) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    )
  }

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q
        const next = [...q.options]
        next[optIndex] = value
        return { ...q, options: next }
      }),
    )
  }

  const addQuestion = () => {
    setQuestions((prev) => [...prev, emptyQuestion()])
  }

  const removeQuestion = (index: number) => {
    setQuestions((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  const moveQuestion = (index: number, dir: -1 | 1) => {
    setQuestions((prev) => {
      const next = [...prev]
      const j = index + dir
      if (j < 0 || j >= next.length) return prev
      ;[next[index], next[j]] = [next[j]!, next[index]!]
      return next
    })
  }

  const validate = (): string | null => {
    if (!title.trim()) return 'Title is required.'
    if (!slug.trim()) return 'Slug is required.'
    if (!questions.length) return 'Add at least one question.'
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]!
      if (!q.question.trim()) return `Question ${i + 1}: text is required.`
      if (q.options.some((o) => !o.trim())) return `Question ${i + 1}: all four options are required.`
      if (q.correctIndex < 0 || q.correctIndex > 3) return `Question ${i + 1}: pick a correct answer.`
      if (!q.explanation.trim()) return `Question ${i + 1}: add a short explanation.`
    }
    return null
  }

  async function persist(nextStatus: 'draft' | 'published') {
    const err = validate()
    if (err) {
      alert(err)
      return
    }
    setSaving(true)
    const now = Date.now()
    const payload: Omit<Quiz, 'id'> = {
      title: title.trim(),
      slug: slugify(slug),
      description: description.trim(),
      category,
      featuredImage: featuredImage.trim(),
      questions: questions.map((q) => ({
        ...q,
        question: q.question.trim(),
        options: q.options.map((o) => o.trim()),
        explanation: q.explanation.trim(),
      })),
      status: nextStatus,
      createdAt: isNew ? now : createdAt,
      updatedAt: now,
    }

    try {
      if (isNew) {
        const newId = await createQuiz(payload)
        setStatus(nextStatus)
        setCreatedAt(now)
        navigate(`/admin/quiz/edit/${newId}`, { replace: true })
      } else if (id) {
        await updateQuiz(id, payload)
        setStatus(nextStatus)
        setCreatedAt(payload.createdAt)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-gray-500 text-sm">Loading quiz…</p>
  }

  return (
    <div className="max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/quizzes"
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isNew ? 'New quiz' : 'Edit quiz'}</h1>
            <p className="text-gray-500 text-sm mt-0.5">Build questions and publish when ready.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => void persist('draft')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-800 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save as draft
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void persist('published')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            Publish
          </button>
        </div>
      </div>

      <div className="space-y-8">
        <section className="bg-white rounded-xl border border-gray-200 p-5 md:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Details</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                placeholder="e.g. How Well Do You Know F1 2026?"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 font-mono text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                placeholder="url-friendly-slug"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-y"
                placeholder="Short intro shown on the quiz card and header."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none bg-white"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Featured image URL</label>
              <input
                type="url"
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                placeholder="https://…"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Questions</h2>
            <button
              type="button"
              onClick={addQuestion}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark"
            >
              <Plus className="w-4 h-4" />
              Add question
            </button>
          </div>

          {questions.map((q, qi) => (
            <div
              key={q.id}
              className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 space-y-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-gray-500">
                  <GripVertical className="w-4 h-4 hidden sm:block opacity-40" />
                  <span className="text-sm font-semibold text-gray-800">Question {qi + 1}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveQuestion(qi, -1)}
                    disabled={qi === 0}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30"
                    title="Move up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveQuestion(qi, 1)}
                    disabled={qi === questions.length - 1}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30"
                    title="Move down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeQuestion(qi)}
                    disabled={questions.length <= 1}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-30"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Question</label>
                <textarea
                  value={q.question}
                  onChange={(e) => updateQuestion(qi, { question: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {q.options.map((opt, oi) => (
                  <div key={oi}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Option {oi + 1}
                    </label>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => updateOption(qi, oi, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                    />
                  </div>
                ))}
              </div>

              <fieldset>
                <legend className="text-xs font-medium text-gray-600 mb-2">Correct answer</legend>
                <div className="flex flex-wrap gap-3">
                  {[0, 1, 2, 3].map((ci) => (
                    <label key={ci} className="inline-flex items-center gap-2 text-sm text-gray-800 cursor-pointer">
                      <input
                        type="radio"
                        name={`correct-${q.id}`}
                        checked={q.correctIndex === ci}
                        onChange={() => updateQuestion(qi, { correctIndex: ci })}
                        className="text-primary focus:ring-primary"
                      />
                      Option {ci + 1}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Explanation</label>
                <textarea
                  value={q.explanation}
                  onChange={(e) => updateQuestion(qi, { explanation: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  placeholder="Shown after the player answers."
                />
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}
