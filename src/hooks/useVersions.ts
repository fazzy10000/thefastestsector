import { useState, useCallback } from 'react'
import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import type { ArticleVersion } from '../lib/types'

const LS_PREFIX = 'tfs_versions_'

function readLocalVersions(articleId: string): ArticleVersion[] {
  try {
    const raw = localStorage.getItem(LS_PREFIX + articleId)
    if (!raw) return []
    return JSON.parse(raw) as ArticleVersion[]
  } catch {
    return []
  }
}

function writeLocalVersions(articleId: string, versions: ArticleVersion[]) {
  localStorage.setItem(LS_PREFIX + articleId, JSON.stringify(versions))
}

export function useVersions(articleId: string | undefined) {
  const [versions, setVersions] = useState<ArticleVersion[]>([])
  const [loading, setLoading] = useState(false)

  const fetchVersions = useCallback(async () => {
    if (!articleId) return []
    setLoading(true)

    if (!isFirebaseConfigured || !db) {
      const data = readLocalVersions(articleId)
      data.sort((a, b) => b.editedAt - a.editedAt)
      setVersions(data)
      setLoading(false)
      return data
    }

    try {
      const q = query(
        collection(db, 'articles', articleId, 'versions'),
        orderBy('editedAt', 'desc'),
      )
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map((d) => d.data() as ArticleVersion)
      setVersions(data)
      return data
    } catch (err) {
      console.error('Error fetching versions:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [articleId])

  const saveVersion = useCallback(
    async (version: ArticleVersion) => {
      if (!articleId) return

      if (!isFirebaseConfigured || !db) {
        const all = readLocalVersions(articleId)
        all.unshift(version)
        if (all.length > 50) all.length = 50
        writeLocalVersions(articleId, all)
        setVersions(all)
        return
      }

      await addDoc(collection(db, 'articles', articleId, 'versions'), version)
    },
    [articleId],
  )

  return { versions, loading, fetchVersions, saveVersion }
}
