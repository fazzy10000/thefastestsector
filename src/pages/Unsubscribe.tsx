import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Loader2, MailX } from 'lucide-react'
import SEO from '../components/SEO'
import { api } from '../lib/api'

type State = 'loading' | 'done' | 'error' | 'missing'

export default function Unsubscribe() {
  const [params] = useSearchParams()
  const email = (params.get('e') || params.get('email') || '').trim().toLowerCase()
  const token = (params.get('t') || params.get('token') || '').trim()
  const [state, setState] = useState<State>(() => (email && token ? 'loading' : 'missing'))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!email || !token) return
    let cancelled = false
    ;(async () => {
      try {
        await api('/api/newsletter/unsubscribe', {
          method: 'POST',
          body: JSON.stringify({ e: email, t: token }),
        })
        if (!cancelled) setState('done')
      } catch (err) {
        if (!cancelled) {
          setState('error')
          setError(err instanceof Error ? err.message : 'Could not unsubscribe.')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [email, token])

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <SEO
        title="Unsubscribe | Sector Sweep"
        description="Unsubscribe from The Fastest Sector Sector Sweep newsletter."
      />

      {state === 'loading' && (
        <>
          <Loader2 className="w-10 h-10 text-primary mx-auto mb-4 animate-spin" />
          <h1 className="text-2xl font-bold text-text-primary dark:text-white mb-2">
            Unsubscribing…
          </h1>
          <p className="text-sm text-text-secondary dark:text-white/60">
            One moment while we update your preferences.
          </p>
        </>
      )}

      {state === 'done' && (
        <>
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-primary dark:text-white mb-2">
            You’re unsubscribed
          </h1>
          <p className="text-sm text-text-secondary dark:text-white/60 mb-2">
            <span className="font-medium text-text-primary dark:text-white">{email}</span> will no
            longer receive Sector Sweep emails.
          </p>
          <p className="text-sm text-text-secondary dark:text-white/60 mb-8">
            Changed your mind? You can subscribe again anytime from the site.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/sector-sweep"
              className="inline-flex justify-center px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark"
            >
              Sector Sweep
            </Link>
            <Link
              to="/"
              className="inline-flex justify-center px-4 py-2.5 rounded-lg border border-gray-200 dark:border-white/15 text-sm font-semibold text-text-primary dark:text-white hover:bg-gray-50 dark:hover:bg-white/5"
            >
              Back to home
            </Link>
          </div>
        </>
      )}

      {state === 'error' && (
        <>
          <MailX className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-primary dark:text-white mb-2">
            Link not valid
          </h1>
          <p className="text-sm text-text-secondary dark:text-white/60 mb-8">
            {error || 'This unsubscribe link is invalid or has expired. Use the link from your latest email, or contact us.'}
          </p>
          <Link to="/contact" className="text-primary text-sm font-semibold hover:underline">
            Contact us
          </Link>
        </>
      )}

      {state === 'missing' && (
        <>
          <MailX className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-text-primary dark:text-white mb-2">
            Unsubscribe from Sector Sweep
          </h1>
          <p className="text-sm text-text-secondary dark:text-white/60 mb-8">
            Open the unsubscribe link from the bottom of a Sector Sweep email to leave the list.
            If you don’t have one, message us and we’ll remove you.
          </p>
          <Link to="/contact" className="text-primary text-sm font-semibold hover:underline">
            Contact us
          </Link>
        </>
      )}
    </div>
  )
}
