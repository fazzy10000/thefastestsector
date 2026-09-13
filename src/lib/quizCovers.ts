import type { Category } from './types'

export const QUIZ_COVER_IMAGES: Record<Category, string> = {
  'formula-1': '/quiz-covers/f1.svg',
  'formula-e': '/quiz-covers/formula-e.svg',
  'indycar': '/quiz-covers/indycar.svg',
  'feeder-series': '/quiz-covers/f1.svg',
  'f1-academy': '/quiz-covers/f1.svg',
  exclusive: '/quiz-covers/f1.svg',
  other: '/quiz-covers/f1.svg',
}

export function quizCoverImage(category: Category, featuredImage?: string): string {
  if (featuredImage?.startsWith('/')) return featuredImage
  if (featuredImage && !featuredImage.includes('unsplash.com')) return featuredImage
  return QUIZ_COVER_IMAGES[category] ?? '/quiz-covers/f1.svg'
}
