import { useState } from 'react'
import { Mail, Send, CheckCircle, Loader2 } from 'lucide-react'
import SEO from '../components/SEO'
import { useSettings } from '../hooks/useSettings'
import { submitContact } from '../lib/submissions'

const SUBJECT_OPTIONS = [
  { value: '', label: 'Select a subject' },
  { value: 'general', label: 'General Inquiry' },
  { value: 'join', label: 'Join the Team' },
  { value: 'partnership', label: 'Partnership / Sponsorship' },
  { value: 'press', label: 'Press & Media' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'correction', label: 'Article Correction' },
  { value: 'other', label: 'Other' },
]

const FOUND_US_OPTIONS = [
  { value: '', label: 'How did you find us?' },
  { value: 'social', label: 'Social Media' },
  { value: 'search', label: 'Search Engine' },
  { value: 'friend', label: 'Friend / Word of Mouth' },
  { value: 'reddit', label: 'Reddit / Forum' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'other', label: 'Other' },
]

const inputClass =
  'w-full px-4 py-2.5 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-white/5 text-text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm'

const selectClass =
  'w-full px-4 py-2.5 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-white/5 text-text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm appearance-none cursor-pointer'

const EMPTY = { name: '', email: '', subject: '', foundUs: '', message: '' }

export default function Contact() {
  const { settings } = useSettings()
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY)

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSending(true)
    try {
      await submitContact(form)
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please email us directly or try again.')
    } finally {
      setSending(false)
    }
  }

  if (submitted) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <SEO title="Contact Us" description="Get in touch with The Fastest Sector team." />
        <div className="bg-surface-card dark:bg-surface-dark rounded-xl p-12 shadow-sm text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text-primary dark:text-white mb-2">
            Thank you for your response.
          </h2>
          <p className="text-text-secondary dark:text-white/60">
            We'll get back to you as soon as possible.
          </p>
          <button
            onClick={() => {
              setSubmitted(false)
              setForm(EMPTY)
            }}
            className="mt-6 px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
          >
            Send another message
          </button>
        </div>
      </div>
    )
  }

  const emailHref = settings.socialLinks.email || `mailto:${settings.contactEmail}`
  const emailLabel = settings.contactEmail

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <SEO title="Contact Us" description="Get in touch with The Fastest Sector team." />
      <h1 className="text-3xl font-bold text-text-primary dark:text-white mb-2">Contact</h1>
      <div className="h-1 w-16 bg-primary mt-2 mb-8 rounded-full" />

      <div className="bg-surface-card dark:bg-surface-dark rounded-xl p-8 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-text-primary dark:text-white">
            <Mail className="w-5 h-5 text-primary" />
            <a href={emailHref} className="font-medium hover:text-primary transition-colors">
              {emailLabel}
            </a>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {[
            { key: 'instagram' as const, label: 'Instagram' },
            { key: 'tiktok' as const, label: 'TikTok' },
            { key: 'linkedin' as const, label: 'LinkedIn' },
            { key: 'twitter' as const, label: 'X' },
            { key: 'discord' as const, label: 'Discord' },
          ]
            .filter(({ key }) => settings.socialLinks[key])
            .map(({ key, label }) => (
              <a
                key={key}
                href={settings.socialLinks[key]}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-surface-light dark:bg-white/10 rounded-lg text-text-primary dark:text-white hover:bg-primary hover:text-white transition-colors text-sm font-medium"
              >
                {label}
              </a>
            ))}
        </div>
      </div>

      <div className="bg-surface-card dark:bg-surface-dark rounded-xl p-8 shadow-sm">
        <h2 className="text-xl font-bold text-text-primary dark:text-white mb-1">Send us a message</h2>
        <p className="text-text-secondary dark:text-white/60 text-sm mb-6">
          Fill out the form below and we'll get back to you as soon as possible.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-white mb-1.5">
                Name <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                className={inputClass}
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-white mb-1.5">
                Email <span className="text-primary">*</span>
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className={inputClass}
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-white mb-1.5">
                Subject <span className="text-primary">*</span>
              </label>
              <select
                required
                value={form.subject}
                onChange={(e) => update('subject', e.target.value)}
                className={selectClass}
              >
                {SUBJECT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.value === ''}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-white mb-1.5">
                How did you find us?
              </label>
              <select
                value={form.foundUs}
                onChange={(e) => update('foundUs', e.target.value)}
                className={selectClass}
              >
                {FOUND_US_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.value === ''}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-white mb-1.5">
              Message <span className="text-primary">*</span>
            </label>
            <textarea
              required
              rows={6}
              value={form.message}
              onChange={(e) => update('message', e.target.value)}
              className={`${inputClass} resize-none`}
              placeholder="Tell us what's on your mind..."
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium text-sm disabled:opacity-60"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? 'Sending…' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  )
}
