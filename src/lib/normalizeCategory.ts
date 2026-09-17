import type { Category } from './types'

const VALID_CATEGORIES = new Set<Category>([
  'formula-1',
  'feeder-series',
  'formula-e',
  'indycar',
  'exclusive',
  'f1-academy',
  'other',
])

/**
 * Map imported / legacy category values onto the site taxonomy.
 * Especially recovers F1 Academy posts that landed in `other`.
 */
export function normalizeCategory(
  category: string,
  title = '',
  slug = '',
): Category {
  const hay = `${title} ${slug}`.toLowerCase()

  // Title/slug beats a wrong stored category for known series
  if (/f1[-\s]?academy/.test(hay)) return 'f1-academy'

  if (VALID_CATEGORIES.has(category as Category) && category !== 'other') {
    return category as Category
  }

  if (/formula\s*e|formula-e|\be-prix\b/.test(hay)) return 'formula-e'
  if (/indycar|indy\s*car|indianapolis\s*500/.test(hay)) return 'indycar'
  if (/formula\s*2|formula\s*3|feeder\s*series|\bf2\b|\bf3\b/.test(hay)) return 'feeder-series'
  if (/formula\s*1|\bf1\b/.test(hay)) return 'formula-1'

  if (VALID_CATEGORIES.has(category as Category)) return category as Category
  return 'other'
}
