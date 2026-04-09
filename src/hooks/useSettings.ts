import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { SiteSettings } from '../lib/types'
import { DEFAULT_SETTINGS } from '../lib/types'

const DOC_PATH = 'settings'
const DOC_ID = 'site'

export function useSettings() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  const fetchSettings = useCallback(async () => {
    if (!db) {
      setLoading(false)
      return
    }
    try {
      const snap = await getDoc(doc(db, DOC_PATH, DOC_ID))
      if (snap.exists()) {
        setSettings(snap.data() as SiteSettings)
      }
    } catch {
      // use defaults
    } finally {
      setLoading(false)
    }
  }, [])

  const saveSettings = useCallback(async (data: SiteSettings) => {
    if (!db) throw new Error('Firebase not configured')
    await setDoc(doc(db, DOC_PATH, DOC_ID), data)
    setSettings(data)
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  return { settings, loading, saveSettings, fetchSettings }
}
