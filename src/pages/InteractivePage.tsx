import { Link, useParams } from 'react-router-dom'
import { Trophy, Target, BarChart2, Award, HelpCircle, ChevronRight } from 'lucide-react'
import SEO from '../components/SEO'

const FEATURES = [
  { key: 'quizzes', icon: HelpCircle, title: 'Quizzes', desc: 'Test your motorsport knowledge across all series.', href: '/quizzes', available: true },
  { key: 'predictions', icon: Target, title: 'Predictions', desc: 'Make your predictions before each race weekend.', href: '/interactive/predictions', available: false },
  { key: 'polls', icon: BarChart2, title: 'Polls', desc: 'Have your say on the biggest talking points.', href: '/interactive/polls', available: false },
  { key: 'rankings', icon: Award, title: 'Rankings', desc: 'See where you rank against other fans.', href: '/standings', available: true },
  { key: 'challenges', icon: Trophy, title: 'Challenges', desc: 'Compete in seasonal challenges and win prizes.', href: '/interactive/challenges', available: false },
]

export default function InteractivePage() {
  const { section } = useParams<{ section?: string }>()

  const current = FEATURES.find((f) => f.key === section) ?? null

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      <SEO
        title={`${current?.title ?? 'Interactive'} | The Fastest Sector`}
        description="Quizzes, predictions, polls and rankings — be part of the action."
      />

      {/* Header */}
      <section className="bg-surface-dark text-white py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-3">Interactive</p>
          <h1 className="text-4xl font-black mb-3">
            {current ? current.title : 'Interactive'}
          </h1>
          <p className="text-white/60">
            {current?.desc ?? 'Quizzes, predictions, polls and challenges — put yourself at the heart of the action.'}
          </p>
          {current && !current.available && (
            <p className="mt-4 text-sm text-yellow-400 font-medium">Coming soon — stay tuned!</p>
          )}
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, key, title, desc, href, available }) => (
            <div
              key={key}
              className={`rounded-xl p-5 bg-white dark:bg-white/5 border ${
                section === key ? 'border-primary' : 'border-transparent'
              } hover:shadow-md transition-all`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-black text-text-primary dark:text-white">{title}</h3>
                {!available && (
                  <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded">
                    Soon
                  </span>
                )}
              </div>
              <p className="text-sm text-text-secondary dark:text-white/60 mb-4">{desc}</p>
              {available ? (
                <Link
                  to={href}
                  className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary hover:underline"
                >
                  Go <ChevronRight className="w-3 h-3" />
                </Link>
              ) : (
                <span className="text-xs text-text-secondary dark:text-white/30 font-medium">Coming soon</span>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
