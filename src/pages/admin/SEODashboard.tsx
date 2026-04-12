import { useState, useEffect, useMemo, useCallback, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { useSEO } from '../../hooks/useSEO'
import { useArticles } from '../../hooks/useArticles'
import { useSettings } from '../../hooks/useSettings'
import { useAuth } from '../../hooks/useAuth'
import type { Article, ArticleSEOOverride, GlobalSEOSettings, SiteSettings } from '../../lib/types'
import {
  Shield,
  Save,
  Check,
  Sparkles,
  ExternalLink,
  ListChecks,
  Globe,
} from 'lucide-react'

const ROBOT_LABELS: Record<keyof GlobalSEOSettings['robotsDirectives'], string> = {
  home: 'Home',
  article: 'Articles',
  category: 'Category pages',
  search: 'Search',
  static: 'Static pages (About, Contact, etc.)',
}

function effectiveTitle(article: Article, o?: ArticleSEOOverride) {
  const t = o?.metaTitle?.trim()
  return t || article.title
}

function effectiveMeta(article: Article, o?: ArticleSEOOverride) {
  const m = o?.metaDescription?.trim()
  return m || article.excerpt || ''
}

function seoScore(article: Article, o?: ArticleSEOOverride): 'green' | 'yellow' | 'red' {
  const titleOk = effectiveTitle(article, o).length > 0 && effectiveTitle(article, o).length < 60
  const meta = effectiveMeta(article, o)
  const metaLen = meta.length
  const metaOk = metaLen >= 120 && metaLen <= 160
  const imgOk = Boolean(article.featuredImage?.trim())
  let fail = 0
  if (!titleOk) fail += 1
  if (!metaOk) fail += 1
  if (!imgOk) fail += 1
  if (fail === 0) return 'green'
  if (fail === 1) return 'yellow'
  return 'red'
}

function scoreCircleClass(score: 'green' | 'yellow' | 'red') {
  if (score === 'green') return 'bg-emerald-500'
  if (score === 'yellow') return 'bg-amber-400'
  return 'bg-red-500'
}

function generateMetaFromExcerpt(excerpt: string): string {
  const t = excerpt.trim().replace(/\s+/g, ' ')
  if (t.length <= 160) return t
  return `${t.slice(0, 157).trim()}…`
}

function socialLinksConfigured(social: SiteSettings['socialLinks']): boolean {
  const vals = Object.values(social)
  return vals.some((v) => typeof v === 'string' && v.length > 8 && (v.startsWith('http') || v.startsWith('mailto:')))
}

export default function SEODashboard() {
  const { can } = useAuth()
  const { settings, loading: seoLoading, saveSettings, overrides, saveOverride } = useSEO()
  const { articles, loading: articlesLoading, fetchArticles } = useArticles()
  const { settings: siteSettings, loading: siteLoading } = useSettings()

  const [form, setForm] = useState<GlobalSEOSettings>(settings)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<ArticleSEOOverride | null>(null)
  const [bulkWorking, setBulkWorking] = useState(false)

  useEffect(() => {
    void fetchArticles({ status: 'published' })
  }, [fetchArticles])

  useEffect(() => {
    if (!seoLoading) setForm(settings)
  }, [settings, seoLoading])

  const published = useMemo(
    () =>
      [...articles]
        .filter((a) => a.status === 'published')
        .sort((a, b) => (b.publishedAt ?? b.createdAt) - (a.publishedAt ?? a.createdAt)),
    [articles],
  )

  const checklist = useMemo(() => {
    const allMeta = published.every((a) => effectiveMeta(a, overrides[a.id]).trim().length > 0)
    const allImages = published.every((a) => Boolean(a.featuredImage?.trim()))
    const slugCounts = new Map<string, number>()
    for (const a of published) {
      slugCounts.set(a.slug, (slugCounts.get(a.slug) || 0) + 1)
    }
    const noDupSlugs = [...slugCounts.values()].every((c) => c === 1)
    const socialOk = socialLinksConfigured(siteSettings.socialLinks)
    const checks = [
      { id: 'meta', ok: allMeta, label: 'All articles have meta descriptions' },
      { id: 'img', ok: allImages, label: 'All articles have featured images' },
      { id: 'slug', ok: noDupSlugs, label: 'No duplicate slugs' },
      { id: 'social', ok: socialOk, label: 'Site has social media links configured' },
    ] as const
    const passed = checks.filter((c) => c.ok).length
    const pct = Math.round((passed / checks.length) * 100)
    return { checks, passed, pct }
  }, [published, overrides, siteSettings.socialLinks])

  const handleSaveGlobal = async () => {
    setSaving(true)
    try {
      await saveSettings(form)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const toggleRow = useCallback(
    (article: Article) => {
      if (expandedId === article.id) {
        setExpandedId(null)
        setEditDraft(null)
        return
      }
      const o = overrides[article.id]
      setExpandedId(article.id)
      setEditDraft({
        metaTitle: o?.metaTitle ?? '',
        metaDescription: o?.metaDescription ?? '',
        focusKeyphrase: o?.focusKeyphrase ?? '',
        noIndex: o?.noIndex ?? false,
      })
    },
    [expandedId, overrides],
  )

  const handleSaveArticleSeo = async (articleId: string) => {
    if (!editDraft) return
    await saveOverride(articleId, editDraft)
    setExpandedId(null)
    setEditDraft(null)
  }

  const handleBulkGenerate = async () => {
    const targets = published.filter((a) => {
      const m = effectiveMeta(a, overrides[a.id])
      return m.trim().length === 0 || m.length < 120 || m.length > 160
    })
    if (targets.length === 0) return
    setBulkWorking(true)
    try {
      for (const a of targets) {
        const gen = generateMetaFromExcerpt(a.excerpt || a.title)
        await saveOverride(a.id, { metaDescription: gen })
      }
    } finally {
      setBulkWorking(false)
    }
  }

  if (!can('manage_seo')) {
    return (
      <div className="text-center py-16">
        <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-700">Access Restricted</h2>
        <p className="text-sm text-gray-400 mt-1">You don&apos;t have permission to manage SEO.</p>
      </div>
    )
  }

  const loading = seoLoading || articlesLoading || siteLoading

  if (loading) {
    return <div className="text-gray-400 text-center py-16">Loading SEO tools…</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-7 h-7 text-primary" />
            SEO
          </h1>
          <p className="text-gray-500 text-sm mt-1">Site-wide settings, article metadata, and health checks</p>
        </div>
        <button
          type="button"
          onClick={handleSaveGlobal}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium disabled:opacity-50"
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : saving ? 'Saving…' : 'Save SEO settings'}
        </button>
      </div>

      {/* Site-wide */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Site-wide SEO settings</h2>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Default meta title template</label>
            <input
              type="text"
              value={form.defaultMetaTitleTemplate}
              onChange={(e) => setForm((p) => ({ ...p, defaultMetaTitleTemplate: e.target.value }))}
              placeholder="{page} | The Fastest Sector"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary"
            />
            <p className="text-xs text-gray-400 mt-1">Use {"{page}"} as a placeholder for the page title.</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Default meta description</label>
            <textarea
              value={form.defaultMetaDescription}
              onChange={(e) => setForm((p) => ({ ...p, defaultMetaDescription: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Open Graph image URL</label>
            <input
              type="url"
              value={form.ogImageUrl}
              onChange={(e) => setForm((p) => ({ ...p, ogImageUrl: e.target.value }))}
              placeholder="https://…"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Google Analytics tracking ID</label>
            <input
              type="text"
              value={form.googleAnalyticsId}
              onChange={(e) => setForm((p) => ({ ...p, googleAnalyticsId: e.target.value }))}
              placeholder="G-XXXXXXXXXX or UA-…"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Canonical URL base</label>
            <input
              type="url"
              value={form.canonicalUrlBase}
              onChange={(e) => setForm((p) => ({ ...p, canonicalUrlBase: e.target.value }))}
              placeholder="https://thefastestsector.com"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-primary"
            />
          </div>
          <div className="md:col-span-2">
            <p className="text-sm font-medium text-gray-700 mb-3">Robots: index / noindex by page type</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {(Object.keys(form.robotsDirectives) as (keyof GlobalSEOSettings['robotsDirectives'])[]).map((key) => (
                <label
                  key={key}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-gray-100 bg-gray-50"
                >
                  <span className="text-sm text-gray-700">{ROBOT_LABELS[key]}</span>
                  <span className="flex items-center gap-2 text-xs">
                    <span className={form.robotsDirectives[key] ? 'text-emerald-600 font-medium' : 'text-gray-400'}>Index</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={form.robotsDirectives[key]}
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          robotsDirectives: { ...p.robotsDirectives, [key]: !p.robotsDirectives[key] },
                        }))
                      }
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        form.robotsDirectives[key] ? 'bg-primary' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          form.robotsDirectives[key] ? 'translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Checklist */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-primary" />
          SEO checklist
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <ul className="space-y-2">
            {checklist.checks.map((c) => (
              <li key={c.id} className="flex items-center gap-2 text-sm">
                <span className={c.ok ? 'text-emerald-600' : 'text-red-500'}>{c.ok ? '✅' : '❌'}</span>
                <span className="text-gray-700">{c.label}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 border border-gray-100 px-8 py-4 min-w-[140px]">
            <span className="text-3xl font-black text-primary">{checklist.pct}%</span>
            <span className="text-xs text-gray-500 uppercase tracking-wide">Overall</span>
          </div>
        </div>
      </section>

      {/* Articles */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900">Article SEO overview</h2>
            <p className="text-sm text-gray-500 mt-0.5">Published articles — click a row to edit SEO metadata</p>
          </div>
          <button
            type="button"
            onClick={() => void handleBulkGenerate()}
            disabled={bulkWorking || published.length === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary/5 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {bulkWorking ? 'Generating…' : 'Generate meta descriptions'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 w-10" aria-hidden />
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Title</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Slug / URL</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Meta description</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 w-24">Score</th>
              </tr>
            </thead>
            <tbody>
              {published.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                    No published articles yet.
                  </td>
                </tr>
              ) : (
                published.map((article) => {
                  const o = overrides[article.id]
                  const meta = effectiveMeta(article, o)
                  const truncated = meta.length > 72 ? `${meta.slice(0, 72)}…` : meta
                  const score = seoScore(article, o)
                  const open = expandedId === article.id
                  const articlePublicUrl = new URL(
                    `article/${article.slug}`,
                    `${window.location.origin}${import.meta.env.BASE_URL}`,
                  ).href
                  return (
                    <Fragment key={article.id}>
                      <tr
                        className={`border-b border-gray-50 hover:bg-gray-50/80 cursor-pointer transition-colors ${
                          open ? 'bg-primary/5' : ''
                        }`}
                        onClick={() => toggleRow(article)}
                      >
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block w-3 h-3 rounded-full ${scoreCircleClass(score)}`}
                            title={score}
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px]">
                          <span className="line-clamp-2">{article.title}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-primary">
                            <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">/article/{article.slug}</code>
                            <a
                              href={articlePublicUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-0.5 hover:opacity-70"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 max-w-xs">
                          <span className="line-clamp-2">{truncated || '—'}</span>
                        </td>
                        <td className="px-4 py-3 capitalize text-gray-500">{score}</td>
                      </tr>
                      {open && editDraft && (
                        <tr key={`${article.id}-edit`} className="bg-gray-50/90">
                          <td colSpan={5} className="px-4 py-4">
                            <div
                              className="max-w-3xl space-y-4"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                              role="presentation"
                            >
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Edit SEO metadata</p>
                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Meta title</label>
                                  <input
                                    type="text"
                                    value={editDraft.metaTitle}
                                    onChange={(e) => setEditDraft((d) => (d ? { ...d, metaTitle: e.target.value } : d))}
                                    placeholder={article.title}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Focus keyphrase</label>
                                  <input
                                    type="text"
                                    value={editDraft.focusKeyphrase}
                                    onChange={(e) => setEditDraft((d) => (d ? { ...d, focusKeyphrase: e.target.value } : d))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Meta description</label>
                                  <textarea
                                    value={editDraft.metaDescription}
                                    onChange={(e) => setEditDraft((d) => (d ? { ...d, metaDescription: e.target.value } : d))}
                                    rows={3}
                                    placeholder={article.excerpt}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                  />
                                </div>
                                <div className="md:col-span-2 flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id={`noindex-${article.id}`}
                                    checked={editDraft.noIndex}
                                    onChange={(e) => setEditDraft((d) => (d ? { ...d, noIndex: e.target.checked } : d))}
                                    className="rounded border-gray-300"
                                  />
                                  <label htmlFor={`noindex-${article.id}`} className="text-sm text-gray-700">
                                    noindex this article
                                  </label>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => void handleSaveArticleSeo(article.id)}
                                  className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark"
                                >
                                  Save overrides
                                </button>
                                <Link
                                  to={`/admin/edit/${article.id}`}
                                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-white"
                                >
                                  Open in editor
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setExpandedId(null)
                                    setEditDraft(null)
                                  }}
                                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
