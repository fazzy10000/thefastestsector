import { Link } from 'react-router-dom'
import { useSettings } from '../hooks/useSettings'
import SocialIcons from './SocialIcons'

const BOTTOM_LINKS = [
  { label: 'Latest News', to: '/category/news' },
  { label: 'Features', to: '/category/news?tab=features' },
  { label: 'Standings', to: '/standings' },
  { label: 'Quizzes', to: '/quizzes' },
  { label: 'About Us', to: '/about' },
  { label: 'Policies', to: '/policies' },
]

export default function Footer() {
  const { settings } = useSettings()
  const year = new Date().getFullYear()

  return (
    <footer className="bg-surface-dark text-white border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col lg:flex-row items-center gap-4 lg:gap-8">
        <div className="flex items-center gap-3 flex-none">
          <img src="/tfs-logo.png" alt={settings.siteName} className="w-9 h-9 rounded-full" />
          <div>
            <p className="font-black text-sm leading-tight">
              THE FASTEST <span className="text-primary">SECTOR</span>
            </p>
            <p className="text-xs text-white/50">{settings.siteTagline || 'Passion. Analysis. Every Sector.'}</p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 flex-1">
          {BOTTOM_LINKS.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              className="text-xs font-medium text-white/55 hover:text-white transition-colors whitespace-nowrap"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4 flex-none">
          <SocialIcons
            links={settings.socialLinks}
            linkClassName="text-white/50 hover:text-white transition-colors"
          />
          <p className="text-xs text-white/40 whitespace-nowrap">© {year}</p>
        </div>
      </div>

      {settings.footer.legalDisclaimer && (
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <p className="text-[10px] text-white/30 leading-relaxed line-clamp-2">
              {settings.footer.legalDisclaimer}
            </p>
          </div>
        </div>
      )}
    </footer>
  )
}
