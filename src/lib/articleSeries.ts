import type { Category } from './types'
import type { RaceEvent } from './types'

export type ResultsSeries = 'f1' | 'f2' | 'f3' | 'indycar' | 'fe' | 'f1-academy'
export type StandingsSeries = 'formula-1' | 'f2' | 'f3' | 'f1-academy' | 'formula-e' | 'indycar'

export interface ArticleSeriesContext {
  resultsSeries: ResultsSeries
  scheduleSeries: RaceEvent['series'] | null
  standingsId: StandingsSeries
  label: string
}

export function articleSeriesContext(category: Category): ArticleSeriesContext {
  switch (category) {
    case 'formula-1':
      return { resultsSeries: 'f1', scheduleSeries: 'f1', standingsId: 'formula-1', label: 'F1' }
    case 'feeder-series':
      return { resultsSeries: 'f2', scheduleSeries: 'f2', standingsId: 'f2', label: 'F2' }
    case 'f1-academy':
      return { resultsSeries: 'f1-academy', scheduleSeries: 'f1-academy', standingsId: 'f1-academy', label: 'F1 Academy' }
    case 'formula-e':
      return { resultsSeries: 'fe', scheduleSeries: 'fe', standingsId: 'formula-e', label: 'Formula E' }
    case 'indycar':
      return { resultsSeries: 'indycar', scheduleSeries: 'indycar', standingsId: 'indycar', label: 'IndyCar' }
    default:
      return { resultsSeries: 'f1', scheduleSeries: 'f1', standingsId: 'formula-1', label: 'F1' }
  }
}
