import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        {/* Animated chequered flag pattern */}
        <div className="relative mb-8 inline-block">
          <div className="grid grid-cols-8 gap-0 w-48 h-32 mx-auto opacity-20 rotate-[-5deg]">
            {Array.from({ length: 32 }).map((_, i) => (
              <div
                key={i}
                className={`w-6 h-4 ${
                  (Math.floor(i / 8) + (i % 8)) % 2 === 0
                    ? 'bg-text-primary dark:bg-white'
                    : 'bg-transparent'
                }`}
              />
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-8xl font-black text-primary tracking-tighter">
              404
            </span>
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-text-primary dark:text-white mb-3">
          Off the Racing Line
        </h1>
        <p className="text-text-secondary dark:text-white/60 mb-2">
          Looks like you've taken a wrong turn at the chicane.
        </p>
        <p className="text-text-secondary dark:text-white/50 text-sm mb-8">
          The page you're looking for has either retired from the grid or never qualified.
        </p>

        {/* Tire track divider */}
        <div className="flex items-center justify-center gap-1 mb-8">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-3 bg-primary/30 rounded-full"
              style={{ transform: `rotate(${(i - 10) * 3}deg)` }}
            />
          ))}
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 dark:border-white/20 rounded-lg text-sm font-medium text-text-primary dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <Link
            to="/"
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to Pit Lane
          </Link>
        </div>

        <p className="text-xs text-text-secondary dark:text-white/30 mt-10">
          DNF — Did Not Find
        </p>
      </div>
    </div>
  )
}
