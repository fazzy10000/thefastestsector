import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Flag } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { getTourSteps, type TourStep } from './adminTourSteps'

const seenKey = (uid: string) => `tfs_admin_tour_seen_${uid}`

type Rect = { top: number; left: number; width: number; height: number }

const SPOT_PAD = 8
const TIP_GAP = 14
const EDGE = 12

/**
 * Spotlight product tour for the admin. Auto-starts ~1s after first login
 * (per-user localStorage flag) and can be re-run via the `startSignal` prop
 * (incremented by the "Take the tour" buttons in AdminLayout).
 */
export default function AdminTour({ startSignal }: { startSignal: number }) {
  const { user, loading, role } = useAuth()
  const navigate = useNavigate()

  const [steps, setSteps] = useState<TourStep[]>([])
  const [stepIndex, setStepIndex] = useState(0)
  const [active, setActive] = useState(false)
  const [rect, setRect] = useState<Rect | null>(null)
  const [tipPos, setTipPos] = useState<{ top: number; left: number } | null>(null)

  const targetRef = useRef<HTMLElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const directionRef = useRef<1 | -1>(1)
  const autoStartedRef = useRef(false)

  const start = useCallback(() => {
    setSteps(getTourSteps(role))
    directionRef.current = 1
    setRect(null)
    setTipPos(null)
    setStepIndex(0)
    setActive(true)
  }, [role])

  const stop = useCallback(() => {
    setActive(false)
    setRect(null)
    setTipPos(null)
    targetRef.current = null
    if (user) localStorage.setItem(seenKey(user.uid), String(Date.now()))
  }, [user])

  // Auto-start on first login (no per-user seen flag yet). Keyed on the
  // stable uid string — the user object identity changes on refetch.
  const uid = user?.uid || ''
  useEffect(() => {
    if (loading || !uid || autoStartedRef.current) return
    if (localStorage.getItem(seenKey(uid))) return
    const t = setTimeout(() => {
      autoStartedRef.current = true
      start()
    }, 1000)
    return () => clearTimeout(t)
  }, [loading, uid, start])

  // Manual re-trigger from AdminLayout.
  useEffect(() => {
    if (startSignal > 0) start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startSignal])

  const measure = useCallback(() => {
    const el = targetRef.current
    if (!el || !el.isConnected) return
    const r = el.getBoundingClientRect()
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
  }, [])

  // Locate the current step's target: navigate if needed, poll until the
  // element exists, scroll it into view, then measure. Missing targets are
  // skipped gracefully in the direction of travel.
  useEffect(() => {
    if (!active) return
    const step = steps[stepIndex]
    if (!step) return
    let cancelled = false
    setRect(null)
    setTipPos(null)
    targetRef.current = null

    if (window.location.pathname !== step.route) {
      navigate(step.route)
    }

    const startedAt = Date.now()
    const tryFind = () => {
      if (cancelled) return
      const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`)
      if (el && el.getClientRects().length > 0) {
        targetRef.current = el
        // 'instant' bypasses the site-wide `scroll-behavior: smooth`, so the
        // measurement below happens after the scroll has actually landed.
        el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' })
        window.setTimeout(() => {
          if (!cancelled) measure()
        }, 250)
        return
      }
      if (Date.now() - startedAt > 5000) {
        // Target never appeared — skip gracefully.
        const nextIdx = stepIndex + directionRef.current
        if (nextIdx < 0 || nextIdx >= steps.length) stop()
        else setStepIndex(nextIdx)
        return
      }
      window.setTimeout(tryFind, 150)
    }
    window.setTimeout(tryFind, 50)
    return () => {
      cancelled = true
    }
  }, [active, stepIndex, steps, navigate, measure, stop])

  // Keep the spotlight glued to the target on resize/scroll.
  useEffect(() => {
    if (!active) return
    const onMove = () => measure()
    window.addEventListener('resize', onMove)
    window.addEventListener('scroll', onMove, true)
    return () => {
      window.removeEventListener('resize', onMove)
      window.removeEventListener('scroll', onMove, true)
    }
  }, [active, measure])

  // Escape skips the tour.
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stop()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, stop])

  // Position the tooltip once its size is known: below → above → right →
  // left → centered, clamped to the viewport.
  useLayoutEffect(() => {
    if (!rect || !tooltipRef.current) return
    const tip = tooltipRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const sTop = rect.top - SPOT_PAD
    const sLeft = rect.left - SPOT_PAD
    const sBottom = rect.top + rect.height + SPOT_PAD
    const sRight = rect.left + rect.width + SPOT_PAD
    const clampX = (x: number) => Math.min(Math.max(EDGE, x), vw - tip.width - EDGE)
    const clampY = (y: number) => Math.min(Math.max(EDGE, y), vh - tip.height - EDGE)
    const centeredX = clampX(rect.left + rect.width / 2 - tip.width / 2)
    const centeredY = clampY(rect.top + rect.height / 2 - tip.height / 2)

    let pos: { top: number; left: number }
    if (sBottom + TIP_GAP + tip.height < vh - EDGE) {
      pos = { top: sBottom + TIP_GAP, left: centeredX }
    } else if (sTop - TIP_GAP - tip.height > EDGE) {
      pos = { top: sTop - TIP_GAP - tip.height, left: centeredX }
    } else if (sRight + TIP_GAP + tip.width < vw - EDGE) {
      pos = { top: centeredY, left: sRight + TIP_GAP }
    } else if (sLeft - TIP_GAP - tip.width > EDGE) {
      pos = { top: centeredY, left: sLeft - TIP_GAP - tip.width }
    } else {
      pos = { top: clampY(vh / 2 - tip.height / 2), left: clampX(vw / 2 - tip.width / 2) }
    }
    setTipPos(pos)
  }, [rect, stepIndex])

  if (!active || steps.length === 0) return null

  const step = steps[stepIndex]
  const isLast = stepIndex === steps.length - 1

  const next = () => {
    directionRef.current = 1
    if (isLast) stop()
    else setStepIndex((i) => i + 1)
  }
  const back = () => {
    if (stepIndex === 0) return
    directionRef.current = -1
    setStepIndex((i) => i - 1)
  }

  return (
    <>
      {/* Click blocker under everything tour-related */}
      <div className="fixed inset-0 z-[70]" aria-hidden />

      {/* Spotlight ring + page dim via giant box-shadow */}
      {rect ? (
        <div
          className="fixed z-[80] pointer-events-none rounded-xl border-2 border-primary transition-all duration-300"
          style={{
            top: rect.top - SPOT_PAD,
            left: rect.left - SPOT_PAD,
            width: rect.width + SPOT_PAD * 2,
            height: rect.height + SPOT_PAD * 2,
            boxShadow: '0 0 0 9999px rgba(10, 10, 16, 0.65)',
          }}
          aria-hidden
        />
      ) : (
        <div className="fixed inset-0 z-[80] bg-black/65" aria-hidden />
      )}

      {/* Tooltip card */}
      {rect && step && (
        <div
          ref={tooltipRef}
          role="dialog"
          aria-label={`Tour step ${stepIndex + 1} of ${steps.length}: ${step.title}`}
          className="tfs-tour-card fixed z-[90] w-[min(20rem,calc(100vw-2rem))] bg-white rounded-xl shadow-2xl border border-gray-200 p-5 transition-all duration-300"
          style={{
            top: tipPos?.top ?? -9999,
            left: tipPos?.left ?? -9999,
            visibility: tipPos ? 'visible' : 'hidden',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">
              {stepIndex + 1} of {steps.length}
            </span>
            <button
              onClick={stop}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Skip tour
            </button>
          </div>
          <h3 className="font-bold text-gray-900 mb-1.5">{step.title}</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{step.body}</p>
          <div className="flex items-center justify-end gap-2 mt-4">
            <button
              onClick={back}
              disabled={stepIndex === 0}
              className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={next}
              className="flex items-center gap-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              {isLast ? (
                <>
                  Finish
                  <Flag className="w-4 h-4" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
