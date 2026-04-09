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
  limit as fbLimit,
  type QueryConstraint,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import { SAMPLE_ARTICLES } from '../lib/sampleData'
import type { Article, Category } from '../lib/types'

const COLLECTION = 'articles'
const LS_KEY = 'tfs_articles'
const LS_VERSION_KEY = 'tfs_articles_v'
const CURRENT_VERSION = '2'

function readLocal(): Article[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const data = JSON.parse(raw) as Article[]
    return data.map((a) => ({
      ...a,
      contentType: a.contentType || ((a.category as string) === 'opinion' ? 'opinion' : 'news'),
    }))
  } catch {
    return []
  }
}

function writeLocal(articles: Article[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(articles))
}

function initLocalIfEmpty() {
  if (!localStorage.getItem(LS_KEY) || localStorage.getItem(LS_VERSION_KEY) !== CURRENT_VERSION) {
    writeLocal(SAMPLE_ARTICLES)
    localStorage.setItem(LS_VERSION_KEY, CURRENT_VERSION)
  }
}

export function useArticles() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  const fetchArticles = useCallback(async (opts?: {
    category?: Category
    status?: 'draft' | 'published'
    limit?: number
    featured?: boolean
  }) => {
    if (!isFirebaseConfigured || !db) {
      initLocalIfEmpty()
      let data = readLocal()
      if (opts?.status) data = data.filter((a) => a.status === opts.status)
      if (opts?.category) data = data.filter((a) => a.category === opts.category)
      if (opts?.featured !== undefined) data = data.filter((a) => a.featured === opts.featured)
      data.sort((a, b) => b.createdAt - a.createdAt)
      if (opts?.limit) data = data.slice(0, opts.limit)
      setArticles(data)
      setLoading(false)
      return data
    }

    setLoading(true)
    try {
      const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')]
      if (opts?.status) constraints.push(where('status', '==', opts.status))
      if (opts?.category) constraints.push(where('category', '==', opts.category))
      if (opts?.featured !== undefined) constraints.push(where('featured', '==', opts.featured))
      if (opts?.limit) constraints.push(fbLimit(opts.limit))

      const q = query(collection(db, COLLECTION), ...constraints)
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Article))
      setArticles(data)
      return data
    } catch (err) {
      console.error('Error fetching articles:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const getArticle = useCallback(async (id: string): Promise<Article | null> => {
    if (!isFirebaseConfigured || !db) {
      initLocalIfEmpty()
      return readLocal().find((a) => a.id === id) ?? null
    }
    try {
      const snap = await getDoc(doc(db, COLLECTION, id))
      if (!snap.exists()) return null
      return { id: snap.id, ...snap.data() } as Article
    } catch {
      return null
    }
  }, [])

  const getArticleBySlug = useCallback(async (slug: string): Promise<Article | null> => {
    if (!isFirebaseConfigured || !db) {
      initLocalIfEmpty()
      return readLocal().find((a) => a.slug === slug) ?? null
    }
    try {
      const q = query(collection(db, COLLECTION), where('slug', '==', slug))
      const snapshot = await getDocs(q)
      if (snapshot.empty) return null
      const d = snapshot.docs[0]
      return { id: d.id, ...d.data() } as Article
    } catch {
      return null
    }
  }, [])

  const createArticle = useCallback(async (data: Omit<Article, 'id'>) => {
    if (!isFirebaseConfigured || !db) {
      initLocalIfEmpty()
      const all = readLocal()
      const newId = crypto.randomUUID()
      all.unshift({ ...data, id: newId } as Article)
      writeLocal(all)
      return newId
    }
    const docRef = await addDoc(collection(db, COLLECTION), data)
    return docRef.id
  }, [])

  const updateArticle = useCallback(async (id: string, data: Partial<Article>) => {
    if (!isFirebaseConfigured || !db) {
      initLocalIfEmpty()
      const all = readLocal()
      const idx = all.findIndex((a) => a.id === id)
      if (idx !== -1) {
        all[idx] = { ...all[idx], ...data }
        writeLocal(all)
      }
      return
    }
    await updateDoc(doc(db, COLLECTION, id), data)
  }, [])

  const removeArticle = useCallback(async (id: string) => {
    if (!isFirebaseConfigured || !db) {
      initLocalIfEmpty()
      writeLocal(readLocal().filter((a) => a.id !== id))
      return
    }
    await deleteDoc(doc(db, COLLECTION, id))
  }, [])

  useEffect(() => {
    fetchArticles({ status: 'published' })
  }, [fetchArticles])

  return {
    articles,
    loading,
    fetchArticles,
    getArticle,
    getArticleBySlug,
    createArticle,
    updateArticle,
    removeArticle,
  }
}
