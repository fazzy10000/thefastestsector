import { useState, useEffect } from 'react'
import { useSettings } from '../../hooks/useSettings'
import type { SiteSettings } from '../../lib/types'
import { Save, Check } from 'lucide-react'

export default function AdminSettings() {
  const { settings, saveSettings, loading } = useSettings()
  const [form, setForm] = useState<SiteSettings>(settings)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!loading) setForm(settings)
  }, [settings, loading])

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveSettings(form)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Error saving settings:', err)
    } finally {
      setSaving(false)
    }
  }

  const updateSocial = (key: keyof SiteSettings['socialLinks'], value: string) => {
    setForm((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [key]: value },
    }))
  }

  if (loading) {
    return <div className="text-gray-400 text-center py-16">Loading settings...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your site content and configuration</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium disabled:opacity-50"
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="space-y-6">
        {/* Site Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Site Information</h2>
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Site Name</label>
              <input
                type="text"
                value={form.siteName}
                onChange={(e) => setForm((p) => ({ ...p, siteName: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tagline</label>
              <input
                type="text"
                value={form.siteTagline}
                onChange={(e) => setForm((p) => ({ ...p, siteTagline: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Our Story */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Our Story</h2>
          <textarea
            value={form.ourStory}
            onChange={(e) => setForm((p) => ({ ...p, ourStory: e.target.value }))}
            rows={6}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary resize-none"
            placeholder="Tell your story..."
          />
          <p className="text-xs text-gray-400 mt-1.5">This appears in the footer and About page.</p>
        </div>

        {/* Social Links */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Social Links</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {([
              ['twitter', 'X / Twitter'],
              ['instagram', 'Instagram'],
              ['linkedin', 'LinkedIn'],
              ['tiktok', 'TikTok'],
              ['discord', 'Discord'],
              ['email', 'Email (mailto:)'],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                <input
                  type="text"
                  value={form.socialLinks[key]}
                  onChange={(e) => updateSocial(key, e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary"
                  placeholder={`${label} URL`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
