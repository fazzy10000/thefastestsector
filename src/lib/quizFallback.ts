import { SAMPLE_QUIZZES } from './sampleQuizzes'
import type { Quiz } from './types'

export function getPublishedSampleQuizzes(): Quiz[] {
  return SAMPLE_QUIZZES.filter((q) => q.status === 'published')
}

export function mergeQuizzesWithFallback(
  apiQuizzes: Quiz[],
  status?: 'draft' | 'published',
): Quiz[] {
  if (status === 'published') {
    const published = apiQuizzes.filter((q) => q.status === 'published')
    return published.length > 0 ? published : getPublishedSampleQuizzes()
  }
  if (status === 'draft') {
    return apiQuizzes.filter((q) => q.status === 'draft')
  }
  return apiQuizzes.length > 0 ? apiQuizzes : getPublishedSampleQuizzes()
}

export function findSampleQuizBySlug(slug: string): Quiz | null {
  return SAMPLE_QUIZZES.find((q) => q.slug === slug && q.status === 'published') ?? null
}
