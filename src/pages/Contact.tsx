import { useState } from 'react'
import { Mail, Send, CheckCircle } from 'lucide-react'
import SEO from '../components/SEO'
import { useSettings } from '../hooks/useSettings'

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

export default function Contact() {
  const { settings } = useSettings()
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    foundUs: '',
    message: '',
  })

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
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
              setForm({ name: '', email: '', subject: '', foundUs: '', message: '' })
            }}
            className="mt-6 px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
          >
            Send another message
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <SEO title="Contact Us" description="Get in touch with The Fastest Sector team." />
      <h1 className="text-3xl font-bold text-text-primary dark:text-white mb-2">Contact</h1>
      <div className="h-1 w-16 bg-primary mt-2 mb-8 rounded-full" />

      {/* Email + social links */}
      <div className="bg-surface-card dark:bg-surface-dark rounded-xl p-8 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-text-primary dark:text-white">
            <Mail className="w-5 h-5 text-primary" />
            <a
              href={settings.socialLinks.email || 'mailto:thefastestsector@gmail.com'}
              className="font-medium hover:text-primary transition-colors"
            >
              thefastestsector@gmail.com
            </a>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {settings.socialLinks.instagram && (
            <a href={settings.socialLinks.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-surface-light dark:bg-white/10 rounded-lg text-text-primary dark:text-white hover:bg-primary hover:text-white transition-colors text-sm font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              Instagram
            </a>
          )}
          {settings.socialLinks.twitter && (
            <a href={settings.socialLinks.twitter} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-surface-light dark:bg-white/10 rounded-lg text-text-primary dark:text-white hover:bg-primary hover:text-white transition-colors text-sm font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              X
            </a>
          )}
          {settings.socialLinks.tiktok && (
            <a href={settings.socialLinks.tiktok} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-surface-light dark:bg-white/10 rounded-lg text-text-primary dark:text-white hover:bg-primary hover:text-white transition-colors text-sm font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
              TikTok
            </a>
          )}
          {settings.socialLinks.linkedin && (
            <a href={settings.socialLinks.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-surface-light dark:bg-white/10 rounded-lg text-text-primary dark:text-white hover:bg-primary hover:text-white transition-colors text-sm font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              LinkedIn
            </a>
          )}
          {settings.socialLinks.discord && (
            <a href={settings.socialLinks.discord} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-surface-light dark:bg-white/10 rounded-lg text-text-primary dark:text-white hover:bg-primary hover:text-white transition-colors text-sm font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/></svg>
              Discord
            </a>
          )}
        </div>
      </div>

      {/* Contact form */}
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
            <div className="relative">
              <label className="block text-sm font-medium text-text-primary dark:text-white mb-1.5">
                Subject <span className="text-primary">*</span>
              </label>
              <div className="relative">
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
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-text-primary dark:text-white mb-1.5">
                How did you find us?
              </label>
              <div className="relative">
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
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
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

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium text-sm"
          >
            <Send className="w-4 h-4" />
            Submit
          </button>
        </form>
      </div>
    </div>
  )
}
