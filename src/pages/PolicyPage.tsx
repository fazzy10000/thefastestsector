import { useSettings } from '../hooks/useSettings'
import SEO from '../components/SEO'
import StaticPageBody from '../components/StaticPageBody'

type PolicyKey = 'privacyPolicy' | 'terms' | 'editorialPolicy' | 'correctionsPolicy'

interface PolicyPageProps {
  policyKey: PolicyKey
}

export default function PolicyPage({ policyKey }: PolicyPageProps) {
  const { settings, loading } = useSettings()
  const page = settings[policyKey]

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SEO title={page.title} description={page.seoDescription} />
      <h1 className="text-3xl font-bold text-text-primary dark:text-white mb-2">{page.title}</h1>
      <div className="h-1 w-16 bg-primary mt-2 mb-8 rounded-full" />

      {loading ? (
        <p className="text-sm text-text-secondary dark:text-white/50">Loading...</p>
      ) : (
        <>
          {page.lastUpdated && (
            <p className="text-sm text-text-secondary dark:text-white/50 mb-6">
              Last updated: {page.lastUpdated}
            </p>
          )}
          <StaticPageBody sections={page.sections} settings={settings} />
        </>
      )}
    </div>
  )
}

