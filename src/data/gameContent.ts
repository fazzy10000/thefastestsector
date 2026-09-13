export const GAMES = [
  {
    id: 'lights-out',
    title: 'Lights Out',
    description: 'Test your F1-style reaction time. Wait for the lights — then go!',
    emoji: '🚦',
    href: '/games/lights-out',
  },
  {
    id: 'pit-stop',
    title: 'Pit Stop Blitz',
    description: 'Tap as fast as you can in 10 seconds. How many wheel changes can you simulate?',
    emoji: '🔧',
    href: '/games/pit-stop',
  },
  {
    id: 'flag-sprint',
    title: 'Flag Sprint',
    description: 'Match the flag to the country. Ten quick-fire questions on the world calendar.',
    emoji: '🏁',
    href: '/games/flag-sprint',
  },
] as const

export type GameId = (typeof GAMES)[number]['id']

export interface FlagQuestion {
  code: string
  country: string
  options: string[]
  correctIndex: number
}

export const FLAG_QUESTIONS: FlagQuestion[] = [
  { code: 'GBR', country: 'United Kingdom', options: ['United Kingdom', 'France', 'Belgium', 'Netherlands'], correctIndex: 0 },
  { code: 'MCO', country: 'Monaco', options: ['Monaco', 'Italy', 'Spain', 'France'], correctIndex: 0 },
  { code: 'ITA', country: 'Italy', options: ['Italy', 'Austria', 'Hungary', 'Monaco'], correctIndex: 0 },
  { code: 'JPN', country: 'Japan', options: ['Japan', 'China', 'Singapore', 'Indonesia'], correctIndex: 0 },
  { code: 'USA', country: 'United States', options: ['United States', 'Canada', 'Mexico', 'Brazil'], correctIndex: 0 },
  { code: 'BRA', country: 'Brazil', options: ['Brazil', 'Argentina', 'Mexico', 'USA'], correctIndex: 0 },
  { code: 'AUS', country: 'Australia', options: ['Australia', 'New Zealand', 'Japan', 'Singapore'], correctIndex: 0 },
  { code: 'BEL', country: 'Belgium', options: ['Belgium', 'Netherlands', 'Germany', 'France'], correctIndex: 0 },
  { code: 'SGP', country: 'Singapore', options: ['Singapore', 'Malaysia', 'Indonesia', 'Thailand'], correctIndex: 0 },
  { code: 'QAT', country: 'Qatar', options: ['Qatar', 'Bahrain', 'UAE', 'Saudi Arabia'], correctIndex: 0 },
]

export const FAN_POLL = {
  question: 'Which series delivers the best wheel-to-wheel racing right now?',
  options: [
    { id: 'f1', label: 'Formula 1' },
    { id: 'indycar', label: 'IndyCar' },
    { id: 'fe', label: 'Formula E' },
    { id: 'feeder', label: 'Feeder Series (F2/F3)' },
  ],
  storageKey: 'tfs-fan-poll-series-2026',
} as const
