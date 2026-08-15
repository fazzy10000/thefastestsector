import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Search, Moon, Sun, Menu, X, User, ChevronDown } from 'lucide-react'
import { useDarkMode } from '../hooks/useDarkMode'

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

const NAV_CONFIG: NavItem[] = [
  { label: 'HOME', href: '/' },
  {
    label: 'F1',
    href: '/category/formula-1',
    columns: [
      {
        heading: 'News',
        links: [
          { label: 'Breaking News', href: '/category/formula-1' },
          { label: 'Team News', href: '/category/formula-1' },
          { label: 'Transfers', href: '/category/formula-1' },
          { label: 'Technical', href: '/category/formula-1' },
        ],
      },
      {
        heading: 'Results',
        links: [
          { label: 'Race Results', href: '/standings' },
          { label: 'Qualifying', href: '/standings' },
          { label: 'Standings', href: '/standings' },
          { label: 'Sprint Results', href: '/standings' },
        ],
      },
      {
        heading: 'Features',
        links: [
          { label: 'Analysis', href: '/category/formula-1' },
          { label: 'Opinion', href: '/category/formula-1' },
          { label: 'Team & Driver Features', href: '/category/formula-1' },
          { label: 'Technical Deep Dives', href: '/category/formula-1' },
        ],
      },
    ],
  },
  {
    label: 'FEEDER SERIES',
    href: '/category/feeder-series',
    columns: [
      {
        heading: 'News',
        links: [
          { label: 'F2, F3, F4 & More', href: '/category/feeder-series' },
          { label: 'Series Updates', href: '/category/feeder-series' },
          { label: 'Team News', href: '/category/feeder-series' },
        ],
      },
      {
        heading: 'Results',
        links: [
          { label: 'F2 Results', href: '/standings' },
          { label: 'F3 Results', href: '/standings' },
          { label: 'Qualifying', href: '/standings' },
          { label: 'Regional Series Results', href: '/standings' },
        ],
      },
      {
        heading: 'Features',
        links: [
          { label: 'Rising Stars', href: '/category/feeder-series' },
          { label: 'Junior Driver Tracker', href: '/category/feeder-series' },
          { label: 'Team Spotlights', href: '/category/feeder-series' },
        ],
      },
    ],
  },
  {
    label: 'INDYCAR',
    href: '/category/indycar',
    columns: [
      {
        heading: 'News',
        links: [
          { label: 'Series News', href: '/category/indycar' },
          { label: 'Team News', href: '/category/indycar' },
          { label: 'Driver Updates', href: '/category/indycar' },
        ],
      },
      {
        heading: 'Results',
        links: [
          { label: 'Race Results', href: '/standings' },
          { label: 'Qualifying', href: '/standings' },
          { label: 'Standings', href: '/standings' },
        ],
      },
      {
        heading: 'Features',
        links: [
          { label: 'Team & Driver Features', href: '/category/indycar' },
          { label: 'Technical Analysis', href: '/category/indycar' },
          { label: 'Team Spotlights', href: '/category/indycar' },
        ],
      },
    ],
  },
  {
    label: 'FORMULA E',
    href: '/category/formula-e',
    columns: [
      {
        heading: 'News',
        links: [
          { label: 'Series News', href: '/category/formula-e' },
          { label: 'Team News', href: '/category/formula-e' },
          { label: 'Tech & Innovation', href: '/category/formula-e' },
        ],
      },
      {
        heading: 'Results',
        links: [
          { label: 'Race Results', href: '/standings' },
          { label: 'Qualifying', href: '/standings' },
          { label: 'Standings', href: '/standings' },
        ],
      },
      {
        heading: 'Features',
        links: [
          { label: 'Technology Focus', href: '/category/formula-e' },
          { label: 'Team & Driver Features', href: '/category/formula-e' },
          { label: 'Sustainability', href: '/category/formula-e' },
        ],
      },
    ],
  },
  {
    label: 'INTERACTIVE',
    href: '/quizzes',
    activePaths: ['/quizzes', '/quiz', '/interactive'],
    columns: [
      {
        heading: 'Interactive',
        links: [
          { label: 'Quizzes', href: '/quizzes' },
          { label: 'Predictions', href: '/interactive/predictions' },
          { label: 'Polls', href: '/interactive/polls' },
          { label: 'Rankings', href: '/standings' },
          { label: 'Challenges', href: '/interactive/challenges' },
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
          { label: 'Subscribe', href: '/sector-sweep' },
          { label: 'Latest Edition', href: '/sector-sweep' },
          { label: 'F1 Edition', href: '/sector-sweep' },
          { label: 'Feeder Series Edition', href: '/sector-sweep' },
          { label: 'IndyCar Edition', href: '/sector-sweep' },
          { label: 'Formula E Edition', href: '/sector-sweep' },
          { label: 'Archive', href: '/sector-sweep' },
        ],
      },
    ],
  },
  {
    label: 'ABOUT US',
    href: '/about',
    activePaths: ['/about', '/contact'],
    columns: [
      {
        heading: 'About',
        links: [
          { label: 'Our Story', href: '/about' },
          { label: 'Meet The Team', href: '/about' },
          { label: 'Join Us', href: '/about' },
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
          <div className="flex items-center gap-3">
            <a
              href="https://x.com/thefastestsector"
              target="_blank"
              rel="noreferrer"
              aria-label="X / Twitter"
              className="hover:text-primary transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://instagram.com/thefastestsector"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="hover:text-primary transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
          </div>

          {/* Center: logo + wordmark */}
          <div className="flex justify-center">
            <Link to="/" className="flex items-center gap-2">
              <img src="/tfs-logo.png" alt="The Fastest Sector" className="w-8 h-8 rounded-full" />
              <span className="font-black tracking-tight text-sm hidden sm:inline">
                THE FASTEST <span className="text-primary">SECTOR</span>
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
