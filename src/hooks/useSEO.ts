import { useState, useEffect, useCallback, useRef } from 'react'
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import type { ArticleSEOOverride, GlobalSEOSettings } from '../lib/types'
import { DEFAULT_SEO_SETTINGS } from '../lib/types'

const SETTINGS_COLLECTION = 'seo_settings'
const SETTINGS_DOC_ID = 'global'
const OVERRIDES_COLLECTION = 'seo_overrides'
const LS_SETTINGS = 'tfs_seo_settings'
const LS_OVERRIDES = 'tfs_seo_overrides'

function emptyOverride(): ArticleSEOOverride {
  return { metaTitle: '', metaDescription: '', focusKeyphrase: '', noIndex: false }
}

function mergeSettings(raw: Partial<GlobalSEOSettings> | null): GlobalSEOSettings {
  if (!raw) return { ...DEFAULT_SEO_SETTINGS }
  return {
    ...DEFAULT_SEO_SETTINGS,
    ...raw,
    robotsDirectives: {
      ...DEFAULT_SEO_SETTINGS.robotsDirectives,
      ...raw.robotsDirectives,
    },
  }
}

function readLocalSettings(): GlobalSEOSettings {
  try {
    const raw = localStorage.getItem(LS_SETTINGS)
    if (!raw) return { ...DEFAULT_SEO_SETTINGS }
    return mergeSettings(JSON.parse(raw) as Partial<GlobalSEOSettings>)
  } catch {
    return { ...DEFAULT_SEO_SETTINGS }
  }
}

function readLocalOverrides(): Record<string, ArticleSEOOverride> {
  try {
    const raw = localStorage.getItem(LS_OVERRIDES)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, Partial<ArticleSEOOverride>>
    const out: Record<string, ArticleSEOOverride> = {}
    for (const [id, v] of Object.entries(parsed)) {
      out[id] = { ...emptyOverride(), ...v }
    }
    return out
  } catch {
    return {}
  }
}

function writeLocalOverrides(map: Record<string, ArticleSEOOverride>) {
  localStorage.setItem(LS_OVERRIDES, JSON.stringify(map))
}

export function useSEO() {
  const [settings, setSettings] = useState<GlobalSEOSettings>(DEFAULT_SEO_SETTINGS)
  const [overrides, setOverrides] = useState<Record<string, ArticleSEOOverride>>({})
  const overridesRef = useRef(overrides)
  overridesRef.current = overrides
  const [loading, setLoading] = useState(true)

  const fetchSettings = useCallback(async () => {
    if (!isFirebaseConfigured || !db) {
      setSettings(readLocalSettings())
      return
    }
    try {
      const snap = await getDoc(doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID))
      if (snap.exists()) {
        setSettings(mergeSettings(snap.data() as Partial<GlobalSEOSettings>))
      } else {
        setSettings({ ...DEFAULT_SEO_SETTINGS })
      }
    } catch (err) {
      console.error('useSEO fetchSettings:', err)
      setSettings(readLocalSettings())
    }
  }, [])

  const saveSettings = useCallback(async (data: GlobalSEOSettings) => {
    const merged = mergeSettings(data)
    if (!isFirebaseConfigured || !db) {
      localStorage.setItem(LS_SETTINGS, JSON.stringify(merged))
      setSettings(merged)
      return
    }
    await setDoc(doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID), merged)
    setSettings(merged)
  }, [])

  const fetchOverrides = useCallback(async () => {
    if (!isFirebaseConfigured || !db) {
      const local = readLocalOverrides()
      overridesRef.current = local
      setOverrides(local)
      return
    }
    try {
      const snap = await getDocs(collection(db, OVERRIDES_COLLECTION))
      const map: Record<string, ArticleSEOOverride> = {}
      snap.forEach((d) => {
        map[d.id] = { ...emptyOverride(), ...(d.data() as Partial<ArticleSEOOverride>) }
      })
      overridesRef.current = map
      setOverrides(map)
    } catch (err) {
      console.error('useSEO fetchOverrides:', err)
      const fallback = readLocalOverrides()
      overridesRef.current = fallback
      setOverrides(fallback)
    }
  }, [])

  const saveOverride = useCallback(async (articleId: string, data: Partial<ArticleSEOOverride>) => {
    const prev = overridesRef.current[articleId] ?? emptyOverride()
    const merged: ArticleSEOOverride = { ...prev, ...data }
    const next = { ...overridesRef.current, [articleId]: merged }
    overridesRef.current = next
    setOverrides(next)
    if (!isFirebaseConfigured || !db) {
      writeLocalOverrides(next)
      return
    }
    await setDoc(doc(db, OVERRIDES_COLLECTION, articleId), merged)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      await Promise.all([fetchSettings(), fetchOverrides()])
      if (!cancelled) setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [fetchSettings, fetchOverrides])

  return {
    settings,
    overrides,
    loading,
    fetchSettings,
    saveSettings,
    fetchOverrides,
    saveOverride,
  }
}
