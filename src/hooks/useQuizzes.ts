import { useState, useCallback } from 'react'
import { api } from '../lib/api'
import type { Quiz } from '../lib/types'

export function useQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)

  const fetchQuizzes = useCallback(async (opts?: { status?: 'draft' | 'published' }) => {
    setLoading(true)
    try {
      const qs = opts?.status ? `?status=${opts.status}` : ''
      const data = await api<{ quizzes: Quiz[] }>(`/api/quizzes${qs}`)
      const list = opts?.status
        ? data.quizzes.filter((q) => q.status === opts.status)
        : data.quizzes
      setQuizzes(list)
      return list
    } catch {
      setQuizzes([])
      return []
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
      // published quiz not found
    }
    return null
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
