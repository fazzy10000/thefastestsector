import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, RotateCcw } from 'lucide-react'

type Phase = 'idle' | 'lights' | 'go' | 'early' | 'result'

const LIGHT_COUNT = 5
const LIGHT_INTERVAL_MS = 900
const GO_DELAY_MIN_MS = 800
const GO_DELAY_MAX_MS = 3500
const BEST_KEY = 'tfs-lights-out-best'

export default function LightsOutGame() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [activeLights, setActiveLights] = useState(0)
  const [reactionMs, setReactionMs] = useState<number | null>(null)
  const [bestMs, setBestMs] = useState<number | null>(() => {
    const stored = localStorage.getItem(BEST_KEY)
    return stored ? Number(stored) : null
  })

  const goAtRef = useRef<number | null>(null)
  const timersRef = useRef<number[]>([])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current = []
  }, [])

  const reset = useCallback(() => {
    clearTimers()
    goAtRef.current = null
    setPhase('idle')
    setActiveLights(0)
    setReactionMs(null)
  }, [clearTimers])

  useEffect(() => () => clearTimers(), [clearTimers])

  const startSequence = () => {
    reset()
    setPhase('lights')
    for (let i = 1; i <= LIGHT_COUNT; i++) {
      const t = window.setTimeout(() => setActiveLights(i), i * LIGHT_INTERVAL_MS)
      timersRef.current.push(t)
    }
    const delay =
      LIGHT_COUNT * LIGHT_INTERVAL_MS +
      GO_DELAY_MIN_MS +
      Math.random() * (GO_DELAY_MAX_MS - GO_DELAY_MIN_MS)
    const goTimer = window.setTimeout(() => {
      goAtRef.current = performance.now()
      setPhase('go')
    }, delay)
    timersRef.current.push(goTimer)
  }

  const handleGo = () => {
    if (phase === 'lights') {
      clearTimers()
      setPhase('early')
      return
    }
    if (phase === 'go' && goAtRef.current !== null) {
      const ms = Math.round(performance.now() - goAtRef.current)
      setReactionMs(ms)
      if (bestMs === null || ms < bestMs) {
        setBestMs(ms)
        localStorage.setItem(BEST_KEY, String(ms))
      }
      setPhase('result')
    }
  }

  const rating =
    reactionMs === null
      ? null
      : reactionMs < 200
        ? 'Superhuman reflexes!'
        : reactionMs < 280
          ? 'Strong start — front-row material.'
          : reactionMs < 400
            ? 'Solid, but you lost a place off the line.'
            : 'Back of the midfield — try again.'

  return (
    <div className="max-w-lg mx-auto">
      <Link
        to="/games"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary dark:text-white/60 hover:text-primary mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        All games
      </Link>

      <h1 className="text-2xl font-black text-text-primary dark:text-white mb-2">Lights Out</h1>
      <p className="text-sm text-text-secondary dark:text-white/60 mb-8">
        Hit Start, wait for all five red lights to go out, then tap Go as fast as you can. Tap too early and it's a false start.
      </p>

      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 text-center">
        <div className="flex justify-center gap-3 mb-10">
          {Array.from({ length: LIGHT_COUNT }, (_, i) => (
            <div
              key={i}
              className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                i < activeLights && phase !== 'go' && phase !== 'result'
                  ? 'bg-red-600 border-red-700 shadow-lg shadow-red-600/40'
                  : 'bg-gray-900 border-gray-700 dark:bg-black dark:border-white/20'
              }`}
            />
          ))}
        </div>

        {phase === 'idle' && (
          <button
            type="button"
            onClick={startSequence}
            className="px-8 py-3 rounded-xl bg-primary text-white font-bold uppercase tracking-wider hover:bg-primary-dark transition-colors"
          >
            Start sequence
          </button>
        )}

        {(phase === 'lights' || phase === 'go') && (
          <button
            type="button"
            onClick={handleGo}
            className={`px-10 py-4 rounded-xl font-black text-lg uppercase tracking-wider transition-all ${
              phase === 'go'
                ? 'bg-emerald-500 text-white animate-pulse'
                : 'bg-gray-200 dark:bg-white/10 text-text-primary dark:text-white'
            }`}
          >
            GO!
          </button>
        )}

        {phase === 'early' && (
          <div>
            <p className="text-red-500 font-bold text-lg mb-4">False start!</p>
            <button type="button" onClick={startSequence} className="inline-flex items-center gap-2 text-primary font-semibold">
              <RotateCcw className="w-4 h-4" />
              Try again
            </button>
          </div>
        )}

        {phase === 'result' && reactionMs !== null && (
          <div>
            <p className="text-4xl font-black text-primary tabular-nums mb-1">{reactionMs} ms</p>
            <p className="text-sm text-text-secondary dark:text-white/60 mb-4">{rating}</p>
            {bestMs !== null && (
              <p className="text-xs text-text-secondary dark:text-white/40 mb-6">Personal best: {bestMs} ms</p>
            )}
            <button type="button" onClick={startSequence} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-semibold">
              <RotateCcw className="w-4 h-4" />
              Run again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
