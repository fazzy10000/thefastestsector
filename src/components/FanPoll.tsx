import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart2, CheckCircle2 } from 'lucide-react'
import { FAN_POLL } from '../data/gameContent'

type VoteCounts = Record<string, number>

function loadCounts(): VoteCounts {
  try {
    const raw = localStorage.getItem(`${FAN_POLL.storageKey}-counts`)
    return raw ? (JSON.parse(raw) as VoteCounts) : {}
  } catch {
    return {}
  }
}

function saveCounts(counts: VoteCounts) {
  localStorage.setItem(`${FAN_POLL.storageKey}-counts`, JSON.stringify(counts))
}

function loadVote(): string | null {
  return localStorage.getItem(`${FAN_POLL.storageKey}-vote`)
}

function saveVote(optionId: string) {
  localStorage.setItem(`${FAN_POLL.storageKey}-vote`, optionId)
}

export default function FanPoll() {
  const [counts, setCounts] = useState<VoteCounts>(loadCounts)
  const [myVote, setMyVote] = useState<string | null>(() => loadVote())

  useEffect(() => {
    saveCounts(counts)
  }, [counts])

  const total = useMemo(
    () => FAN_POLL.options.reduce((sum, o) => sum + (counts[o.id] ?? 0), 0),
    [counts],
  )

  const vote = (optionId: string) => {
    if (myVote) return
    setMyVote(optionId)
    saveVote(optionId)
    setCounts((prev) => ({ ...prev, [optionId]: (prev[optionId] ?? 0) + 1 }))
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 md:p-8">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-5 h-5 text-primary" />
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Fan poll</p>
        </div>
        <h2 className="text-xl font-black text-text-primary dark:text-white mb-6">{FAN_POLL.question}</h2>

        <div className="space-y-3">
          {FAN_POLL.options.map((opt) => {
            const count = counts[opt.id] ?? 0
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            const selected = myVote === opt.id

            return (
              <button
                key={opt.id}
                type="button"
                disabled={!!myVote}
                onClick={() => vote(opt.id)}
                className={`relative w-full text-left rounded-xl border-2 overflow-hidden transition-colors ${
                  selected
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 dark:border-white/15 hover:border-primary/40'
                } ${myVote && !selected ? 'opacity-80' : ''}`}
              >
                {myVote && (
                  <div
                    className="absolute inset-y-0 left-0 bg-primary/15 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                )}
                <div className="relative flex items-center justify-between gap-3 px-4 py-3">
                  <span className="font-semibold text-text-primary dark:text-white flex items-center gap-2">
                    {selected && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                    {opt.label}
                  </span>
                  {myVote && (
                    <span className="text-sm font-bold text-text-secondary dark:text-white/60 tabular-nums">
                      {pct}%
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {myVote ? (
          <p className="text-xs text-text-secondary dark:text-white/50 mt-5 text-center">
            Thanks for voting — {total.toLocaleString()} fan{total === 1 ? '' : 's'} so far on this device.
          </p>
        ) : (
          <p className="text-xs text-text-secondary dark:text-white/50 mt-5 text-center">
            Pick one option to see live results.
          </p>
        )}
      </div>

      <p className="text-center text-sm text-text-secondary dark:text-white/50 mt-6">
        More to play?{' '}
        <Link to="/games" className="text-primary font-semibold hover:underline">
          Try our mini-games
        </Link>
      </p>
    </div>
  )
}
