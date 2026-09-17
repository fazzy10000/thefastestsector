import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import { api } from '../../lib/api'
import { CATEGORY_LABELS, type Category } from '../../lib/types'
import Pagination from '../../components/Pagination'
import {
  BarChart3,
  Eye,
  Users,
  Mail,
  MousePointerClick,
} from 'lucide-react'

// ---------- Types ----------

type DailyPoint = { day: string; views: number; visitors: number }

type TrafficData = {
  days: number
  totals: { views: number; visitors: number }
  prevTotals: { views: number; visitors: number }
  daily: DailyPoint[]
  topPages: { path: string; slug: string; title: string; views: number }[]
  referrers: { referrer: string; views: number }[]
  countries: { country: string; views: number; visitors: number }[]
  devices: { device: string; views: number }[]
  byWeekday: { weekday: number; views: number }[]
  byHour: { hour: number; views: number }[]
}

type InsightsData = {
  allTime: { views: number; visitors: number }
  bestDay: { day: string; views: number } | null
  byCategory: { category: string; views: number }[]
  byAuthor: { author: string; views: number }[]
  monthlyPosts: { month: string; posts: number }[]
  subscriberCount: number
  trackingSince: number | null
}

type Subscriber = {
  id: string
  email: string
  source: string
  edition: string
  status: string
  createdAt: number
}

const TABS = ['traffic', 'insights', 'subscribers'] as const
type Tab = (typeof TABS)[number]

const TAB_LABELS: Record<Tab, string> = {
  traffic: 'Traffic',
  insights: 'Insights',
  subscribers: 'Subscribers',
}

// ---------- Small shared UI ----------

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

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <h3 className="text-sm font-bold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  )
}

const CHART_HEIGHT = 176

function BarChart({ points, metric }: { points: DailyPoint[]; metric: 'views' | 'visitors' }) {
  const max = Math.max(1, ...points.map((p) => p[metric]))
  const total = points.reduce((n, p) => n + p[metric], 0)
  if (points.length === 0 || total === 0) {
    return (
      <p className="text-sm text-gray-400 py-10 text-center">
        No {metric} recorded in this period yet. Data appears as visitors browse the site.
      </p>
    )
  }
  return (
    <div>
      <div className="flex items-end gap-[2px]" style={{ height: CHART_HEIGHT }}>
        {points.map((p) => {
          const value = p[metric]
          const px = value > 0 ? Math.max(4, (value / max) * (CHART_HEIGHT - 16)) : 2
          return (
            <div
              key={p.day}
              className="flex-1 min-w-[3px] flex items-end"
              style={{ height: CHART_HEIGHT }}
              title={`${format(new Date(p.day), 'EEE MMM d')}: ${p.views} views, ${p.visitors} visitors`}
            >
              <div
                className={`w-full rounded-t transition-colors ${
                  value > 0 ? 'bg-primary/80 hover:bg-primary' : 'bg-gray-200'
                }`}
                style={{ height: px }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-gray-400">
        <span>{format(new Date(points[0].day), 'MMM d')}</span>
        <span>{format(new Date(points[points.length - 1].day), 'MMM d')}</span>
      </div>
    </div>
  )
}

function ChangeBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) {
    if (current === 0) return null
    return (
      <span className="text-[11px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">New</span>
    )
  }
  const pct = ((current - previous) / previous) * 100
  const up = pct >= 0
  return (
    <span
      className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${
        up ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
      }`}
      title="Compared with the previous period"
    >
      {up ? '+' : ''}
      {pct.toFixed(0)}%
    </span>
  )
}

function MiniColumnChart({
  columns,
}: {
  columns: { label: string; value: number; highlight?: boolean }[]
}) {
  const max = Math.max(1, ...columns.map((c) => c.value))
  return (
    <div className="flex items-end gap-1.5" style={{ height: 112 }}>
      {columns.map((c, i) => (
        <div
          key={`${c.label}-${i}`}
          className="flex-1 flex flex-col items-center justify-end gap-1"
          style={{ height: 112 }}
          title={`${c.label}: ${c.value.toLocaleString()} views`}
        >
          <div
            className={`w-full rounded-t ${
              c.value === 0 ? 'bg-gray-200' : c.highlight ? 'bg-primary' : 'bg-primary/50'
            }`}
            style={{ height: c.value > 0 ? Math.max(4, (c.value / max) * 80) : 2 }}
          />
          <span className="text-[9px] text-gray-400 whitespace-nowrap">{c.label}</span>
        </div>
      ))}
    </div>
  )
}

function flagFromAlpha2(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return '🏁'
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}

const regionNames =
  typeof Intl !== 'undefined' && 'DisplayNames' in Intl
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null

function countryName(code: string): string {
  try {
    return regionNames?.of(code) || code
  } catch {
    return code
  }
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function HBarList({
  rows,
  emptyText,
}: {
  rows: { label: string; value: number; to?: string }[]
  emptyText: string
}) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  if (rows.length === 0) return <p className="text-sm text-gray-400 py-4">{emptyText}</p>
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="relative rounded-md overflow-hidden bg-gray-50">
          <div
            className="absolute inset-y-0 left-0 bg-primary/10"
            style={{ width: `${(r.value / max) * 100}%` }}
          />
          <div className="relative flex items-center justify-between px-3 py-2 text-sm">
            {r.to ? (
              <Link to={r.to} className="text-gray-800 hover:text-primary truncate pr-3" target="_blank">
                {r.label}
              </Link>
            ) : (
              <span className="text-gray-800 truncate pr-3">{r.label}</span>
            )}
            <span className="font-bold text-gray-900 flex-none">{r.value.toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------- Traffic tab ----------

function TrafficTab() {
  const [days, setDays] = useState(30)
  const [data, setData] = useState<TrafficData | null>(null)
  const [loading, setLoading] = useState(true)
  const [metric, setMetric] = useState<'views' | 'visitors'>('views')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api<TrafficData>(`/api/stats/traffic?days=${days}`)
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [days])

  // Fill missing days so the chart shows a continuous timeline
  const filledDaily = useMemo(() => {
    if (!data) return []
    const byDay = new Map(data.daily.map((d) => [d.day, d]))
    const out: DailyPoint[] = []
    for (let i = days - 1; i >= 0; i--) {
      const day = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10)
      out.push(byDay.get(day) || { day, views: 0, visitors: 0 })
    }
    return out
  }, [data, days])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm w-fit">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              days === d ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {d} days
          </button>
        ))}
      </div>

      {loading && !data ? (
        <div className="p-8 text-center text-gray-400">Loading traffic...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-gray-900">
                      {(data?.totals.views || 0).toLocaleString()}
                    </p>
                    <ChangeBadge
                      current={data?.totals.views || 0}
                      previous={data?.prevTotals.views || 0}
                    />
                  </div>
                  <p className="text-xs text-gray-500">Views</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-green-50 text-green-600">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-gray-900">
                      {(data?.totals.visitors || 0).toLocaleString()}
                    </p>
                    <ChangeBadge
                      current={data?.totals.visitors || 0}
                      previous={data?.prevTotals.visitors || 0}
                    />
                  </div>
                  <p className="text-xs text-gray-500">Visitors</p>
                </div>
              </div>
            </div>
            <StatCard
              icon={BarChart3}
              value={((data?.totals.views || 0) / days).toFixed(1)}
              label="Avg views per day"
              tint="bg-amber-50 text-amber-600"
            />
            <StatCard
              icon={MousePointerClick}
              value={
                (data?.totals.visitors || 0) > 0
                  ? ((data!.totals.views || 0) / data!.totals.visitors).toFixed(1)
                  : '—'
              }
              label="Views per visitor"
              tint="bg-purple-50 text-purple-600"
            />
          </div>

          <p className="text-xs text-gray-400 -mt-2">
            Change badges compare with the previous {days} days.
          </p>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900">
                {metric === 'views' ? 'Views' : 'Visitors'} per day
              </h3>
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                {(['views', 'visitors'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMetric(m)}
                    className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                      metric === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <BarChart points={filledDaily} metric={metric} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Panel title="Top posts & pages">
              <HBarList
                emptyText="No page views yet."
                rows={(data?.topPages || []).map((p) => ({
                  label: p.title || p.path,
                  value: p.views,
                  to: p.path,
                }))}
              />
            </Panel>
            <Panel title="Referrers">
              <HBarList
                emptyText="No external referrers yet. Views from direct visits and internal navigation are not listed here."
                rows={(data?.referrers || []).map((r) => ({ label: r.referrer, value: r.views }))}
              />
            </Panel>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Panel title="Countries">
              <HBarList
                emptyText="No country data yet. Countries are detected on new views going forward."
                rows={(data?.countries || []).map((c) => ({
                  label: `${flagFromAlpha2(c.country)} ${countryName(c.country)}`,
                  value: c.views,
                }))}
              />
            </Panel>
            <Panel title="Devices">
              <HBarList
                emptyText="No device data yet. Devices are detected on new views going forward."
                rows={(data?.devices || []).map((d) => ({
                  label: d.device.charAt(0).toUpperCase() + d.device.slice(1),
                  value: d.views,
                }))}
              />
            </Panel>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Panel title="Views by day of week">
              {(() => {
                const byDay = new Map((data?.byWeekday || []).map((w) => [w.weekday, w.views]))
                const best = Math.max(0, ...(data?.byWeekday || []).map((w) => w.views))
                return (
                  <MiniColumnChart
                    columns={WEEKDAY_LABELS.map((label, i) => ({
                      label,
                      value: byDay.get(i) || 0,
                      highlight: best > 0 && (byDay.get(i) || 0) === best,
                    }))}
                  />
                )
              })()}
            </Panel>
            <Panel title="Views by hour (UTC)">
              {(() => {
                const byHour = new Map((data?.byHour || []).map((h) => [h.hour, h.views]))
                const best = Math.max(0, ...(data?.byHour || []).map((h) => h.views))
                return (
                  <MiniColumnChart
                    columns={Array.from({ length: 24 }, (_, h) => ({
                      label: h % 6 === 0 ? `${h}` : '',
                      value: byHour.get(h) || 0,
                      highlight: best > 0 && (byHour.get(h) || 0) === best,
                    }))}
                  />
                )
              })()}
            </Panel>
          </div>
        </>
      )}
    </div>
  )
}

// ---------- Insights tab ----------

function InsightsTab() {
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<InsightsData>('/api/stats/insights')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-center text-gray-400">Loading insights...</div>

  const maxPosts = Math.max(1, ...(data?.monthlyPosts || []).map((m) => m.posts))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Eye}
          value={(data?.allTime.views || 0).toLocaleString()}
          label="All-time views"
          tint="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={Users}
          value={(data?.allTime.visitors || 0).toLocaleString()}
          label="All-time visitors"
          tint="bg-green-50 text-green-600"
        />
        <StatCard
          icon={BarChart3}
          value={data?.bestDay ? data.bestDay.views.toLocaleString() : '—'}
          label={
            data?.bestDay ? `Best day (${format(new Date(data.bestDay.day), 'MMM d, yyyy')})` : 'Best day'
          }
          tint="bg-amber-50 text-amber-600"
        />
        <StatCard
          icon={Mail}
          value={(data?.subscriberCount || 0).toLocaleString()}
          label="Newsletter subscribers"
          tint="bg-purple-50 text-purple-600"
        />
      </div>

      {data?.trackingSince && (
        <p className="text-xs text-gray-400">
          Tracking views since {format(new Date(data.trackingSince), 'MMMM d, yyyy')}.
        </p>
      )}

      <Panel title="Posting activity (published articles per month)">
        {(data?.monthlyPosts || []).length === 0 ? (
          <p className="text-sm text-gray-400 py-4">No published articles yet.</p>
        ) : (
          <div className="flex items-end gap-2" style={{ height: 128 }}>
            {(data?.monthlyPosts || []).map((m) => (
              <div
                key={m.month}
                className="flex-1 flex flex-col items-center justify-end gap-1"
                style={{ height: 128 }}
                title={`${m.month}: ${m.posts} posts`}
              >
                <span className="text-[10px] font-bold text-gray-600">{m.posts}</span>
                <div
                  className="w-full bg-primary/70 rounded-t"
                  style={{ height: Math.max(4, (m.posts / maxPosts) * 88) }}
                />
                <span className="text-[9px] text-gray-400">{format(new Date(`${m.month}-01`), 'MMM yy')}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title="Views by category">
          <HBarList
            emptyText="No article views tracked yet."
            rows={(data?.byCategory || []).map((c) => ({
              label: CATEGORY_LABELS[c.category as Category] || c.category,
              value: c.views,
            }))}
          />
        </Panel>
        <Panel title="Most viewed authors">
          <HBarList
            emptyText="No article views tracked yet."
            rows={(data?.byAuthor || []).map((a) => ({ label: a.author, value: a.views }))}
          />
        </Panel>
      </div>
    </div>
  )
}

// ---------- Subscribers tab ----------

function SubscribersTab() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [chartSubs, setChartSubs] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const PAGE_SIZE = 50

  useEffect(() => {
    // Full list once for growth chart / last-30 (usually small); table is paginated separately.
    api<{ subscribers: Subscriber[]; total?: number }>('/api/newsletter-subscribers')
      .then((d) => setChartSubs(d.subscribers))
      .catch(() => setChartSubs([]))
  }, [])

  useEffect(() => {
    setLoading(true)
    api<{ subscribers: Subscriber[]; total?: number }>(
      `/api/newsletter-subscribers?page=${page}&limit=${PAGE_SIZE}`,
    )
      .then((d) => {
        setSubscribers(d.subscribers)
        setTotal(d.total ?? d.subscribers.length)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load subscribers'))
      .finally(() => setLoading(false))
  }, [page])

  const monthly = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of chartSubs) {
      const key = format(new Date(s.createdAt), 'yyyy-MM')
      map.set(key, (map.get(key) || 0) + 1)
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, count]) => ({ month, count }))
  }, [chartSubs])

  const last30 = chartSubs.filter((s) => s.createdAt >= Date.now() - 30 * 86_400_000).length
  const maxMonthly = Math.max(1, ...monthly.map((m) => m.count))

  if (loading && subscribers.length === 0)
    return <div className="p-8 text-center text-gray-400">Loading subscribers...</div>
  if (error)
    return (
      <div className="p-8 text-center text-gray-400">
        {error.includes('Forbidden') ? 'Your role does not have access to subscriber data.' : error}
      </div>
    )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={Mail}
          value={(chartSubs.length || total).toLocaleString()}
          label="Total subscribers"
          tint="bg-purple-50 text-purple-600"
        />
        <StatCard
          icon={Users}
          value={last30.toLocaleString()}
          label="New in last 30 days"
          tint="bg-green-50 text-green-600"
        />
      </div>

      <Panel title="Subscriber growth (signups per month)">
        {monthly.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">No subscribers yet.</p>
        ) : (
          <div className="flex items-end gap-2" style={{ height: 128 }}>
            {monthly.map((m) => (
              <div
                key={m.month}
                className="flex-1 flex flex-col items-center justify-end gap-1"
                style={{ height: 128 }}
                title={`${m.month}: ${m.count}`}
              >
                <span className="text-[10px] font-bold text-gray-600">{m.count}</span>
                <div
                  className="w-full bg-primary/70 rounded-t"
                  style={{ height: Math.max(4, (m.count / maxMonthly) * 88) }}
                />
                <span className="text-[9px] text-gray-400">{format(new Date(`${m.month}-01`), 'MMM yy')}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Recent subscribers</h3>
          <Link to="/admin/newsletter" className="text-xs font-medium text-primary hover:underline">
            Manage newsletters
          </Link>
        </div>
        {subscribers.length === 0 ? (
          <p className="p-8 text-center text-gray-400 text-sm">No subscribers yet.</p>
        ) : (
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Edition</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr key={s.id} className="border-b border-gray-50">
                  <td className="px-5 py-3 text-sm text-gray-800">{s.email}</td>
                  <td className="px-5 py-3 text-xs text-gray-500 capitalize">{s.source}</td>
                  <td className="px-5 py-3 text-xs text-gray-500 capitalize">{s.edition}</td>
                  <td className="px-5 py-3 text-xs capitalize">
                    <span
                      className={
                        s.status === 'unsubscribed'
                          ? 'text-red-600'
                          : 'text-green-700'
                      }
                    >
                      {s.status === 'unsubscribed' ? 'Unsubscribed' : 'Active'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400">
                    {format(new Date(s.createdAt), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="px-5 py-3 border-t border-gray-100">
          <Pagination
            variant="admin"
            page={page}
            total={total}
            pageSize={PAGE_SIZE}
            onChange={setPage}
          />
        </div>
      </div>
    </div>
  )
}

// ---------- Page ----------

export default function StatsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')

  // Old bookmarks: Ads used to live under Stats
  if (tabParam === 'ads') return <Navigate to="/admin/ads" replace />

  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : 'traffic'

  const setTab = (t: Tab) => {
    setSearchParams(t === 'traffic' ? {} : { tab: t }, { replace: true })
  }

  return (
    <div>
      <div className="mb-6" data-tour="stats-header">
        <h1 className="text-2xl font-bold text-gray-900">Traffic & Insights</h1>
        <p className="text-gray-500 text-sm mt-1">Traffic, insights, and subscribers</p>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-6 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                tab === t
                  ? 'border-primary text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {tab === 'traffic' && <TrafficTab />}
      {tab === 'insights' && <InsightsTab />}
      {tab === 'subscribers' && <SubscribersTab />}
    </div>
  )
}
