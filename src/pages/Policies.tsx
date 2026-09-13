import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import SEO from '../components/SEO'

const POLICIES = [
  {
    title: 'Privacy Policy',
    description: 'How The Fastest Sector collects, uses, and protects your information.',
    to: '/privacy',
  },
  {
    title: 'Editorial Policy',
    description: 'Our editorial mission, standards, independence, and approach at The Fastest Sector.',
    to: '/editorial-policy',
  },
  {
    title: 'Corrections & Updates Policy',
    description: 'How The Fastest Sector handles corrections and updates to our reporting.',
    to: '/corrections-policy',
  },
  {
    title: 'Terms & Conditions',
    description: 'Terms of use for The Fastest Sector website and content.',
    to: '/terms',
  },
]

export default function Policies() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <SEO
        title="Policies"
        description="Our policies at The Fastest Sector: privacy, editorial standards, corrections, and terms of use."
      />
      <h1 className="text-3xl font-bold text-text-primary dark:text-white mb-2">Policies</h1>
      <div className="h-1 w-16 bg-primary mt-2 mb-8 rounded-full" />

      <div className="grid gap-4 sm:grid-cols-2">
        {POLICIES.map((policy) => (
          <Link
            key={policy.to}
            to={policy.to}
            className="group flex items-center justify-between gap-4 p-6 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-primary dark:hover:border-primary transition-colors"
          >
            <div>
              <h2 className="font-bold text-text-primary dark:text-white group-hover:text-primary transition-colors">
                {policy.title}
              </h2>
              <p className="text-sm text-text-secondary dark:text-white/50 mt-1">
                {policy.description}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 flex-none text-text-secondary dark:text-white/40 group-hover:text-primary transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  )
}
