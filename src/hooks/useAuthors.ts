import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import type { Author } from '../lib/types'

export function useAuthors() {
  const [authors, setAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAuthors = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api<{ authors: Author[] }>('/api/authors')
      setAuthors(data.authors)
      return data.authors
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchAuthors()
  }, [fetchAuthors])

  const saveAuthor = useCallback(
    async (author: Author) => {
      await api('/api/authors', {
        method: 'POST',
        body: JSON.stringify(author),
      })
      await fetchAuthors()
    },
    [fetchAuthors],
  )

  const removeAuthor = useCallback(
    async (id: string) => {
      await api(`/api/authors/${id}`, { method: 'DELETE' })
      await fetchAuthors()
    },
    [fetchAuthors],
  )

  const getAuthor = useCallback(
    (id: string) => authors.find((a) => a.id === id) ?? null,
    [authors],
  )

  const getAuthorByName = useCallback(
    (name: string) => {
      const needle = name.trim().toLowerCase()
      return authors.find((a) => a.name.trim().toLowerCase() === needle) ?? null
    },
    [authors],
  )

  return { authors, loading, fetchAuthors, saveAuthor, removeAuthor, getAuthor, getAuthorByName }
}
