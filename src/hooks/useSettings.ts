import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import { mergeSettings } from '../lib/mergeSettings'
import { DEFAULT_SETTINGS, type SiteSettings } from '../lib/types'

export function useSettings() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api<{ settings: SiteSettings }>('/api/settings')
      setSettings(mergeSettings(data.settings))
      return mergeSettings(data.settings)
    } catch {
      setSettings(DEFAULT_SETTINGS)
      return DEFAULT_SETTINGS
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchSettings()
  }, [fetchSettings])

  const saveSettings = useCallback(
    async (next: SiteSettings) => {
      await api('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(next),
      })
      setSettings(next)
    },
    [],
  )

  return { settings, loading, fetchSettings, saveSettings }
}
