import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Search, Moon, Sun, Menu, X, User, ChevronDown } from 'lucide-react'
import { useDarkMode } from '../hooks/useDarkMode'
import { useSettings } from '../hooks/useSettings'
import SocialIcons from './SocialIcons'

interface NavLink {
  label: string
  href: string
}

interface NavColumn {
  heading: string
  links: NavLink[]
}

interface NavItem {
  label: string
  href: string
  activePaths?: string[]
  columns?: NavColumn[]
}

function seriesNav(label: string, categoryHref: string): NavItem {
  return {
    label,
    href: categoryHref,
    columns: [
      {
        heading: 'Explore',
        links: [
          { label: 'News', href: categoryHref },
          { label: 'Results', href: `${categoryHref}?tab=results` },
          { label: 'Features', href: `${categoryHref}?tab=features` },
        ],
      },
    ],
  }
}

const NAV_CONFIG: NavItem[] = [
  { label: 'HOME', href: '/' },
  seriesNav('F1', '/category/formula-1'),
  seriesNav('FEEDER SERIES', '/category/feeder-series'),
  seriesNav('F1 ACADEMY', '/category/f1-academy'),
  seriesNav('INDYCAR', '/category/indycar'),
  seriesNav('FORMULA E', '/category/formula-e'),
  {
    label: 'INTERACTIVE',
    href: '/interactive',
    activePaths: ['/interactive', '/quizzes', '/quiz', '/games'],
    columns: [
      {
        heading: 'Play',
        links: [
          { label: 'Quizzes', href: '/quizzes' },
          { label: 'Games', href: '/games' },
          { label: 'Fan Poll', href: '/interactive/polls' },
        ],
      },
    ],
  },
  {
    label: 'SECTOR SWEEP',
    href: '/sector-sweep',
    columns: [
      {
        heading: 'Newsletter',
        links: [
          { label: 'Subscribe', href: '/sector-sweep#subscribe' },
          { label: 'Latest Edition', href: '/sector-sweep#latest' },
        ],
      },
    ],
  },
  {
    label: 'ABOUT US',
    href: '/about',
    activePaths: ['/about', '/contact', '/join', '/privacy', '/terms'],
    columns: [
      {
        heading: 'About',
        links: [
          { label: 'Meet the Team', href: '/about' },
          { label: 'Join Us', href: '/join' },
          { label: 'Contact Us', href: '/contact' },
        ],
      },
    ],
  },
]

function isNavActive(item: NavItem, pathname: string): boolean {
  if (item.activePaths) {
    return item.activePaths.some((p) => pathname === p || pathname.startsWith(p + '/'))
  }
  if (item.href === '/') return pathname === '/'
  return pathname === item.href || pathname.startsWith(item.href + '/')
}

export default function Navbar() {
  const { dark, toggle: toggleDark } = useDarkMode()
  const { settings } = useSettings()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null)
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
      setMobileOpen(false)
    }
  }

  const activeMegaColumns = NAV_CONFIG.find((n) => n.label === activeMegaMenu)?.columns

  return (
    <header
      className="bg-surface-dark text-text-on-dark sticky top-0 z-50"
      onMouseLeave={() => setActiveMegaMenu(null)}
    >
      {/* ── Row 1: Top bar ── */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-2 grid grid-cols-3 items-center">
          {/* Left: social icons */}
          <SocialIcons links={settings.socialLinks} />

          {/* Center: logo + wordmark */}
          <div className="flex justify-center">
            <Link to="/" className="flex items-center gap-2">
              <img src="/tfs-logo.png" alt="The Fastest Sector" className="w-8 h-8 rounded-full" />
              <span className="hidden sm:block text-left">
                <span className="block font-black tracking-tight text-sm leading-tight">
                  THE FASTEST <span className="text-primary">SECTOR</span>
                </span>
                <span className="block text-[10px] text-white/50 leading-tight">
                  {settings.siteTagline}
                </span>
              </span>
            </Link>
          </div>

          {/* Right: controls + newsletter */}
          <div className="flex items-center gap-1 justify-end">
            <button
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search"
              className="p-1.5 hover:text-primary transition-colors hidden md:block"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={toggleDark}
              aria-label="Toggle dark mode"
              className="p-1.5 hover:text-primary transition-colors hidden md:block"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link
              to="/admin"
              aria-label="Account"
              className="p-1.5 hover:text-primary transition-colors hidden md:block"
            >
              <User className="w-4 h-4" />
            </Link>
            <Link
              to="/sector-sweep"
              className="hidden md:inline-flex items-center ml-2 px-4 py-1.5 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-primary-dark transition-colors"
            >
              Newsletter
            </Link>
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-1.5"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Row 2: Main nav (desktop) ── */}
      <div className="relative">
        <nav className="border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4">
            <ul className="hidden md:flex items-center">
              {NAV_CONFIG.map((item) => {
                const active = isNavActive(item, location.pathname)
                return (
                  <li
                    key={item.label}
                    onMouseEnter={() =>
                      item.columns ? setActiveMegaMenu(item.label) : setActiveMegaMenu(null)
                    }
                  >
                    <Link
                      to={item.href}
                      className={`flex items-center gap-1 px-3 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors
                        ${active ? 'text-primary border-b-2 border-primary' : 'hover:text-primary'}`}
                    >
                      {item.label}
                      {item.columns && <ChevronDown className="w-3 h-3 opacity-60" />}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>

        {/* Mega-menu dropdown */}
        {activeMegaColumns && (
          <div
            className="absolute top-full left-0 right-0 bg-surface-dark border-b border-white/10 shadow-2xl"
            onMouseEnter={() => {
              /* keep menu open while hovering dropdown */
            }}
          >
            <div className="max-w-7xl mx-auto px-4 py-6 flex gap-10">
              {activeMegaColumns.map((col) => (
                <div key={col.heading} className="min-w-[140px]">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-primary mb-3">
                    {col.heading}
                  </h4>
                  <ul className="space-y-2">
                    {col.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          to={link.href}
                          className="text-sm text-white/70 hover:text-white transition-colors block"
                          onClick={() => setActiveMegaMenu(null)}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <form onSubmit={handleSearch} className="flex">
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-l-lg text-white placeholder:text-white/50 focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-r-lg hover:bg-primary-dark transition-colors"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 overflow-y-auto max-h-[80vh]">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <ul className="space-y-0.5">
              {NAV_CONFIG.map((item) => (
                <li key={item.label}>
                  {item.columns ? (
                    <>
                      <button
                        className="w-full flex items-center justify-between py-2.5 text-sm font-bold uppercase tracking-wider hover:text-primary transition-colors"
                        onClick={() =>
                          setMobileExpanded(mobileExpanded === item.label ? null : item.label)
                        }
                      >
                        {item.label}
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${mobileExpanded === item.label ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {mobileExpanded === item.label && (
                        <div className="pl-4 pb-3 space-y-4 border-l border-white/10 ml-1">
                          {item.columns.map((col) => (
                            <div key={col.heading}>
                              <h4 className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2">
                                {col.heading}
                              </h4>
                              <ul className="space-y-2">
                                {col.links.map((link) => (
                                  <li key={link.label}>
                                    <Link
                                      to={link.href}
                                      className="text-sm text-white/70 hover:text-white transition-colors block"
                                      onClick={() => setMobileOpen(false)}
                                    >
                                      {link.label}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      to={item.href}
                      className="block py-2.5 text-sm font-bold uppercase tracking-wider hover:text-primary transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>

            <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
              <form onSubmit={handleSearch} className="flex">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-l text-white text-sm placeholder:text-white/50 focus:outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-primary text-white rounded-r hover:bg-primary-dark"
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleDark}
                  className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                >
                  {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {dark ? 'Light mode' : 'Dark mode'}
                </button>
                <Link
                  to="/sector-sweep"
                  className="ml-auto inline-flex items-center px-4 py-1.5 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded"
                  onClick={() => setMobileOpen(false)}
                >
                  Newsletter
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
