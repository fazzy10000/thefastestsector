import { useState, useEffect, useCallback } from 'react'
import { isFirebaseConfigured } from '../lib/firebase'
import { SAMPLE_AUTHORS } from '../lib/sampleAuthors'
import type { Author } from '../lib/types'

const LS_KEY = 'tfs_authors'

function readLocal(): Author[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const data = JSON.parse(raw) as Author[]
    return data.filter((a) => a && a.id && a.name)
  } catch {
    localStorage.removeItem(LS_KEY)
    return []
  }
}

function writeLocal(authors: Author[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(authors))
}

function initLocalIfEmpty() {
  if (!localStorage.getItem(LS_KEY)) {
    writeLocal(SAMPLE_AUTHORS)
  }
}

export function useAuthors() {
  const [authors, setAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAuthors = useCallback(async () => {
    if (!isFirebaseConfigured) {
      initLocalIfEmpty()
      let data = readLocal()
      if (data.length === 0 && !localStorage.getItem(LS_KEY)) {
        writeLocal(SAMPLE_AUTHORS)
        data = SAMPLE_AUTHORS
      }
      setAuthors(data)
      setLoading(false)
      return data
    }
    setLoading(false)
    return []
  }, [])

  const getAuthor = useCallback(async (id: string): Promise<Author | null> => {
    if (!isFirebaseConfigured) {
      initLocalIfEmpty()
      return readLocal().find((a) => a.id === id) ?? null
    }
    return null
  }, [])

  const getAuthorByName = useCallback(
    async (name: string): Promise<Author | null> => {
      if (!isFirebaseConfigured) {
        initLocalIfEmpty()
        return (
          readLocal().find(
            (a) => a.name.toLowerCase() === name.toLowerCase(),
          ) ?? null
        )
      }
      return null
    },
    [],
  )

  const saveAuthor = useCallback(async (author: Author) => {
    if (!isFirebaseConfigured) {
      initLocalIfEmpty()
      const all = readLocal()
      const idx = all.findIndex((a) => a.id === author.id)
      if (idx !== -1) {
        all[idx] = author
      } else {
        all.push(author)
      }
      writeLocal(all)
      setAuthors(all)
    }
  }, [])

  const removeAuthor = useCallback(async (id: string) => {
    if (!isFirebaseConfigured) {
      initLocalIfEmpty()
      const filtered = readLocal().filter((a) => a.id !== id)
      writeLocal(filtered)
      setAuthors(filtered)
    }
  }, [])

  useEffect(() => {
    fetchAuthors()
  }, [fetchAuthors])

  return { authors, loading, fetchAuthors, getAuthor, getAuthorByName, saveAuthor, removeAuthor }
}
