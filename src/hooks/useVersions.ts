import { useState, useCallback, useEffect } from 'react'
import { api } from '../lib/api'
import type { ArticleVersion } from '../lib/types'

export function useVersions(articleId?: string) {
  const [versions, setVersions] = useState<ArticleVersion[]>([])

  const fetchVersions = useCallback(async () => {
    if (!articleId) {
      setVersions([])
      return []
    }
    const data = await api<{ versions: ArticleVersion[] }>(`/api/articles/${articleId}/versions`)
    setVersions(data.versions)
    return data.versions
  }, [articleId])

  const saveVersion = useCallback(
    async (version: ArticleVersion) => {
      if (!articleId) return
      await api(`/api/articles/${articleId}/versions`, {
        method: 'POST',
        body: JSON.stringify(version),
      })
      await fetchVersions()
    },
    [articleId, fetchVersions],
  )

  useEffect(() => {
    if (articleId) void fetchVersions()
  }, [articleId, fetchVersions])

  return { versions, fetchVersions, saveVersion }
}
