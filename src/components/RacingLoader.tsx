export default function RacingLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      {/* Animated racing car track */}
      <div className="relative w-48 h-12 mb-6">
        {/* Track line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 dark:bg-white/10 -translate-y-1/2" />
        {/* Dashed center line */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex gap-2 justify-center">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="w-3 h-px bg-gray-300 dark:bg-white/20" />
          ))}
        </div>
        {/* The "car" — a small rectangle that races across */}
        <div className="absolute top-1/2 -translate-y-1/2 racing-car">
          <div className="w-6 h-3 bg-primary rounded-sm shadow-lg shadow-primary/30 relative">
            <div className="absolute -right-1 top-0.5 w-1 h-2 bg-primary-dark rounded-r-sm" />
          </div>
        </div>
      </div>

      {/* Chequered flag loading dots */}
      <div className="flex items-center gap-1.5 mb-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            style={{
              animation: 'racingPulse 1s ease-in-out infinite',
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>

      <p className="text-sm text-text-secondary dark:text-white/50 font-medium">
        {message}
      </p>
    </div>
  )
}
