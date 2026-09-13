import { useCallback, useEffect, useState } from 'react'
import { format } from 'date-fns'
import { api } from '../../lib/api'
import { normalizeExternalUrl } from '../../lib/normalizeExternalUrl'
import MediaPicker from '../../components/admin/MediaPicker'
import {
  Eye,
  Megaphone,
  PlusCircle,
  Pencil,
  Trash2,
  ExternalLink,
  MousePointerClick,
  ImageIcon,
} from 'lucide-react'

type Ad = {
  id: string
  name: string
  placement: string
  imageUrl: string
  targetUrl: string
  html: string
  active: boolean
  startsAt: number | null
  endsAt: number | null
  impressions: number
  clicks: number
  createdAt: number
  updatedAt: number
}

type AdForm = {
  name: string
  placement: string
  imageUrl: string
  targetUrl: string
  active: boolean
  startsAt: string
  endsAt: string
}

const PLACEMENT_LABELS: Record<string, string> = {
  'article-sidebar': 'Article sidebar',
  home: 'Home page',
  'in-article': 'In article',
}

const EMPTY_AD_FORM: AdForm = {
  name: '',
  placement: 'article-sidebar',
  imageUrl: '',
  targetUrl: '',
  active: true,
  startsAt: '',
  endsAt: '',
}

function StatCard({
  icon: Icon,
  value,
  label,
  tint,
}: {
  icon: typeof Eye
  value: string | number
  label: string
  tint: string
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${tint}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  )
}

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const [form, setForm] = useState<AdForm>(EMPTY_AD_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)

  const loadAds = useCallback(async () => {
    try {
      const d = await api<{ ads: Ad[] }>('/api/ads')
      setAds(d.ads)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadAds()
  }, [loadAds])

  const openNew = () => {
    setForm(EMPTY_AD_FORM)
    setFormError('')
    setEditing('new')
  }

  const openEdit = (ad: Ad) => {
    setForm({
      name: ad.name,
      placement: ad.placement,
      imageUrl: ad.imageUrl,
      targetUrl: ad.targetUrl,
      active: ad.active,
      startsAt: ad.startsAt ? format(new Date(ad.startsAt), "yyyy-MM-dd'T'HH:mm") : '',
      endsAt: ad.endsAt ? format(new Date(ad.endsAt), "yyyy-MM-dd'T'HH:mm") : '',
    })
    setFormError('')
    setEditing(ad.id)
  }

  const save = async () => {
    if (!form.name.trim()) {
      setFormError('Give the ad a name.')
      return
    }
    if (!form.imageUrl.trim()) {
      setFormError('Add an ad image.')
      return
    }
    setSaving(true)
    setFormError('')
    const payload = {
      name: form.name.trim(),
      placement: form.placement,
      imageUrl: form.imageUrl.trim(),
      targetUrl: normalizeExternalUrl(form.targetUrl),
      active: form.active,
      startsAt: form.startsAt ? new Date(form.startsAt).getTime() : null,
      endsAt: form.endsAt ? new Date(form.endsAt).getTime() : null,
    }
    try {
      if (editing === 'new') {
        await api('/api/ads', { method: 'POST', body: JSON.stringify(payload) })
      } else if (editing) {
        await api(`/api/ads/${editing}`, { method: 'PATCH', body: JSON.stringify(payload) })
      }
      setEditing(null)
      await loadAds()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to save ad')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (ad: Ad) => {
    await api(`/api/ads/${ad.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ active: !ad.active }),
    }).catch(() => {})
    await loadAds()
  }

  const remove = async (ad: Ad) => {
    if (!confirm(`Delete ad "${ad.name}"?`)) return
    await api(`/api/ads/${ad.id}`, { method: 'DELETE' }).catch(() => {})
    await loadAds()
  }

  const totalImpressions = ads.reduce((n, a) => n + a.impressions, 0)
  const totalClicks = ads.reduce((n, a) => n + a.clicks, 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ads</h1>
        <p className="text-gray-500 text-sm mt-1">Create and run ads on the website</p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={Megaphone}
            value={ads.filter((a) => a.active).length}
            label="Active ads"
            tint="bg-blue-50 text-blue-600"
          />
          <StatCard
            icon={Eye}
            value={totalImpressions.toLocaleString()}
            label="Times shown"
            tint="bg-green-50 text-green-600"
          />
          <StatCard
            icon={MousePointerClick}
            value={totalClicks.toLocaleString()}
            label="Total clicks"
            tint="bg-amber-50 text-amber-600"
          />
        </div>

        <p className="text-xs text-gray-400 -mt-2">
          Click rate is the share of times an ad was clicked after being shown (also called CTR).
        </p>

        <div className="flex justify-end">
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
          >
            <PlusCircle className="w-4 h-4" />
            New Ad
          </button>
        </div>

        {editing && (
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-900">
              {editing === 'new' ? 'Create ad' : 'Edit ad'}
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Sponsor banner March"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Placement</label>
                <select
                  value={form.placement}
                  onChange={(e) => setForm({ ...form, placement: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {Object.entries(PLACEMENT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Ad image</label>
                <div className="flex items-center gap-3">
                  {form.imageUrl ? (
                    <img src={form.imageUrl} alt="" className="h-16 rounded-lg border border-gray-200 object-cover" />
                  ) : (
                    <div className="h-16 w-24 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-300">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <input
                      value={form.imageUrl}
                      onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                      placeholder="Image URL"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button
                      onClick={() => setPickerOpen(true)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Choose from media library
                    </button>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Target link (where clicks go)</label>
                <input
                  value={form.targetUrl}
                  onChange={(e) => setForm({ ...form, targetUrl: e.target.value })}
                  placeholder="https://sponsor.example.com or sponsor.example.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Starts (optional)</label>
                <input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Ends (optional)</label>
                <input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                <input
                  id="ad-active"
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="ad-active" className="text-sm text-gray-700">
                  Active (shown on the site)
                </label>
              </div>
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="flex items-center gap-2">
              <button
                onClick={save}
                disabled={saving}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Ad'}
              </button>
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-gray-500 hover:text-gray-900 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading ads...</div>
          ) : ads.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              No ads yet. Create one to start running ads on the site.
            </div>
          ) : (
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ad</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Placement</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th
                    className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    title="Times the ad was shown"
                  >
                    Shown
                  </th>
                  <th
                    className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    title="Times someone clicked the ad"
                  >
                    Clicks
                  </th>
                  <th
                    className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    title="Click-through rate: clicks ÷ times shown × 100"
                  >
                    Click rate
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ads.map((ad) => (
                  <tr key={ad.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {ad.imageUrl && (
                          <img src={ad.imageUrl} alt="" className="w-14 h-9 object-cover rounded" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{ad.name}</p>
                          {ad.targetUrl && (
                            <a
                              href={normalizeExternalUrl(ad.targetUrl)}
                              target="_blank"
                              rel="noopener"
                              className="text-[11px] text-gray-400 hover:text-primary inline-flex items-center gap-0.5"
                            >
                              {normalizeExternalUrl(ad.targetUrl).replace(/^https?:\/\//, '').slice(0, 40)}
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-600">
                      {PLACEMENT_LABELS[ad.placement] || ad.placement}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => toggleActive(ad)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          ad.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {ad.active ? 'Active' : 'Paused'}
                      </button>
                    </td>
                    <td
                      className="px-5 py-3 text-sm text-gray-700 text-right"
                      title="Times this ad was shown"
                    >
                      {ad.impressions.toLocaleString()}
                    </td>
                    <td
                      className="px-5 py-3 text-sm text-gray-700 text-right"
                      title="Times someone clicked this ad"
                    >
                      {ad.clicks.toLocaleString()}
                    </td>
                    <td
                      className="px-5 py-3 text-sm text-gray-700 text-right"
                      title={
                        ad.impressions > 0
                          ? `Click rate (CTR): ${ad.clicks} clicks ÷ ${ad.impressions} shown`
                          : 'Click rate (CTR): no views yet'
                      }
                    >
                      {ad.impressions > 0 ? `${((ad.clicks / ad.impressions) * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(ad)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => remove(ad)}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <MediaPicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          imagesOnly
          onSelect={(asset) => {
            setForm((f) => ({ ...f, imageUrl: asset.url }))
            setPickerOpen(false)
          }}
          title="Choose ad image"
        />
      </div>
    </div>
  )
}
