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
import { db } from '../lib/firebase'
import type { Article, Category } from '../lib/types'

const COLLECTION = 'articles'

export function useArticles() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  const fetchArticles = useCallback(async (opts?: {
    category?: Category
    status?: 'draft' | 'published'
    limit?: number
    featured?: boolean
  }) => {
    if (!db) {
      setLoading(false)
      return []
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
    if (!db) return null
    try {
      const snap = await getDoc(doc(db, COLLECTION, id))
      if (!snap.exists()) return null
      return { id: snap.id, ...snap.data() } as Article
    } catch {
      return null
    }
  }, [])

  const getArticleBySlug = useCallback(async (slug: string): Promise<Article | null> => {
    if (!db) return null
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
    if (!db) throw new Error('Firebase not configured')
    const docRef = await addDoc(collection(db, COLLECTION), data)
    return docRef.id
  }, [])

  const updateArticle = useCallback(async (id: string, data: Partial<Article>) => {
    if (!db) throw new Error('Firebase not configured')
    await updateDoc(doc(db, COLLECTION, id), data)
  }, [])

  const removeArticle = useCallback(async (id: string) => {
    if (!db) throw new Error('Firebase not configured')
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
