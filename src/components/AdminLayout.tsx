import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useDarkMode } from '../hooks/useDarkMode'
import AdminTour from './admin/AdminTour'
import {
  LayoutDashboard,
  PlusCircle,
  Settings,
  LogOut,
  Home,
  ImageIcon,
  Users,
  UserRound,
  Shield,
  Menu,
  X,
  Upload,
  Search,
  Trophy,
  Mail,
  BarChart3,
  Megaphone,
  Moon,
  Sun,
  Map,
  HelpCircle,
} from 'lucide-react'

type NavItem = {
  label: string
  path: string
  icon: typeof LayoutDashboard
  requiredAction?: 'manage_ads' | 'manage_newsletter' | 'manage_seo' | 'manage_settings' | 'manage_users'
  tour?: string
}

const NAV: NavItem[] = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { label: 'Traffic & Insights', path: '/admin/stats', icon: BarChart3, tour: 'nav-stats' },
  { label: 'Ads', path: '/admin/ads', icon: Megaphone, requiredAction: 'manage_ads' as const },
  { label: 'New Article', path: '/admin/new', icon: PlusCircle, tour: 'nav-new-article' },
  { label: 'Newsletters', path: '/admin/newsletter', icon: Mail, requiredAction: 'manage_newsletter' as const },
  { label: 'Quizzes', path: '/admin/quizzes', icon: Trophy },
  { label: 'Authors', path: '/admin/authors', icon: Users },
  { label: 'Meet the Team', path: '/admin/meet-the-team', icon: UserRound },
  { label: 'Media', path: '/admin/media', icon: ImageIcon },
  { label: 'SEO', path: '/admin/seo', icon: Search, requiredAction: 'manage_seo' as const, tour: 'nav-seo' },
  { label: 'Sitemap', path: '/admin/sitemap', icon: Map, requiredAction: 'manage_seo' as const, tour: 'nav-sitemap' },
  { label: 'Settings', path: '/admin/settings', icon: Settings, requiredAction: 'manage_settings' as const, tour: 'nav-settings' },
  { label: 'Team', path: '/admin/team', icon: Shield, requiredAction: 'manage_users' as const },
  { label: 'Import', path: '/admin/import', icon: Upload, requiredAction: 'manage_settings' as const },
]

export default function AdminLayout() {
  const { signOut, can, role } = useAuth()
  const { dark, toggle: toggleDark } = useDarkMode()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [tourSignal, setTourSignal] = useState(0)

  const startTour = () => {
    setSidebarOpen(false)
    setTourSignal((n) => n + 1)
  }

  const sidebar = (
    <>
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <Link to="/admin" className="flex items-center gap-2 text-xl font-black" onClick={() => setSidebarOpen(false)}>
          <img src="/tfs-logo.png" alt="TFS" className="w-7 h-7 rounded-full" />
          <span><span className="text-primary">TFS</span> Admin</span>
        </Link>
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden p-1 text-white/60 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <p className="px-5 pt-2 text-xs text-white/40 capitalize">{role}</p>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto" data-tour="sidebar-nav">
        {NAV.map((item) => {
          if (item.requiredAction && !can(item.requiredAction)) return null
          const isActive =
            item.path === '/admin/quizzes'
              ? location.pathname.startsWith('/admin/quiz')
              : item.path === '/admin/newsletter'
                ? location.pathname.startsWith('/admin/newsletter')
                : item.path === '/admin/media'
                  ? location.pathname.startsWith('/admin/media') || location.pathname.startsWith('/admin/image-tools')
                  : item.path === '/admin/stats'
                    ? location.pathname.startsWith('/admin/stats')
                    : item.path === '/admin/ads'
                      ? location.pathname.startsWith('/admin/ads')
                      : location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              data-tour={item.tour}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon className="w-4.5 h-4.5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-white/10 space-y-1">
        <button
          onClick={startTour}
          data-tour="tour-button"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <HelpCircle className="w-4.5 h-4.5" />
          Take the tour
        </button>
        <button
          onClick={toggleDark}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          {dark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          {dark ? 'Light mode' : 'Dark mode'}
        </button>
        <Link
          to="/"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <Home className="w-4.5 h-4.5" />
          View Site
        </Link>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="w-4.5 h-4.5" />
          Sign Out
        </button>
      </div>
    </>
  )

  return (
    <div className="admin-shell min-h-screen flex bg-gray-50 dark:bg-surface-darker">
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 md:hidden bg-surface-dark flex items-center justify-between px-4 py-3">
        <Link to="/admin" className="flex items-center gap-2 text-lg font-black text-white">
          <img src="/tfs-logo.png" alt="TFS" className="w-6 h-6 rounded-full" />
          <span><span className="text-primary">TFS</span> Admin</span>
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={startTour}
            className="p-2 text-white/70 hover:text-white"
            aria-label="Take the tour"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <button
            onClick={toggleDark}
            className="p-2 text-white/70 hover:text-white"
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-white/70 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed width/height; mobile: slide-in drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 max-w-[16rem] bg-surface-dark text-white flex flex-col overflow-hidden transition-transform duration-200 md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebar}
      </aside>

      {/* Main content — offset for fixed sidebar on desktop */}
      <div className="admin-content flex-1 min-w-0 w-full md:ml-64">
        <div className="p-4 pt-16 md:p-8 md:pt-8">
          <Outlet />
        </div>
        <AdminTour startSignal={tourSignal} />
      </div>
    </div>
  )
}
