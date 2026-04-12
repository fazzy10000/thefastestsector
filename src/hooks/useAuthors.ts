import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  doc,
  query,
  where,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import { SAMPLE_AUTHORS } from '../lib/sampleAuthors'
import type { Author } from '../lib/types'

const COLLECTION = 'authors'
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
    if (!isFirebaseConfigured || !db) {
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

    setLoading(true)
    try {
      const snapshot = await getDocs(collection(db, COLLECTION))
      const data = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Author))
      setAuthors(data)
      return data
    } catch (err) {
      console.error('Error fetching authors:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const getAuthor = useCallback(async (id: string): Promise<Author | null> => {
    if (!isFirebaseConfigured || !db) {
      initLocalIfEmpty()
      return readLocal().find((a) => a.id === id) ?? null
    }
    try {
      const snap = await getDoc(doc(db, COLLECTION, id))
      if (!snap.exists()) return null
      return { ...snap.data(), id: snap.id } as Author
    } catch {
      return null
    }
  }, [])

  const getAuthorByName = useCallback(
    async (name: string): Promise<Author | null> => {
      if (!isFirebaseConfigured || !db) {
        initLocalIfEmpty()
        return (
          readLocal().find(
            (a) => a.name.toLowerCase() === name.toLowerCase(),
          ) ?? null
        )
      }
      try {
        const q = query(collection(db, COLLECTION), where('name', '==', name))
        const snapshot = await getDocs(q)
        if (snapshot.empty) return null
        const d = snapshot.docs[0]
        return { ...d.data(), id: d.id } as Author
      } catch {
        return null
      }
    },
    [],
  )

  const saveAuthor = useCallback(async (author: Author) => {
    if (!isFirebaseConfigured || !db) {
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
      return
    }
    const { id, ...data } = author
    await setDoc(doc(db, COLLECTION, id), data)
    await fetchAuthors()
  }, [fetchAuthors])

  const removeAuthor = useCallback(async (id: string) => {
    if (!isFirebaseConfigured || !db) {
      initLocalIfEmpty()
      const filtered = readLocal().filter((a) => a.id !== id)
      writeLocal(filtered)
      setAuthors(filtered)
      return
    }
    await deleteDoc(doc(db, COLLECTION, id))
    await fetchAuthors()
  }, [fetchAuthors])

  useEffect(() => {
    fetchAuthors()
  }, [fetchAuthors])

  return { authors, loading, fetchAuthors, getAuthor, getAuthorByName, saveAuthor, removeAuthor }
}
