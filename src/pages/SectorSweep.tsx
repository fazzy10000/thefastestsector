import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CheckCircle, Mail, ChevronRight, Loader2 } from 'lucide-react'
import SEO from '../components/SEO'
import { submitNewsletter } from '../lib/submissions'

const EDITIONS = [
  {
    title: 'F1 Edition',
    desc: 'F1 Sector Sweep',
    sub: 'The Monthly Motorsport Digest',
    series: 'Formula 1',
    color: 'bg-red-600',
    edition: 'f1',
  },
  {
    title: 'Feeder Series Edition',
    desc: 'Feeder Series Sweep',
    sub: 'F2, F3, F4 & Beyond',
    series: 'Feeder Series',
    color: 'bg-emerald-700',
    edition: 'feeder-series',
  },
  {
    title: 'IndyCar Edition',
    desc: 'IndyCar Sweep',
    sub: 'Open-Wheel American Racing',
    series: 'IndyCar',
    color: 'bg-indigo-800',
    edition: 'indycar',
  },
  {
    title: 'Formula E Edition',
    desc: 'Formula E Sweep',
    sub: 'Electric. Global. Fast.',
    series: 'Formula E',
    color: 'bg-sky-600',
    edition: 'formula-e',
  },
]

const BENEFITS = [
  'Top stories & in-depth analysis',
  'Exclusives',
  'Technical deep dives and data',
  'Delivered straight to your inbox every month',
]

export default function SectorSweep() {
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [selectedEdition, setSelectedEdition] = useState('all')

  useEffect(() => {
    if (!location.hash) return
    const id = location.hash.replace('#', '')
    const el = document.getElementById(id)
    if (el) {
      window.setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    }
  }, [location.hash])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setError('')
    setSending(true)
    try {
      await submitNewsletter({
        email,
        source: 'sector-sweep',
        edition: selectedEdition,
      })
      setSubscribed(true)
    } catch {
      setError('Could not subscribe. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      <SEO
        title="Sector Sweep Newsletter | The Fastest Sector"
        description="Get the latest motorsport news, results and analysis delivered straight to your inbox every month."
      />

      <section id="subscribe" className="bg-surface-dark text-white py-16 px-4 scroll-mt-28">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-3">Newsletter</p>
          <h1 className="text-5xl font-black mb-3">
            SECTOR <span className="text-primary">SWEEP</span>
          </h1>
          <p className="text-white/60 text-lg mb-8">
            All the latest motorsport news straight to your inbox. Monthly.
          </p>

          {subscribed ? (
            <div className="flex items-center justify-center gap-2 text-green-400 text-lg font-bold">
              <CheckCircle className="w-6 h-6" />
              You're subscribed! Welcome to the grid.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded text-white placeholder:text-white/40 focus:outline-none focus:border-primary text-sm"
              />
              <button
                type="submit"
                disabled={sending}
                className="px-6 py-3 bg-primary text-white text-sm font-bold uppercase tracking-wider rounded hover:bg-primary-dark transition-colors whitespace-nowrap disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {sending && <Loader2 className="w-4 h-4 animate-spin" />}
                Subscribe Now
              </button>
            </form>
          )}
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-12">
        <h2 className="text-xl font-black text-center text-text-primary dark:text-white mb-6">
          What you'll get
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {BENEFITS.map((b) => (
            <div key={b} className="flex items-start gap-3 p-3 bg-white dark:bg-white/5 rounded-lg">
              <CheckCircle className="w-4 h-4 text-primary flex-none mt-0.5" />
              <p className="text-sm text-text-primary dark:text-white">{b}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="latest" className="max-w-5xl mx-auto px-4 pb-12 scroll-mt-28">
        <h2 className="text-xl font-black text-text-primary dark:text-white mb-2">
          Latest Edition
        </h2>
        <p className="text-sm text-text-secondary dark:text-white/60 mb-6">
          Pick a series edition to subscribe, or jump into the latest coverage below.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {EDITIONS.map((ed) => (
            <div
              key={ed.title}
              className="bg-white dark:bg-white/5 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className={`${ed.color} p-4 text-white`}>
                <p className="text-xs font-bold uppercase tracking-wider opacity-80">{ed.series}</p>
                <p className="font-black text-lg">{ed.desc}</p>
                <p className="text-xs opacity-70">{ed.sub}</p>
              </div>
              <div className="p-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEdition(ed.edition)
                    document.getElementById('subscribe')?.scrollIntoView({ behavior: 'smooth' })
                    window.setTimeout(
                      () => document.querySelector<HTMLInputElement>('input[type="email"]')?.focus(),
                      400,
                    )
                  }}
                  className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-primary hover:underline"
                >
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    Subscribe
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-6 text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2">This month</p>
          <h3 className="text-lg font-black text-text-primary dark:text-white mb-2">
            Sector Sweep — Latest Digest
          </h3>
          <p className="text-sm text-text-secondary dark:text-white/60 mb-4 max-w-xl mx-auto">
            Catch the headline stories, race weekends and standings from across F1, IndyCar, Formula E and the feeder ladder.
          </p>
          <Link
            to="/category/news"
            className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
          >
            Read latest coverage <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <section id="archive" className="bg-gray-50 dark:bg-surface-darker py-10 px-4 scroll-mt-28">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2">Archive</p>
          <h2 className="text-xl font-black text-text-primary dark:text-white mb-3">Browse past editions</h2>
          <p className="text-sm text-text-secondary dark:text-white/60 mb-4">
            Catch up on what you missed. Browse our full news archive across every series.
          </p>
          <Link
            to="/category/news"
            className="inline-block px-6 py-2.5 border border-primary text-primary text-sm font-bold uppercase tracking-wider rounded hover:bg-primary hover:text-white transition-colors"
          >
            Browse archive
          </Link>
        </div>
      </section>
    </div>
  )
}
