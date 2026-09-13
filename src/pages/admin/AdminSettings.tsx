import { useState, useEffect } from 'react'
import { useSettings } from '../../hooks/useSettings'
import type { SitePageContent, SiteSettings } from '../../lib/types'
import { normalizePolicySections } from '../../lib/policyContent'
import PolicySectionsEditor from '../../components/admin/PolicySectionsEditor'
import { SOCIAL_ADMIN_FIELDS } from '../../components/SocialIcons'
import { Save, Check } from 'lucide-react'
type SettingsTab = 'general' | 'legal' | 'policies' | 'join' | 'footer' | 'social'

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'legal', label: 'Contact & Legal' },
  { id: 'policies', label: 'Policies' },
  { id: 'join', label: 'Join Page' },
  { id: 'footer', label: 'Footer' },
  { id: 'social', label: 'Social Links' },
]

const inputClass =
  'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary'

function stripLegacyPageContent(page: SitePageContent): SitePageContent {
  const { content: _legacy, ...rest } = page
  return {
    ...rest,
    sections: normalizePolicySections(rest.sections),
  }
}

function PageContentEditor({
  label,
  page,
  onChange,
}: {
  label: string
  page: SitePageContent
  onChange: (next: SitePageContent) => void
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900">{label}</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Page title</label>
          <input
            type="text"
            value={page.title}
            onChange={(e) => onChange({ ...page, title: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Last updated</label>
          <input
            type="text"
            value={page.lastUpdated}
            onChange={(e) => onChange({ ...page, lastUpdated: e.target.value })}
            className={inputClass}
            placeholder="August 2026"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">SEO description</label>
        <input
          type="text"
          value={page.seoDescription}
          onChange={(e) => onChange({ ...page, seoDescription: e.target.value })}
          className={inputClass}
        />
      </div>
      <div>
        <p className="text-sm text-gray-500 mb-3">
          Build the page in sections. Use short headings, plain paragraphs, and bullet lists — no
          formatting codes needed. Site name, email, and location fill in automatically from Contact
          &amp; Legal.
        </p>
        <PolicySectionsEditor
          sections={page.sections}
          onChange={(sections) => onChange({ ...page, sections })}
        />
      </div>
    </div>
  )
}
export default function AdminSettings() {
  const { settings, saveSettings, loading } = useSettings()
  const [form, setForm] = useState<SiteSettings>(settings)
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!loading) setForm(settings)
  }, [settings, loading])

  const handleSave = async () => {
    setSaving(true)
    try {
      const next = {
        ...form,
        privacyPolicy: stripLegacyPageContent(form.privacyPolicy),
        editorialPolicy: stripLegacyPageContent(form.editorialPolicy),
        correctionsPolicy: stripLegacyPageContent(form.correctionsPolicy),
        terms: stripLegacyPageContent(form.terms),
        socialLinks: {
          ...form.socialLinks,
          email: form.socialLinks.email.trim() || `mailto:${form.contactEmail.trim()}`,
        },
      }
      await saveSettings(next)
      setForm(next)
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

  const updateBenefit = (index: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      joinPage: {
        ...prev.joinPage,
        benefits: prev.joinPage.benefits.map((item, i) => (i === index ? value : item)),
      },
    }))
  }

  const updateValueProp = (index: number, field: 'title' | 'desc', value: string) => {
    setForm((prev) => ({
      ...prev,
      footer: {
        ...prev.footer,
        valueProps: prev.footer.valueProps.map((item, i) =>
          i === index ? { ...item, [field]: value } : item,
        ),
      },
    }))
  }

  if (loading) {
    return <div className="text-gray-400 text-center py-16">Loading settings...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage site-wide content, policies, and configuration
          </p>
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

      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {activeTab === 'general' && (
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Site Information</h2>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Site name</label>
                  <input
                    type="text"
                    value={form.siteName}
                    onChange={(e) => setForm((p) => ({ ...p, siteName: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tagline</label>
                  <input
                    type="text"
                    value={form.siteTagline}
                    onChange={(e) => setForm((p) => ({ ...p, siteTagline: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Our Story</h2>
              <textarea
                value={form.ourStory}
                onChange={(e) => setForm((p) => ({ ...p, ourStory: e.target.value }))}
                rows={6}
                className={`${inputClass} resize-none`}
                placeholder="Tell your story..."
              />
              <p className="text-xs text-gray-400 mt-1.5">Shown on the About page.</p>
            </div>
          </>
        )}

        {activeTab === 'legal' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Contact & Legal</h2>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contact email
                </label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
                  className={inputClass}
                  placeholder="hello@example.com"
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Used on Contact, Join, and policy pages.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Legal location
                </label>
                <input
                  type="text"
                  value={form.legalLocation}
                  onChange={(e) => setForm((p) => ({ ...p, legalLocation: e.target.value }))}
                  className={inputClass}
                  placeholder="Dublin, Ireland"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'policies' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-10">
            <PageContentEditor
              label="Editorial Policy"
              page={form.editorialPolicy}
              onChange={(editorialPolicy) => setForm((p) => ({ ...p, editorialPolicy }))}
            />
            <hr className="border-gray-100" />
            <PageContentEditor
              label="Corrections & Updates Policy"
              page={form.correctionsPolicy}
              onChange={(correctionsPolicy) => setForm((p) => ({ ...p, correctionsPolicy }))}
            />
            <hr className="border-gray-100" />
            <PageContentEditor
              label="Privacy Policy"
              page={form.privacyPolicy}
              onChange={(privacyPolicy) => setForm((p) => ({ ...p, privacyPolicy }))}
            />
            <hr className="border-gray-100" />
            <PageContentEditor
              label="Terms & Conditions"
              page={form.terms}
              onChange={(terms) => setForm((p) => ({ ...p, terms }))}
            />
          </div>
        )}
        {activeTab === 'join' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Page title</label>
                <input
                  type="text"
                  value={form.joinPage.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, joinPage: { ...p.joinPage, title: e.target.value } }))
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  SEO description
                </label>
                <input
                  type="text"
                  value={form.joinPage.seoDescription}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      joinPage: { ...p.joinPage, seoDescription: e.target.value },
                    }))
                  }
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Intro paragraph</label>
              <textarea
                value={form.joinPage.intro}
                onChange={(e) =>
                  setForm((p) => ({ ...p, joinPage: { ...p.joinPage, intro: e.target.value } }))
                }
                rows={4}
                className={`${inputClass} resize-none`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Benefits heading
              </label>
              <input
                type="text"
                value={form.joinPage.benefitsHeading}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    joinPage: { ...p.joinPage, benefitsHeading: e.target.value },
                  }))
                }
                className={inputClass}
              />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Benefits list</label>
              {form.joinPage.benefits.map((benefit, index) => (
                <input
                  key={index}
                  type="text"
                  value={benefit}
                  onChange={(e) => updateBenefit(index, e.target.value)}
                  className={inputClass}
                />
              ))}
              <button
                type="button"
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    joinPage: { ...p.joinPage, benefits: [...p.joinPage.benefits, ''] },
                  }))
                }
                className="text-sm text-primary hover:underline"
              >
                + Add benefit
              </button>
            </div>
          </div>
        )}

        {activeTab === 'footer' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Newsletter label
                </label>
                <input
                  type="text"
                  value={form.footer.newsletterLabel}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      footer: { ...p.footer, newsletterLabel: e.target.value },
                    }))
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Newsletter headline
                </label>
                <input
                  type="text"
                  value={form.footer.newsletterHeadline}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      footer: { ...p.footer, newsletterHeadline: e.target.value },
                    }))
                  }
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Newsletter description
              </label>
              <textarea
                value={form.footer.newsletterBody}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    footer: { ...p.footer, newsletterBody: e.target.value },
                  }))
                }
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Legal disclaimer</h3>
              <textarea
                value={form.footer.legalDisclaimer}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    footer: { ...p.footer, legalDisclaimer: e.target.value },
                  }))
                }
                rows={4}
                className={`${inputClass} resize-y`}
                placeholder="Trademark and affiliation disclaimer shown at the bottom of the site"
              />
              <p className="text-xs text-gray-400">Shown above the footer links on every page.</p>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Value proposition cards</h3>
              {form.footer.valueProps.map((prop, index) => (
                <div key={index} className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                    <input
                      type="text"
                      value={prop.title}
                      onChange={(e) => updateValueProp(index, 'title', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={prop.desc}
                      onChange={(e) => updateValueProp(index, 'desc', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Social Links</h2>
            <p className="text-sm text-gray-500 mb-4">
              These URLs power the social icons in the top bar and footer (Instagram, TikTok, LinkedIn, X, Discord).
              Leave a field blank to hide that icon.
            </p>
            <div className="grid md:grid-cols-2 gap-5">
              {SOCIAL_ADMIN_FIELDS.map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                  <input
                    type="text"
                    value={form.socialLinks[key]}
                    onChange={(e) => updateSocial(key, e.target.value)}
                    className={inputClass}
                    placeholder={`${label} URL`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
