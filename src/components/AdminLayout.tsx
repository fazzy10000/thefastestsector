import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutDashboard,
  PlusCircle,
  Settings,
  LogOut,
  Home,
  ImageIcon,
  Users,
  Shield,
  Menu,
  X,
  Upload,
  Search,
  Trophy,
} from 'lucide-react'

const NAV = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { label: 'New Article', path: '/admin/new', icon: PlusCircle },
  { label: 'Quizzes', path: '/admin/quizzes', icon: Trophy },
  { label: 'Authors', path: '/admin/authors', icon: Users },
  { label: 'Image Tools', path: '/admin/image-tools', icon: ImageIcon },
  { label: 'SEO', path: '/admin/seo', icon: Search, requiredAction: 'manage_seo' as const },
  { label: 'Settings', path: '/admin/settings', icon: Settings, requiredAction: 'manage_settings' as const },
  { label: 'Team', path: '/admin/team', icon: Shield, requiredAction: 'manage_users' as const },
  { label: 'Import', path: '/admin/import', icon: Upload, requiredAction: 'manage_settings' as const },
]

export default function AdminLayout() {
  const { signOut, can, role } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const sidebar = (
    <>
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <Link to="/admin" className="flex items-center gap-2 text-xl font-black" onClick={() => setSidebarOpen(false)}>
          <img src="/thefastestsector/tfs-logo.png" alt="TFS" className="w-7 h-7 rounded-full" />
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
      <nav className="flex-1 p-4 space-y-1">
        {NAV.map((item) => {
          if (item.requiredAction && !can(item.requiredAction)) return null
          const isActive =
            item.path === '/admin/quizzes'
              ? location.pathname.startsWith('/admin/quiz')
              : location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
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
    <div className="min-h-screen flex bg-gray-50">
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 md:hidden bg-surface-dark flex items-center justify-between px-4 py-3">
        <Link to="/admin" className="flex items-center gap-2 text-lg font-black text-white">
          <img src="/thefastestsector/tfs-logo.png" alt="TFS" className="w-6 h-6 rounded-full" />
          <span><span className="text-primary">TFS</span> Admin</span>
        </Link>
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 text-white/70 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — desktop: always visible, mobile: slide-in drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface-dark text-white flex flex-col flex-shrink-0 transition-transform duration-200 md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebar}
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-auto w-full">
        <div className="p-4 pt-16 md:p-8 md:pt-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
