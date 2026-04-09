import { useSettings } from '../hooks/useSettings'
import SEO from '../components/SEO'

export default function About() {
  const { settings } = useSettings()

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <SEO title="About Us" description="Learn about The Fastest Sector team and our mission to bring you the best motorsport content." />
      <h1 className="text-3xl font-bold text-text-primary dark:text-white mb-2">About Us</h1>
      <div className="h-1 w-16 bg-primary mt-2 mb-8 rounded-full" />

      <div className="bg-surface-card dark:bg-surface-dark rounded-xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-text-primary dark:text-white mb-4">Our Story</h2>
        <p className="text-text-secondary dark:text-white/70 leading-relaxed text-lg whitespace-pre-line">
          {settings.ourStory}
        </p>
      </div>

      <div className="mt-8 bg-surface-card dark:bg-surface-dark rounded-xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-text-primary dark:text-white mb-4">Connect With Us</h2>
        <div className="flex flex-wrap gap-4">
          {Object.entries(settings.socialLinks)
            .filter(([, url]) => url)
            .map(([platform, url]) => (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 bg-surface-light dark:bg-white/10 rounded-lg text-text-primary dark:text-white hover:bg-primary hover:text-white transition-colors text-sm font-medium capitalize"
              >
                {platform}
              </a>
            ))}
        </div>
      </div>
    </div>
  )
}
