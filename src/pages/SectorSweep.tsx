import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, Mail, ChevronRight } from 'lucide-react'
import SEO from '../components/SEO'

const EDITIONS = [
  {
    title: 'F1 Edition',
    desc: 'F1 Sector Sweep',
    sub: 'The Monthly Motorsport Digest',
    series: 'Formula 1',
    color: 'bg-red-600',
  },
  {
    title: 'Feeder Series Edition',
    desc: 'Feeder Series Sweep',
    sub: 'F2, F3, F4 & Beyond',
    series: 'Feeder Series',
    color: 'bg-emerald-700',
  },
  {
    title: 'IndyCar Edition',
    desc: 'IndyCar Sweep',
    sub: 'Open-Wheel American Racing',
    series: 'IndyCar',
    color: 'bg-indigo-800',
  },
  {
    title: 'Formula E Edition',
    desc: 'Formula E Sweep',
    sub: 'Electric. Global. Fast.',
    series: 'Formula E',
    color: 'bg-sky-600',
  },
]

const BENEFITS = [
  'Top stories & in-depth analysis',
  'Race results, standings & stats',
  'Exclusive driver and team interviews',
  'Technical deep dives and data',
  'Delivered straight to your inbox every month',
]

export default function SectorSweep() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) setSubscribed(true)
  }

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      <SEO
        title="Sector Sweep Newsletter | The Fastest Sector"
        description="Get the latest motorsport news, results and analysis delivered straight to your inbox every month."
      />

      {/* Hero */}
      <section className="bg-surface-dark text-white py-16 px-4">
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
            <form onSubmit={handleSubmit} className="flex gap-3 max-w-md mx-auto">
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
                className="px-6 py-3 bg-primary text-white text-sm font-bold uppercase tracking-wider rounded hover:bg-primary-dark transition-colors whitespace-nowrap"
              >
                Subscribe Now
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Benefits */}
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

      {/* Edition cards */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <h2 className="text-xl font-black text-text-primary dark:text-white mb-6">
          Choose your series
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <button className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-primary hover:underline">
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
      </section>

      {/* Archive teaser */}
      <section className="bg-gray-50 dark:bg-surface-darker py-10 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2">Archive</p>
          <h2 className="text-xl font-black text-text-primary dark:text-white mb-3">Browse past editions</h2>
          <p className="text-sm text-text-secondary dark:text-white/60 mb-4">
            Catch up on what you missed. Every edition is stored in our archive.
          </p>
          <Link
            to="/sector-sweep"
            className="inline-block px-6 py-2.5 border border-primary text-primary text-sm font-bold uppercase tracking-wider rounded hover:bg-primary hover:text-white transition-colors"
          >
            View Archive
          </Link>
        </div>
      </section>
    </div>
  )
}
