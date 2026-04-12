import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  query,
  orderBy,
  where,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  type QueryConstraint,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import { SAMPLE_QUIZZES } from '../lib/sampleQuizzes'
import type { Quiz, Category } from '../lib/types'

const COLLECTION = 'quizzes'
const LS_KEY = 'tfs_quizzes'
const LS_VERSION_KEY = 'tfs_quizzes_v'
const CURRENT_VERSION = '1'

function readLocal(): Quiz[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const data = JSON.parse(raw) as Quiz[]
    return data
      .filter((q) => q && q.id && q.title && q.slug && Array.isArray(q.questions))
      .map((q) => ({
        ...q,
        status: q.status === 'draft' || q.status === 'published' ? q.status : 'draft',
        createdAt: q.createdAt || Date.now(),
        updatedAt: q.updatedAt || Date.now(),
      }))
  } catch {
    localStorage.removeItem(LS_KEY)
    localStorage.removeItem(LS_VERSION_KEY)
    return []
  }
}

function writeLocal(quizzes: Quiz[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(quizzes))
}

function initLocalIfEmpty() {
  if (!localStorage.getItem(LS_KEY) || localStorage.getItem(LS_VERSION_KEY) !== CURRENT_VERSION) {
    writeLocal(SAMPLE_QUIZZES)
    localStorage.setItem(LS_VERSION_KEY, CURRENT_VERSION)
  }
}

export function useQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)

  const fetchQuizzes = useCallback(async (opts?: {
    category?: Category
    status?: 'draft' | 'published'
  }) => {
    if (!isFirebaseConfigured || !db) {
      initLocalIfEmpty()
      let data = readLocal()
      if (opts?.status) data = data.filter((q) => q.status === opts.status)
      if (opts?.category) data = data.filter((q) => q.category === opts.category)
      data.sort((a, b) => b.createdAt - a.createdAt)
      setQuizzes(data)
      setLoading(false)
      return data
    }

    setLoading(true)
    try {
      const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')]
      const q = query(collection(db!, COLLECTION), ...constraints)
      const snapshot = await getDocs(q)
      let data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Quiz))

      if (opts?.status) data = data.filter((q) => q.status === opts.status)
      if (opts?.category) data = data.filter((q) => q.category === opts.category)

      setQuizzes(data)
      return data
    } catch (err) {
      console.error('Error fetching quizzes from Firestore:', err)
      initLocalIfEmpty()
      let data = readLocal()
      if (opts?.status) data = data.filter((q) => q.status === opts.status)
      if (opts?.category) data = data.filter((q) => q.category === opts.category)
      data.sort((a, b) => b.createdAt - a.createdAt)
      setQuizzes(data)
      return data
    } finally {
      setLoading(false)
    }
  }, [])

  const getQuiz = useCallback(async (id: string): Promise<Quiz | null> => {
    if (!isFirebaseConfigured || !db) {
      initLocalIfEmpty()
      return readLocal().find((q) => q.id === id) ?? null
    }
    try {
      const snap = await getDoc(doc(db!, COLLECTION, id))
      if (!snap.exists()) return null
      return { id: snap.id, ...snap.data() } as Quiz
    } catch {
      return null
    }
  }, [])

  const getQuizBySlug = useCallback(async (slug: string): Promise<Quiz | null> => {
    if (!isFirebaseConfigured || !db) {
      initLocalIfEmpty()
      return readLocal().find((q) => q.slug === slug) ?? null
    }
    try {
      const q = query(collection(db!, COLLECTION), where('slug', '==', slug))
      const snapshot = await getDocs(q)
      if (snapshot.empty) return null
      const d = snapshot.docs[0]
      return { id: d.id, ...d.data() } as Quiz
    } catch {
      initLocalIfEmpty()
      return readLocal().find((q) => q.slug === slug) ?? null
    }
  }, [])

  const createQuiz = useCallback(async (data: Omit<Quiz, 'id'>) => {
    if (!isFirebaseConfigured || !db) {
      initLocalIfEmpty()
      const all = readLocal()
      const newId = crypto.randomUUID()
      all.unshift({ ...data, id: newId } as Quiz)
      writeLocal(all)
      return newId
    }
    const docRef = await addDoc(collection(db!, COLLECTION), data)
    return docRef.id
  }, [])

  const updateQuiz = useCallback(async (id: string, data: Partial<Quiz>) => {
    if (!isFirebaseConfigured || !db) {
      initLocalIfEmpty()
      const all = readLocal()
      const idx = all.findIndex((q) => q.id === id)
      if (idx !== -1) {
        all[idx] = { ...all[idx], ...data }
        writeLocal(all)
      }
      return
    }
    await updateDoc(doc(db!, COLLECTION, id), data as Record<string, unknown>)
  }, [])

  const removeQuiz = useCallback(async (id: string) => {
    if (!isFirebaseConfigured || !db) {
      initLocalIfEmpty()
      writeLocal(readLocal().filter((q) => q.id !== id))
      return
    }
    await deleteDoc(doc(db!, COLLECTION, id))
  }, [])

  useEffect(() => {
    fetchQuizzes({ status: 'published' })
  }, [fetchQuizzes])

  return {
    quizzes,
    loading,
    fetchQuizzes,
    getQuiz,
    getQuizBySlug,
    createQuiz,
    updateQuiz,
    removeQuiz,
  }
}
