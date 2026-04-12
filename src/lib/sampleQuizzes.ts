import type { Quiz } from './types'

const now = 1710000000000

export const SAMPLE_QUIZZES: Quiz[] = [
  {
    id: 'sample-quiz-f1-2026',
    title: 'How Well Do You Know F1 2026?',
    slug: 'how-well-do-you-know-f1-2026',
    description:
      'Test your knowledge of the 2026 Formula 1 season — regulations, calendar trivia, and championship fundamentals.',
    category: 'formula-1',
    featuredImage:
      'https://images.unsplash.com/photo-1541447270888-83e8494f991d?w=1200&q=80',
    status: 'published',
    createdAt: now - 86400000 * 14,
    updatedAt: now - 86400000 * 2,
    questions: [
      {
        id: 'f1-q1',
        question:
          'The 2026 Formula 1 power unit regulations place greater emphasis on which combination?',
        options: [
          'Fully electric powertrains',
          '100% sustainable fuel with a larger share of electrical deployment',
          'Pure hydrogen internal combustion',
          'Identical output rules to the 2021–2025 hybrid era',
        ],
        correctIndex: 1,
        explanation:
          'The 2026 regulations push sustainable fuels and a significantly increased electrical contribution alongside the ICE.',
      },
      {
        id: 'f1-q2',
        question: 'A typical modern Formula 1 season in the 2020s features roughly how many Grands Prix?',
        options: ['Around 12', 'Around 18', 'Around 22–24', 'Over 30'],
        correctIndex: 2,
        explanation:
          'Recent calendars have generally landed in the low-to-mid twenties, with minor year-to-year changes.',
      },
      {
        id: 'f1-q3',
        question: 'The Las Vegas Grand Prix is run predominantly on what kind of layout?',
        options: [
          'A permanent road course outside the city',
          'A temporary street circuit including sections of the Las Vegas Strip',
          'An oval configuration',
          'A rallycross-style mixed surface',
        ],
        correctIndex: 1,
        explanation:
          'Las Vegas uses a temporary street-style layout woven through resort corridors and public roads.',
      },
      {
        id: 'f1-q4',
        question: 'Under the standard F1 points system used through the 2020s, how many points does the race winner score?',
        options: ['25', '20', '10', '50'],
        correctIndex: 0,
        explanation: 'A Grand Prix win awards 25 points (before fastest lap bonuses where applicable).',
      },
      {
        id: 'f1-q5',
        question: 'Which company is the exclusive Formula 1 tyre supplier through the mid-2020s?',
        options: ['Michelin', 'Pirelli', 'Bridgestone', 'Hankook'],
        correctIndex: 1,
        explanation: 'Pirelli has been F1’s sole tyre supplier across recent regulation cycles.',
      },
      {
        id: 'f1-q6',
        question: 'In a Sprint weekend, Sprint race points are typically awarded to roughly:',
        options: ['The top 3 finishers', 'The top 8 finishers', 'The top 10 finishers', 'Only the winner'],
        correctIndex: 1,
        explanation: 'Sprint formats have evolved, but points have commonly been paid down to eighth place.',
      },
      {
        id: 'f1-q7',
        question: 'DRS can generally be activated when a driver is:',
        options: [
          'Anywhere on track, at any time',
          'Within one second of the car ahead at a detection point (and in a DRS zone)',
          'Only during pit stops',
          'Only on the formation lap',
        ],
        correctIndex: 1,
        explanation:
          'Drivers must be within one second at the detection line (and meet session rules) before opening DRS in the zone.',
      },
      {
        id: 'f1-q8',
        question: 'The Constructors’ Championship aggregates points scored by:',
        options: [
          'Both cars from each team (subject to eligibility rules)',
          'Only the team’s lead driver',
          'Only sprint race results',
          'Randomly selected events',
        ],
        correctIndex: 0,
        explanation:
          'Both entered cars can score constructors’ points, which is why strategy across the garage matters.',
      },
    ],
  },
  {
    id: 'sample-quiz-formula-e',
    title: 'Formula E Challenge',
    slug: 'formula-e-challenge',
    description:
      'Five quick-fire questions on Formula E formats, venues, and race-craft — no pit wall radio required.',
    category: 'formula-e',
    featuredImage:
      'https://images.unsplash.com/photo-1590218151747-f1a1234679f4?w=1200&q=80',
    status: 'published',
    createdAt: now - 86400000 * 21,
    updatedAt: now - 86400000 * 5,
    questions: [
      {
        id: 'fe-q1',
        question: 'Which strategic element lets drivers temporarily unlock extra power in Formula E?',
        options: ['Attack Mode', 'DRS', 'Push-to-pass only', 'KERS reserve'],
        correctIndex: 0,
        explanation:
          'Attack Mode is the series’ signature temporary power boost, earned by driving through an activation zone.',
      },
      {
        id: 'fe-q2',
        question: 'Formula E predominantly races on:',
        options: [
          'Street circuits and temporary city layouts',
          'Permanent Grand Prix circuits only',
          'High-banked ovals',
          'Snow and ice circuits',
        ],
        correctIndex: 0,
        explanation:
          'The championship is built around tight, technical city circuits — though some rounds use hybrid or permanent layouts.',
      },
      {
        id: 'fe-q3',
        question: 'In the standard main race format, championship points are typically awarded down to:',
        options: ['P10', 'P12', 'P15', 'P20'],
        correctIndex: 0,
        explanation:
          'Like F1’s classic top-10 scoring, Formula E commonly pays points through tenth in the feature race.',
      },
      {
        id: 'fe-q4',
        question: 'Why is energy management so critical in Formula E?',
        options: [
          'Drivers must complete race distance within a fixed energy budget',
          'There is unlimited energy but limited tyres',
          'Cars cannot regenerate under braking',
          'Pit stops are mandatory every five laps',
        ],
        correctIndex: 0,
        explanation:
          'Races are won and lost by balancing pace with available energy — lift-and-coast, regen, and strategy all matter.',
      },
      {
        id: 'fe-q5',
        question: 'The Gen4 era in Formula E is associated with:',
        options: [
          'More power, lighter cars, and continued focus on city racing',
          'A switch to pure ICE engines',
          'Removal of all energy limits',
          'Exclusive competition on ovals',
        ],
        correctIndex: 0,
        explanation:
          'Gen4 continues the championship’s electric DNA with step-changes in performance and efficiency.',
      },
    ],
  },
]
