import { Link, useParams } from 'react-router-dom'
import type { ComponentType } from 'react'
import { ChevronRight, Gamepad2 } from 'lucide-react'
import SEO from '../components/SEO'
import LightsOutGame from '../components/games/LightsOutGame'
import PitStopGame from '../components/games/PitStopGame'
import FlagSprintGame from '../components/games/FlagSprintGame'
import { GAMES, type GameId } from '../data/gameContent'

const GAME_COMPONENTS: Record<GameId, ComponentType> = {
  'lights-out': LightsOutGame,
  'pit-stop': PitStopGame,
  'flag-sprint': FlagSprintGame,
}

function isGameId(value: string | undefined): value is GameId {
  return GAMES.some((g) => g.id === value)
}

export default function GamesPage() {
  const { gameId } = useParams<{ gameId?: string }>()
  const active = isGameId(gameId) ? GAMES.find((g) => g.id === gameId)! : null
  const ActiveGame = gameId && isGameId(gameId) ? GAME_COMPONENTS[gameId] : null

  if (ActiveGame) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <SEO title={active?.title ?? 'Game'} description={active?.description} />
        <ActiveGame />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <SEO
        title="Motorsport Games"
        description="Quick, fun motorsport mini-games — reaction tests, pit stop challenges and flag quizzes."
      />

      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Gamepad2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-primary dark:text-white tracking-tight">Games</h1>
            <p className="text-text-secondary dark:text-white/60 text-sm mt-0.5">
              Quick challenges to kill time between sessions.
            </p>
          </div>
        </div>
        <div className="h-1 w-20 bg-primary rounded-full" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {GAMES.map((game) => (
          <Link
            key={game.id}
            to={game.href}
            className="group rounded-2xl border border-gray-200/80 dark:border-white/10 bg-surface-card dark:bg-white/5 p-6 hover:border-primary/30 hover:shadow-lg transition-all"
          >
            <span className="text-4xl mb-4 block" aria-hidden>{game.emoji}</span>
            <h2 className="text-lg font-bold text-text-primary dark:text-white mb-2">{game.title}</h2>
            <p className="text-sm text-text-secondary dark:text-white/55 mb-4">{game.description}</p>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
              Play now
              <ChevronRight className="w-4 h-4" />
            </span>
          </Link>
        ))}
      </div>

      <p className="text-center text-sm text-text-secondary dark:text-white/50 mt-10">
        Want trivia instead?{' '}
        <Link to="/quizzes" className="text-primary font-semibold hover:underline">
          Browse quizzes
        </Link>
      </p>
    </div>
  )
}
