import { useEffect, useState, useRef, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, RotateCcw, Trophy, XCircle } from 'lucide-react'
import SEO from '../components/SEO'
import RacingLoader from '../components/RacingLoader'
import { useQuizzes } from '../hooks/useQuizzes'
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../lib/types'
import type { Quiz } from '../lib/types'

function scoreRating(pct: number): { title: string; subtitle: string } {
  if (pct >= 95) return { title: 'Pole Position!', subtitle: 'A qualifying lap worth of knowledge.' }
  if (pct > 75) return { title: 'Podium Finish!', subtitle: 'You’re standing on the box today.' }
  if (pct >= 50) return { title: 'Points Finish', subtitle: 'Solid racecraft — keep pushing.' }
  if (pct >= 25) return { title: 'Pit Lane Expert!', subtitle: 'You know the procedures — now hit the track.' }
  return { title: 'Back of the Grid...', subtitle: 'Study the data and try another run.' }
}

function ConfettiCanvas({ active }: { active: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!active) return
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let cw = window.innerWidth
    let ch = window.innerHeight

    const resize = () => {
      cw = window.innerWidth
      ch = window.innerHeight
      canvas.width = cw * dpr
      canvas.height = ch * dpr
      canvas.style.width = `${cw}px`
      canvas.style.height = `${ch}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const colors = ['#c8102e', '#ffffff', '#fbbf24', '#22c55e', '#3b82f6']
    type Piece = { x: number; y: number; vx: number; vy: number; rot: number; vr: number; c: string; s: number }
    const pieces: Piece[] = Array.from({ length: 140 }, () => ({
      x: Math.random() * cw,
      y: -20 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 6,
      vy: 2 + Math.random() * 5,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.2,
      c: colors[Math.floor(Math.random() * colors.length)]!,
      s: 4 + Math.random() * 6,
    }))

    let frame: number
    const tick = () => {
      ctx.clearRect(0, 0, cw, ch)
      for (const p of pieces) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.08
        p.rot += p.vr
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.c
        ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6)
        ctx.restore()
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
    }
  }, [active])

  if (!active) return null
  return (
    <canvas
      ref={ref}
      className="pointer-events-none fixed inset-0 z-[100] w-full h-full"
      aria-hidden
    />
  )
}

export default function QuizPage() {
  const { slug } = useParams<{ slug: string }>()
  const { getQuizBySlug } = useQuizzes()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!slug) {
        setQuiz(null)
        setLoading(false)
        return
      }
      const q = await getQuizBySlug(slug)
      if (cancelled) return
      if (!q || q.status !== 'published') {
        setQuiz(null)
      } else {
        setQuiz(q)
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [slug, getQuizBySlug])

  const reset = useCallback(() => {
    setIdx(0)
    setPicked(null)
    setCorrectCount(0)
    setFinished(false)
  }, [])

  const current = quiz && quiz.questions[idx] ? quiz.questions[idx] : null
  const total = quiz?.questions.length ?? 0
  const progress =
    total > 0 ? ((idx + (picked !== null ? 1 : 0)) / total) * 100 : 0
  const pct =
    total > 0 ? Math.round((correctCount / total) * 100) : 0
  const showConfetti = finished && pct > 75

  const selectOption = (optionIndex: number) => {
    if (!current || picked !== null) return
    setPicked(optionIndex)
    if (optionIndex === current.correctIndex) {
      setCorrectCount((c) => c + 1)
    }
  }

  const goNext = () => {
    if (!quiz) return
    if (idx >= quiz.questions.length - 1) {
      setFinished(true)
      return
    }
    setIdx((i) => i + 1)
    setPicked(null)
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <RacingLoader message="Loading quiz..." />
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <SEO title="Quiz not found" />
        <h1 className="text-2xl font-bold text-text-primary dark:text-white mb-2">Quiz not found</h1>
        <p className="text-text-secondary dark:text-white/60 mb-8">
          This quiz doesn’t exist or isn’t published yet.
        </p>
        <Link
          to="/quizzes"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Quizzes
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-10 pb-16">
      <SEO title={quiz.title} description={quiz.description} image={quiz.featuredImage} />
      <ConfettiCanvas active={showConfetti} />

      {!finished && (
        <>
          <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-lg mb-8 bg-surface-card dark:bg-white/5">
            <div className="relative aspect-[21/9] md:aspect-[21/8] bg-gray-900">
              <img
                src={quiz.featuredImage}
                alt=""
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
                <span
                  className={`inline-block text-[10px] uppercase tracking-wider font-bold text-white px-2.5 py-1 rounded-full mb-3 ${CATEGORY_COLORS[quiz.category]}`}
                >
                  {CATEGORY_LABELS[quiz.category]}
                </span>
                <h1 className="text-2xl md:text-3xl font-black text-white leading-tight drop-shadow-md">
                  {quiz.title}
                </h1>
                <p className="text-white/85 text-sm md:text-base mt-2 max-w-2xl line-clamp-3">
                  {quiz.description}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between text-sm font-medium text-text-secondary dark:text-white/60 mb-2">
              <span>
                Question {idx + 1} of {total}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {current && (
            <div className="space-y-6">
              <h2 className="text-xl md:text-2xl font-bold text-text-primary dark:text-white leading-snug">
                {current.question}
              </h2>

              <div className="grid gap-3">
                {current.options.map((opt, i) => {
                  let state =
                    'border-gray-200 dark:border-white/15 bg-white dark:bg-white/5 hover:border-primary/50 hover:bg-primary/5'
                  if (picked !== null) {
                    if (i === current.correctIndex) {
                      state = 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15'
                    } else if (i === picked) {
                      state = 'border-red-500 bg-red-500/10 dark:bg-red-500/15'
                    } else {
                      state = 'border-gray-200/50 dark:border-white/10 opacity-60'
                    }
                  }
                  return (
                    <button
                      key={`${current.id}-${i}`}
                      type="button"
                      disabled={picked !== null}
                      onClick={() => selectOption(i)}
                      className={`w-full text-left rounded-xl px-4 py-4 md:py-5 border-2 transition-all duration-200 font-medium text-text-primary dark:text-white shadow-sm ${state}`}
                    >
                      <span className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center text-sm font-bold">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="pt-0.5">{opt}</span>
                      </span>
                    </button>
                  )
                })}
              </div>

              {picked !== null && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10 p-4 md:p-5 transition-opacity duration-300">
                  <div className="flex items-start gap-2 mb-2">
                    {picked === current.correctIndex ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <p className="text-sm font-semibold text-text-primary dark:text-white">
                      {picked === current.correctIndex ? 'Correct!' : 'Not quite.'}
                    </p>
                  </div>
                  <p className="text-sm text-text-secondary dark:text-white/70 leading-relaxed pl-7">
                    {current.explanation}
                  </p>
                  <button
                    type="button"
                    onClick={goNext}
                    className="mt-5 w-full md:w-auto px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors shadow-md"
                  >
                    {idx >= total - 1 ? 'See results' : 'Next question'}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {finished && (
        <div className="text-center pt-4 md:pt-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/15 text-primary mb-6">
            <Trophy className="w-9 h-9" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-text-primary dark:text-white mb-2">
            {scoreRating(pct).title}
          </h2>
          <p className="text-text-secondary dark:text-white/65 mb-8 max-w-md mx-auto">
            {scoreRating(pct).subtitle}
          </p>

          <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-transparent dark:from-primary/20 p-8 md:p-10 mb-10">
            <p className="text-sm uppercase tracking-widest text-primary font-bold mb-2">Your score</p>
            <p className="text-5xl md:text-6xl font-black text-primary tabular-nums">
              {correctCount}
              <span className="text-2xl md:text-3xl text-text-secondary dark:text-white/50 font-bold">
                {' '}
                / {total}
              </span>
            </p>
            <p className="text-xl font-semibold text-text-primary dark:text-white mt-2">{pct}%</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-300 dark:border-white/20 text-text-primary dark:text-white font-semibold hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Try again
            </button>
            <Link
              to="/quizzes"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors shadow-lg"
            >
              Back to Quizzes
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
