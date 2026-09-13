import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import {
  DEFAULT_SEO_SETTINGS,
  type ArticleSEOOverride,
  type GlobalSEOSettings,
} from '../lib/types'

export function useSEO() {
  const [settings, setSettings] = useState<GlobalSEOSettings>(DEFAULT_SEO_SETTINGS)
  const [overrides, setOverrides] = useState<Record<string, ArticleSEOOverride>>({})
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [seo, over] = await Promise.all([
        api<{ settings: GlobalSEOSettings }>('/api/seo/settings'),
        api<{ overrides: Record<string, ArticleSEOOverride> }>('/api/seo/overrides'),
      ])
      setSettings(seo.settings || DEFAULT_SEO_SETTINGS)
      setOverrides(over.overrides || {})
    } catch {
      setSettings(DEFAULT_SEO_SETTINGS)
      setOverrides({})
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchAll()
  }, [fetchAll])

  const saveSettings = useCallback(async (next: GlobalSEOSettings) => {
    await api('/api/seo/settings', {
      method: 'PUT',
      body: JSON.stringify(next),
    })
    setSettings(next)
  }, [])

  const saveOverride = useCallback(async (articleId: string, override: ArticleSEOOverride) => {
    await api(`/api/seo/overrides/${articleId}`, {
      method: 'PUT',
      body: JSON.stringify(override),
    })
    setOverrides((prev) => ({ ...prev, [articleId]: override }))
  }, [])

  return {
    settings,
    loading,
    overrides,
    saveSettings,
    saveOverride,
    fetchAll,
  }
}
