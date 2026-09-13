import { useState, useEffect, useMemo } from 'react'
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Search,
  Map as MapIcon,
  Globe,
  Newspaper,
  Tags,
  Gamepad2,
  FileText,
  List as ListIcon,
  Network,
} from 'lucide-react'
import Pagination from '../../components/Pagination'
import type { LucideIcon } from 'lucide-react'

interface SitemapUrl {
  loc: string
  lastmod?: string
  path: string
}

interface SectionDef {
  id: string
  label: string
  hint: string
  icon: LucideIcon
  /** Colored accent bar on top of the section card */
  accent: string
  /** Icon chip background + icon color */
  chipBg: string
  chipText: string
}

const INTERACTIVE_SEGMENTS = new Set(['interactive', 'quizzes', 'games', 'sector-sweep'])

const SECTION_DEFS: SectionDef[] = [
  {
    id: 'article',
    label: 'Articles',
    hint: '/article/…',
    icon: Newspaper,
    accent: 'bg-red-500',
    chipBg: 'bg-red-50',
    chipText: 'text-red-600',
  },
  {
    id: 'category',
    label: 'Categories',
    hint: '/category/…',
    icon: Tags,
    accent: 'bg-blue-500',
    chipBg: 'bg-blue-50',
    chipText: 'text-blue-600',
  },
  {
    id: 'interactive',
    label: 'Interactive',
    hint: 'quizzes · games · polls',
    icon: Gamepad2,
    accent: 'bg-purple-500',
    chipBg: 'bg-purple-50',
    chipText: 'text-purple-600',
  },
  {
    id: 'pages',
    label: 'Pages',
    hint: 'standalone pages',
    icon: FileText,
    accent: 'bg-gray-400',
    chipBg: 'bg-gray-100',
    chipText: 'text-gray-600',
  },
]

function classify(path: string): string {
  const seg = path.split('/').filter(Boolean)[0] ?? ''
  if (seg === 'article') return 'article'
  if (seg === 'category') return 'category'
  if (INTERACTIVE_SEGMENTS.has(seg)) return 'interactive'
  return 'pages'
}

function leafLabel(path: string, sectionId: string): string {
  if (path === '/') return '/ (home)'
  if (sectionId === 'article' || sectionId === 'category') {
    const rest = path.split('/').filter(Boolean).slice(1).join('/')
    return decodeURIComponent(rest || path)
  }
  return decodeURIComponent(path)
}

const INITIAL_VISIBLE = 12
const SHOW_MORE_STEP = 48
const LIST_PAGE_SIZE = 25

/** Thin connector line, remapped automatically in admin dark mode via .bg-gray-200 */
const LINE = 'bg-gray-200'

export default function SitemapPage() {
  const [urls, setUrls] = useState<SitemapUrl[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'tree' | 'list'>('tree')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({})
  const [listPages, setListPages] = useState<Record<string, number>>({})

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch('/sitemap.xml')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const text = await res.text()
        const doc = new DOMParser().parseFromString(text, 'application/xml')
        if (doc.querySelector('parsererror')) throw new Error('Invalid XML')
        const parsed = Array.from(doc.getElementsByTagName('url'))
          .map((el) => {
            const loc = el.getElementsByTagName('loc')[0]?.textContent?.trim() ?? ''
            let path = ''
            try {
              path = new URL(loc).pathname
            } catch {
              path = loc
            }
            return {
              loc,
              lastmod: el.getElementsByTagName('lastmod')[0]?.textContent?.trim() || undefined,
              path,
            }
          })
          .filter((u) => u.loc)
        if (!cancelled) {
          setUrls(parsed)
          setError(null)
        }
      } catch {
        if (!cancelled) setError('Could not load or parse /sitemap.xml.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const isSearching = query.trim().length > 0

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SECTION_DEFS.map((def) => {
      const all = urls.filter((u) => classify(u.path) === def.id)
      // Articles newest-first, everything else alphabetical
      if (def.id === 'article') {
        all.sort((a, b) => (b.lastmod ?? '').localeCompare(a.lastmod ?? ''))
      } else {
        all.sort((a, b) => a.path.localeCompare(b.path))
      }
      const matched = q ? all.filter((u) => u.loc.toLowerCase().includes(q)) : all
      return { def, total: all.length, urls: matched }
    }).filter((s) => s.total > 0)
  }, [urls, query])

  const visibleSections = isSearching ? sections.filter((s) => s.urls.length > 0) : sections
  const matchCount = sections.reduce((sum, s) => sum + s.urls.length, 0)

  const isOpen = (s: (typeof sections)[number]) =>
    isSearching ? s.urls.length > 0 : (expanded[s.def.id] ?? s.total <= INITIAL_VISIBLE)

  const toggle = (s: (typeof sections)[number]) => {
    const open = isOpen(s)
    setExpanded((p) => ({ ...p, [s.def.id]: !open }))
  }

  const visibleFor = (id: string) => visibleCounts[id] ?? INITIAL_VISIBLE

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Sitemap</h1>
        <p className="text-gray-500 text-sm mt-1">
          Viewing the generated <code>/sitemap.xml</code>. It regenerates on every build (
          <code>npm run sitemap</code>).
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500 text-sm">
          Loading sitemap...
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="text-gray-900 font-medium">{error}</p>
          <p className="text-gray-500 text-sm mt-2">
            The sitemap is generated at build time — run <code>npm run sitemap</code> (or a full
            build) and redeploy if it's missing or stale.
          </p>
        </div>
      ) : (
        <>
          {/* Summary + search + view toggle */}
          <div className="bg-white rounded-xl shadow-sm p-5 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-lg">
                  <MapIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{urls.length}</p>
                  <p className="text-gray-500 text-xs">
                    URLs in sitemap{isSearching ? ` · ${matchCount} matching` : ''}
                  </p>
                </div>
              </div>
              <div className="relative flex-1 sm:max-w-md sm:ml-auto">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter URLs..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex rounded-lg border border-gray-200 overflow-hidden flex-none self-start sm:self-auto">
                <button
                  onClick={() => setView('tree')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                    view === 'tree' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <Network className="w-3.5 h-3.5" />
                  Tree
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                    view === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <ListIcon className="w-3.5 h-3.5" />
                  List
                </button>
              </div>
            </div>
          </div>

          {visibleSections.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500 text-sm">
              No URLs match "{query}".
            </div>
          ) : view === 'tree' ? (
            <div className="overflow-x-auto pb-4">
              <div className="min-w-[760px]">
                {/* Root node */}
                <div className="flex justify-center">
                  <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-gray-900 text-white rounded-xl shadow-md px-5 py-3.5 hover:shadow-lg transition-shadow"
                  >
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Globe className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <p className="font-bold text-sm leading-tight">thefastestsector.com</p>
                      <p className="text-[11px] text-white/60">{urls.length} URLs</p>
                    </div>
                  </a>
                </div>

                {/* Trunk from root down to the branch line */}
                <div className={`mx-auto w-px h-8 ${LINE}`} />

                {/* Section columns */}
                <div className="flex justify-center items-start">
                  {visibleSections.map((s, i) => {
                    const open = isOpen(s)
                    const visible = visibleFor(s.def.id)
                    const shown = s.urls.slice(0, visible)
                    const remaining = s.urls.length - shown.length
                    const Icon = s.def.icon
                    const single = visibleSections.length === 1
                    return (
                      <div key={s.def.id} className="w-64 px-2 min-w-0 flex-none">
                        {/* Connector: horizontal branch line + vertical stub down to card */}
                        <div className="relative h-8">
                          {!single && (
                            <div
                              className={`absolute top-0 h-px ${LINE} ${
                                i === 0
                                  ? 'left-1/2 right-0 -mr-2'
                                  : i === visibleSections.length - 1
                                    ? 'left-0 right-1/2 -ml-2'
                                    : 'left-0 right-0 -mx-2'
                              }`}
                            />
                          )}
                          <div className={`absolute top-0 left-1/2 w-px h-full ${LINE}`} />
                        </div>

                        {/* Section node card */}
                        <button
                          onClick={() => toggle(s)}
                          className="w-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden text-left hover:shadow-md transition-shadow"
                        >
                          <div className={`h-1 ${s.def.accent}`} />
                          <div className="p-3.5 flex items-center gap-2.5">
                            <div className={`p-2 rounded-lg flex-none ${s.def.chipBg}`}>
                              <Icon className={`w-4 h-4 ${s.def.chipText}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-gray-900 text-sm leading-tight">
                                {s.def.label}
                              </p>
                              <p className="text-[11px] text-gray-400 truncate">{s.def.hint}</p>
                            </div>
                            <span className="text-xs font-semibold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5 flex-none">
                              {isSearching && s.urls.length !== s.total
                                ? `${s.urls.length}/${s.total}`
                                : s.total}
                            </span>
                            {open ? (
                              <ChevronDown className="w-4 h-4 text-gray-400 flex-none" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400 flex-none" />
                            )}
                          </div>
                        </button>

                        {/* Children (leaf cards on a branch) */}
                        {open && (
                          <div className="pl-4">
                            {shown.map((u, idx) => {
                              const isLastRow = idx === shown.length - 1 && remaining <= 0
                              return (
                                <div key={u.loc} className="relative pt-2 flex items-center">
                                  <div
                                    className={`absolute left-0 top-0 w-px ${LINE} ${
                                      isLastRow ? 'h-[calc(50%+4px)]' : 'h-full'
                                    }`}
                                  />
                                  <div className={`w-3 h-px flex-none ${LINE}`} />
                                  <a
                                    href={u.loc}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex-1 min-w-0 flex items-center gap-2 bg-white border border-gray-100 rounded-lg shadow-sm px-3 py-1.5 hover:border-gray-300 transition-colors"
                                  >
                                    <span className="min-w-0 flex-1">
                                      <span
                                        className="block truncate text-xs text-gray-700 group-hover:text-gray-900"
                                        title={u.path}
                                      >
                                        {leafLabel(u.path, s.def.id)}
                                      </span>
                                      {u.lastmod && (
                                        <span className="block text-[10px] text-gray-400">
                                          {u.lastmod.slice(0, 10)}
                                        </span>
                                      )}
                                    </span>
                                    <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-gray-400 flex-none" />
                                  </a>
                                </div>
                              )
                            })}
                            {remaining > 0 && (
                              <div className="relative pt-2 flex items-center">
                                <div
                                  className={`absolute left-0 top-0 w-px h-[calc(50%+4px)] ${LINE}`}
                                />
                                <div className={`w-3 h-px flex-none ${LINE}`} />
                                <button
                                  onClick={() =>
                                    setVisibleCounts((p) => ({
                                      ...p,
                                      [s.def.id]: visible + SHOW_MORE_STEP,
                                    }))
                                  }
                                  className="flex-1 text-left border border-dashed border-gray-300 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                                >
                                  Show more ({remaining} hidden)
                                </button>
                              </div>
                            )}
                            {shown.length > INITIAL_VISIBLE && (
                              <button
                                onClick={() =>
                                  setVisibleCounts((p) => ({
                                    ...p,
                                    [s.def.id]: INITIAL_VISIBLE,
                                  }))
                                }
                                className="mt-2 ml-3 text-[11px] font-medium text-gray-400 hover:text-gray-700 transition-colors"
                              >
                                Show less
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* List view (previous style, grouped by section) */
            <div className="space-y-3">
              {visibleSections.map((s) => {
                const open = isOpen(s)
                const Icon = s.def.icon
                return (
                  <div key={s.def.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <button
                      onClick={() => toggle(s)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="flex items-center gap-2.5 font-semibold text-gray-900 text-sm">
                        {open ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                        <span className={`p-1.5 rounded-md ${s.def.chipBg}`}>
                          <Icon className={`w-3.5 h-3.5 ${s.def.chipText}`} />
                        </span>
                        {s.def.label}
                      </span>
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-2.5 py-1">
                        {s.urls.length}
                      </span>
                    </button>
                    {open && (
                      <>
                        <ul className="border-t border-gray-100 divide-y divide-gray-50">
                          {s.urls
                            .slice(
                              ((listPages[s.def.id] ?? 1) - 1) * LIST_PAGE_SIZE,
                              (listPages[s.def.id] ?? 1) * LIST_PAGE_SIZE,
                            )
                            .map((u) => (
                            <li key={u.loc}>
                              <a
                                href={u.loc}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors"
                              >
                                <span className="truncate">{u.path}</span>
                                <span className="flex items-center gap-3 flex-none">
                                  {u.lastmod && (
                                    <span className="text-xs text-gray-400">
                                      {u.lastmod.slice(0, 10)}
                                    </span>
                                  )}
                                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                                </span>
                              </a>
                            </li>
                          ))}
                        </ul>
                        <div className="px-5 py-3 border-t border-gray-100">
                          <Pagination
                            variant="admin"
                            page={listPages[s.def.id] ?? 1}
                            total={s.urls.length}
                            pageSize={LIST_PAGE_SIZE}
                            onChange={(p) =>
                              setListPages((prev) => ({ ...prev, [s.def.id]: p }))
                            }
                          />
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
