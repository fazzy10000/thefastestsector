import { useState, useCallback } from 'react'
import { api } from '../lib/api'
import {
  findSampleQuizBySlug,
  mergeQuizzesWithFallback,
} from '../lib/quizFallback'
import type { Quiz } from '../lib/types'

export function useQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)

  const fetchQuizzes = useCallback(async (opts?: { status?: 'draft' | 'published' }) => {
    setLoading(true)
    try {
      const qs = opts?.status ? `?status=${opts.status}` : ''
      const data = await api<{ quizzes: Quiz[] }>(`/api/quizzes${qs}`)
      const merged = mergeQuizzesWithFallback(data.quizzes, opts?.status)
      setQuizzes(merged)
      return merged
    } catch {
      const fallback = mergeQuizzesWithFallback([], opts?.status)
      setQuizzes(fallback)
      return fallback
    } finally {
      setLoading(false)
    }
  }, [])

  const getQuiz = useCallback(async (id: string): Promise<Quiz | null> => {
    try {
      const data = await api<{ quiz: Quiz }>(`/api/quizzes/${id}`)
      return data.quiz
    } catch {
      return null
    }
  }, [])

  const getQuizBySlug = useCallback(async (slug: string): Promise<Quiz | null> => {
    try {
      const data = await api<{ quiz: Quiz }>(`/api/quizzes/by-slug/${encodeURIComponent(slug)}`)
      if (data.quiz?.status === 'published') return data.quiz
    } catch {
      // fall through to bundled samples
    }
    return findSampleQuizBySlug(slug)
  }, [])

  const createQuiz = useCallback(async (data: Omit<Quiz, 'id'>) => {
    const res = await api<{ id: string }>('/api/quizzes', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return res.id
  }, [])

  const updateQuiz = useCallback(async (id: string, data: Partial<Quiz>) => {
    await api(`/api/quizzes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }, [])

  const deleteQuiz = useCallback(async (id: string) => {
    await api(`/api/quizzes/${id}`, { method: 'DELETE' })
  }, [])

  return {
    quizzes,
    loading,
    fetchQuizzes,
    getQuiz,
    getQuizBySlug,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    removeQuiz: deleteQuiz,
  }
}
