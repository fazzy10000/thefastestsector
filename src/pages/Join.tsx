import { useState } from 'react'
import { CheckCircle, Loader2, UserPlus } from 'lucide-react'
import SEO from '../components/SEO'
import { useSettings } from '../hooks/useSettings'
import { submitJoinApplication } from '../lib/submissions'

const inputClass =
  'w-full px-4 py-2.5 border border-gray-300 dark:border-white/20 rounded-lg bg-white dark:bg-white/5 text-text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm'

const EMPTY = {
  firstName: '',
  lastName: '',
  email: '',
  instagram: '',
  role: '' as '' | 'writer' | 'creator' | 'suggest',
  suggestedRole: '',
  why: '',
  portfolioUrl: '',
}

export default function Join() {
  const { settings } = useSettings()
  const join = settings.joinPage
  const [form, setForm] = useState(EMPTY)
  const [sending, setSending] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const update = (field: keyof typeof EMPTY, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.role) {
      setError('Please choose a role.')
      return
    }
    if (form.role === 'suggest' && !form.suggestedRole.trim()) {
      setError('Please tell us which role you’d like to suggest.')
      return
    }
    setError('')
    setSending(true)
    try {
      await submitJoinApplication({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        instagram: form.instagram || undefined,
        role:
          form.role === 'suggest' ? `suggest: ${form.suggestedRole.trim()}` : form.role,
        why: form.why,
        portfolioUrl: form.portfolioUrl || undefined,
      })
      setSubmitted(true)
    } catch {
      setError(`Something went wrong. Please email ${settings.contactEmail} instead.`)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SEO title={join.title} description={join.seoDescription} />
      <h1 className="text-3xl font-bold text-text-primary dark:text-white mb-2">{join.title}</h1>
      <div className="h-1 w-16 bg-primary mt-2 mb-6 rounded-full" />

      <p className="text-text-secondary dark:text-white/70 mb-6 leading-relaxed">{join.intro}</p>

      <div className="bg-surface-card dark:bg-surface-dark rounded-xl p-6 shadow-sm mb-8">
        <h2 className="text-lg font-bold text-text-primary dark:text-white mb-3">
          {join.benefitsHeading}
        </h2>
        <ul className="space-y-2 text-sm text-text-secondary dark:text-white/70">
          {join.benefits.map((benefit) => (
            <li key={benefit}>• {benefit}</li>
          ))}
        </ul>
      </div>

      {submitted ? (
        <div className="bg-surface-card dark:bg-surface-dark rounded-xl p-10 shadow-sm text-center">
          <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text-primary dark:text-white mb-2">
            Thank you for your response.
          </h2>
          <p className="text-text-secondary dark:text-white/60">
            We've received your application and will be in touch soon.
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-surface-card dark:bg-surface-dark rounded-xl p-8 shadow-sm space-y-5"
        >
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-white mb-1.5">
                First name <span className="text-primary">*</span>
              </label>
              <input
                required
                value={form.firstName}
                onChange={(e) => update('firstName', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-white mb-1.5">
                Last name <span className="text-primary">*</span>
              </label>
              <input
                required
                value={form.lastName}
                onChange={(e) => update('lastName', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
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
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-white mb-1.5">
                Instagram handle
              </label>
              <input
                value={form.instagram}
                onChange={(e) => update('instagram', e.target.value)}
                className={inputClass}
                placeholder="@yourhandle"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-white mb-1.5">
              I want to join as a… <span className="text-primary">*</span>
            </label>
            <div className="flex flex-wrap gap-3">
              {[
                { value: 'writer', label: 'Motorsport Writer' },
                { value: 'creator', label: 'Content Creator' },
                { value: 'suggest', label: 'Suggest a role' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update('role', opt.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    form.role === opt.value
                      ? 'bg-primary text-white border-primary'
                      : 'border-gray-300 dark:border-white/20 text-text-primary dark:text-white hover:border-primary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {form.role === 'suggest' && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-text-primary dark:text-white mb-1.5">
                  What role would you like to suggest? <span className="text-primary">*</span>
                </label>
                <input
                  required
                  value={form.suggestedRole}
                  onChange={(e) => update('suggestedRole', e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Photographer, Social media manager, Video editor"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-white mb-1.5">
              Portfolio / previous work (URL)
            </label>
            <input
              type="url"
              value={form.portfolioUrl}
              onChange={(e) => update('portfolioUrl', e.target.value)}
              className={inputClass}
              placeholder="https://"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-white mb-1.5">
              Why do you want to join us? <span className="text-primary">*</span>
            </label>
            <textarea
              required
              rows={5}
              value={form.why}
              onChange={(e) => update('why', e.target.value)}
              className={`${inputClass} resize-none`}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium text-sm disabled:opacity-60"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {sending ? 'Submitting…' : 'Submit application'}
          </button>
        </form>
      )}
    </div>
  )
}
