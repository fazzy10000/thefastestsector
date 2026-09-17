import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Flag } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { getTourSteps, ADMIN_TOUR_EVENT, type TourFocus, type TourStep } from './adminTourSteps'

const seenKey = (uid: string) => `tfs_admin_tour_seen_${uid}`
export { ADMIN_TOUR_EVENT }

type Rect = { top: number; left: number; width: number; height: number }
type TipPos = { top: number; left: number }

const SPOT_PAD = 8
const TIP_GAP = 14
const EDGE = 12
const MOVE_MS = 420

/**
 * Spotlight product tour for the admin. Auto-starts ~1s after first login
 * (per-user localStorage flag) and can be re-run via the `startSignal` prop
 * (incremented by the "Take the tour" buttons in AdminLayout) or a
 * `tfs-admin-tour` CustomEvent with `{ focus: 'seo' | 'writing' }`.
 */
export default function AdminTour({ startSignal }: { startSignal: number }) {
  const { user, loading, role } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [steps, setSteps] = useState<TourStep[]>([])
  const [stepIndex, setStepIndex] = useState(0)
  const [active, setActive] = useState(false)
  const [rect, setRect] = useState<Rect | null>(null)
  const [tipPos, setTipPos] = useState<TipPos | null>(null)
  const [tipOpaque, setTipOpaque] = useState(false)
  const [spotVisible, setSpotVisible] = useState(false)
  /** After the first target, animate between spots instead of jumping. */
  const [animateSpot, setAnimateSpot] = useState(false)

  const targetRef = useRef<HTMLElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const directionRef = useRef<1 | -1>(1)
  const autoStartedRef = useRef(false)
  const forcedFocusRef = useRef<TourFocus | undefined>(undefined)
  const hadSpotRef = useRef(false)
  const moveTimerRef = useRef<number | null>(null)

  const clearMoveTimer = () => {
    if (moveTimerRef.current != null) {
      window.clearTimeout(moveTimerRef.current)
      moveTimerRef.current = null
    }
  }

  const start = useCallback(
    (focus?: TourFocus) => {
      const forced = focus ?? forcedFocusRef.current
      forcedFocusRef.current = undefined
      clearMoveTimer()
      hadSpotRef.current = false
      setAnimateSpot(false)
      setSpotVisible(false)
      setTipOpaque(false)
      setRect(null)
      setTipPos(null)
      setSteps(getTourSteps(role, { pathname: location.pathname, focus: forced }))
      directionRef.current = 1
      setStepIndex(0)
      setActive(true)
    },
    [role, location.pathname],
  )

  const stop = useCallback(() => {
    clearMoveTimer()
    hadSpotRef.current = false
    setActive(false)
    setAnimateSpot(false)
    setSpotVisible(false)
    setTipOpaque(false)
    setRect(null)
    setTipPos(null)
    targetRef.current = null
    if (user) localStorage.setItem(seenKey(user.uid), String(Date.now()))
  }, [user])

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

  useEffect(() => {
    if (startSignal > 0) start()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startSignal])

  useEffect(() => {
    const onTour = (e: Event) => {
      const detail = (e as CustomEvent<{ focus?: TourFocus }>).detail
      forcedFocusRef.current = detail?.focus
      start(detail?.focus)
    }
    window.addEventListener(ADMIN_TOUR_EVENT, onTour)
    return () => window.removeEventListener(ADMIN_TOUR_EVENT, onTour)
  }, [start])

  const measure = useCallback(() => {
    const el = targetRef.current
    if (!el || !el.isConnected) return
    const r = el.getBoundingClientRect()
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
  }, [])

  // Locate target and move the existing spotlight — never remount from (0,0).
  useEffect(() => {
    if (!active) return
    const step = steps[stepIndex]
    if (!step) return
    let cancelled = false
    clearMoveTimer()
    setTipOpaque(false)
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
        el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' })

        const settle = () => {
          if (cancelled) return
          measure()
          if (!hadSpotRef.current) {
            // First target: place without flying in from the corner.
            setAnimateSpot(false)
            setSpotVisible(true)
            setTipOpaque(true)
            hadSpotRef.current = true
            requestAnimationFrame(() => {
              if (!cancelled) setAnimateSpot(true)
            })
          } else {
            setAnimateSpot(true)
            setSpotVisible(true)
            // Reveal the card after the spotlight has mostly finished moving.
            moveTimerRef.current = window.setTimeout(() => {
              if (!cancelled) {
                measure()
                setTipOpaque(true)
              }
            }, Math.round(MOVE_MS * 0.55))
          }
        }

        // Let smooth scroll settle before locking the spotlight.
        window.setTimeout(settle, 280)
        return
      }
      if (Date.now() - startedAt > 5000) {
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
      clearMoveTimer()
    }
  }, [active, stepIndex, steps, navigate, measure, stop])

  useEffect(() => {
    if (!active) return
    const onMove = () => {
      if (!tipOpaque) return
      measure()
    }
    window.addEventListener('resize', onMove)
    window.addEventListener('scroll', onMove, true)
    return () => {
      window.removeEventListener('resize', onMove)
      window.removeEventListener('scroll', onMove, true)
    }
  }, [active, measure, tipOpaque])

  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stop()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, stop])

  useLayoutEffect(() => {
    if (!rect || !tooltipRef.current) return
    const tip = tooltipRef.current.getBoundingClientRect()
    // First mount may report 0×0 before layout — retry next frame.
    const tipW = tip.width || 320
    const tipH = tip.height || 200
    const vw = window.innerWidth
    const vh = window.innerHeight
    const sTop = rect.top - SPOT_PAD
    const sLeft = rect.left - SPOT_PAD
    const sBottom = rect.top + rect.height + SPOT_PAD
    const sRight = rect.left + rect.width + SPOT_PAD
    const clampX = (x: number) => Math.min(Math.max(EDGE, x), vw - tipW - EDGE)
    const clampY = (y: number) => Math.min(Math.max(EDGE, y), vh - tipH - EDGE)
    const centeredX = clampX(rect.left + rect.width / 2 - tipW / 2)
    const centeredY = clampY(rect.top + rect.height / 2 - tipH / 2)

    let pos: TipPos
    if (sBottom + TIP_GAP + tipH < vh - EDGE) {
      pos = { top: sBottom + TIP_GAP, left: centeredX }
    } else if (sTop - TIP_GAP - tipH > EDGE) {
      pos = { top: sTop - TIP_GAP - tipH, left: centeredX }
    } else if (sRight + TIP_GAP + tipW < vw - EDGE) {
      pos = { top: centeredY, left: sRight + TIP_GAP }
    } else if (sLeft - TIP_GAP - tipW > EDGE) {
      pos = { top: centeredY, left: sLeft - TIP_GAP - tipW }
    } else {
      pos = { top: clampY(vh / 2 - tipH / 2), left: clampX(vw / 2 - tipW / 2) }
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

  const spotStyle = rect
    ? {
        top: rect.top - SPOT_PAD,
        left: rect.left - SPOT_PAD,
        width: rect.width + SPOT_PAD * 2,
        height: rect.height + SPOT_PAD * 2,
        opacity: spotVisible ? 1 : 0,
        transition: animateSpot
          ? `top ${MOVE_MS}ms cubic-bezier(0.22, 1, 0.36, 1), left ${MOVE_MS}ms cubic-bezier(0.22, 1, 0.36, 1), width ${MOVE_MS}ms cubic-bezier(0.22, 1, 0.36, 1), height ${MOVE_MS}ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease`
          : 'opacity 200ms ease',
        boxShadow: '0 0 0 9999px rgba(10, 10, 16, 0.65)',
      }
    : undefined

  // Mount the card as soon as we have a spotlight so layout can measure it
  // (tipPos used to gate rendering, which deadlocked positioning).
  const cardPos = tipPos ??
    (rect
      ? {
          top: Math.min(rect.top + rect.height + SPOT_PAD + TIP_GAP, window.innerHeight - 220),
          left: Math.max(EDGE, Math.min(rect.left, window.innerWidth - 320 - EDGE)),
        }
      : null)

  return (
    <>
      <div className="fixed inset-0 z-[70]" aria-hidden />

      {!rect && <div className="fixed inset-0 z-[80] bg-black/65" aria-hidden />}

      {rect && (
        <div
          className="fixed z-[80] pointer-events-none rounded-xl border-2 border-primary"
          style={spotStyle}
          aria-hidden
        />
      )}

      {rect && cardPos && step && (
        <div
          ref={tooltipRef}
          role="dialog"
          aria-label={`Tour step ${stepIndex + 1} of ${steps.length}: ${step.title}`}
          className="tfs-tour-card fixed z-[90] w-[min(20rem,calc(100vw-2rem))] bg-white rounded-xl shadow-2xl border border-gray-200 p-5"
          style={{
            top: cardPos.top,
            left: cardPos.left,
            opacity: tipOpaque ? 1 : 0,
            transition: 'opacity 180ms ease',
            pointerEvents: tipOpaque ? 'auto' : 'none',
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
              disabled={stepIndex === 0 || !tipOpaque}
              className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={next}
              disabled={!tipOpaque}
              className="flex items-center gap-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
