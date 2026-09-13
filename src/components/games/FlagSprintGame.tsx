import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, RotateCcw, XCircle } from 'lucide-react'
import { FLAG_QUESTIONS } from '../../data/gameContent'
import { flagEmojiFromCountryCode } from '../../lib/countryFlags'

export default function FlagSprintGame() {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const q = FLAG_QUESTIONS[idx]
  const total = FLAG_QUESTIONS.length

  const pick = (optionIndex: number) => {
    if (picked !== null) return
    setPicked(optionIndex)
    if (optionIndex === q.correctIndex) {
      setScore((s) => s + 1)
    }
  }

  const next = () => {
    if (idx >= total - 1) {
      setFinished(true)
      return
    }
    setIdx((i) => i + 1)
    setPicked(null)
  }

  const restart = () => {
    setIdx(0)
    setPicked(null)
    setScore(0)
    setFinished(false)
  }

  const pct = Math.round((score / total) * 100)

  return (
    <div className="max-w-lg mx-auto">
      <Link
        to="/games"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary dark:text-white/60 hover:text-primary mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        All games
      </Link>

      <h1 className="text-2xl font-black text-text-primary dark:text-white mb-2">Flag Sprint</h1>
      <p className="text-sm text-text-secondary dark:text-white/60 mb-8">
        Which country hosts this Grand Prix? Ten flags, no pit wall help.
      </p>

      {!finished && q && (
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-8">
          <p className="text-xs uppercase tracking-widest text-text-secondary dark:text-white/50 mb-4">
            Question {idx + 1} of {total}
          </p>
          <p className="text-6xl text-center mb-8" aria-hidden>
            {flagEmojiFromCountryCode(q.code)}
          </p>
          <div className="grid gap-2">
            {q.options.map((opt, i) => {
              let cls =
                'border-gray-200 dark:border-white/15 bg-white dark:bg-white/5 hover:border-primary/40'
              if (picked !== null) {
                if (i === q.correctIndex) cls = 'border-emerald-500 bg-emerald-500/10'
                else if (i === picked) cls = 'border-red-500 bg-red-500/10'
                else cls = 'border-gray-200/50 opacity-50'
              }
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={picked !== null}
                  onClick={() => pick(i)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 font-medium transition-colors ${cls}`}
                >
                  {opt}
                </button>
              )
            })}
          </div>

          {picked !== null && (
            <div className="mt-6 flex items-start gap-2">
              {picked === q.correctIndex ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 shrink-0" />
              )}
              <div className="flex-1">
                <p className="text-sm font-semibold mb-1">
                  {picked === q.correctIndex ? 'Correct!' : `It's ${q.country}.`}
                </p>
                <button
                  type="button"
                  onClick={next}
                  className="mt-2 px-5 py-2 rounded-lg bg-primary text-white text-sm font-semibold"
                >
                  {idx >= total - 1 ? 'See score' : 'Next flag'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {finished && (
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 text-center">
          <p className="text-sm uppercase tracking-widest text-primary font-bold mb-2">Final score</p>
          <p className="text-5xl font-black text-primary mb-1">
            {score}/{total}
          </p>
          <p className="text-lg font-semibold text-text-primary dark:text-white mb-6">{pct}%</p>
          <button
            type="button"
            onClick={restart}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-semibold"
          >
            <RotateCcw className="w-4 h-4" />
            Play again
          </button>
        </div>
      )}
    </div>
  )
}
