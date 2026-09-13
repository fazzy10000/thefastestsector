import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, RotateCcw, Wrench } from 'lucide-react'

const DURATION_SEC = 10

export default function PitStopGame() {
  const [running, setRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(DURATION_SEC)
  const [taps, setTaps] = useState(0)
  const [finished, setFinished] = useState(false)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
    }
  }, [])

  const start = () => {
    if (intervalRef.current) window.clearInterval(intervalRef.current)
    setTaps(0)
    setTimeLeft(DURATION_SEC)
    setFinished(false)
    setRunning(true)
    intervalRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (intervalRef.current) window.clearInterval(intervalRef.current)
          setRunning(false)
          setFinished(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
  }

  const rating =
    taps >= 40 ? 'Championship-winning pit crew!' :
    taps >= 30 ? 'Solid sub-3-second stops all round.' :
    taps >= 20 ? 'Not bad — keep the drills going.' :
    'The car is still on jacks…'

  return (
    <div className="max-w-lg mx-auto">
      <Link
        to="/games"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary dark:text-white/60 hover:text-primary mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        All games
      </Link>

      <h1 className="text-2xl font-black text-text-primary dark:text-white mb-2">Pit Stop Blitz</h1>
      <p className="text-sm text-text-secondary dark:text-white/60 mb-8">
        Tap the wheel button as fast as you can for {DURATION_SEC} seconds. How many changes can your crew pull off?
      </p>

      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 text-center">
        {!running && !finished && (
          <button
            type="button"
            onClick={start}
            className="px-8 py-3 rounded-xl bg-primary text-white font-bold uppercase tracking-wider hover:bg-primary-dark transition-colors"
          >
            Start pit stop
          </button>
        )}

        {(running || finished) && (
          <>
            <p className="text-sm uppercase tracking-widest text-text-secondary dark:text-white/50 mb-2">
              {running ? 'Time remaining' : 'Time\'s up'}
            </p>
            <p className="text-5xl font-black text-primary tabular-nums mb-6">{timeLeft}s</p>
            <p className="text-6xl font-black text-text-primary dark:text-white tabular-nums mb-2">{taps}</p>
            <p className="text-xs uppercase tracking-wider text-text-secondary dark:text-white/40 mb-8">wheel changes</p>

            {running ? (
              <button
                type="button"
                onClick={() => setTaps((c) => c + 1)}
                className="w-28 h-28 mx-auto rounded-full bg-gray-900 dark:bg-black border-4 border-primary flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform shadow-lg"
              >
                <Wrench className="w-10 h-10" />
              </button>
            ) : (
              <div>
                <p className="text-sm text-text-secondary dark:text-white/60 mb-6">{rating}</p>
                <button
                  type="button"
                  onClick={start}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-white font-semibold"
                >
                  <RotateCcw className="w-4 h-4" />
                  Go again
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
