import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { MediaAsset } from '../lib/types'

export type MediaListMeta = { total: number; page: number; limit: number }

export function useMediaLibrary(opts?: { autoFetch?: boolean; pageSize?: number }) {
  const autoFetch = opts?.autoFetch !== false
  const defaultPageSize = opts?.pageSize ?? 24
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [meta, setMeta] = useState<MediaListMeta>({ total: 0, page: 1, limit: defaultPageSize })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAssets = useCallback(
    async (params?: { page?: number; limit?: number; q?: string }) => {
      setLoading(true)
      try {
        const qs = new URLSearchParams()
        const page = params?.page ?? 1
        const limit = params?.limit ?? defaultPageSize
        qs.set('page', String(page))
        qs.set('limit', String(limit))
        if (params?.q) qs.set('q', params.q)
        const data = await api<{
          assets: MediaAsset[]
          total?: number
          page?: number
          limit?: number
        }>(`/api/media?${qs}`)
        setAssets(data.assets)
        setMeta({
          total: data.total ?? data.assets.length,
          page: data.page ?? page,
          limit: data.limit ?? limit,
        })
        setError('')
        return data.assets
      } catch (err) {
        setAssets([])
        setMeta({ total: 0, page: 1, limit: defaultPageSize })
        setError(err instanceof Error ? err.message : 'Could not load media library.')
        return []
      } finally {
        setLoading(false)
      }
    },
    [defaultPageSize],
  )

  const createAsset = useCallback(
    async (input: Omit<MediaAsset, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!input.url?.trim()) throw new Error('Upload returned no image URL.')
      const data = await api<{ asset: MediaAsset }>('/api/media', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      setAssets((prev) => [data.asset, ...prev.filter((a) => a.id !== data.asset.id)].slice(0, defaultPageSize))
      setMeta((m) => ({ ...m, total: m.total + 1 }))
      setError('')
      return data.asset
    },
    [defaultPageSize],
  )

  const updateAsset = useCallback(
    async (id: string, patch: Partial<Pick<MediaAsset, 'name' | 'alt' | 'tags' | 'url'>>) => {
      await api(`/api/media/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      })
      await fetchAssets({ page: meta.page, limit: meta.limit })
    },
    [fetchAssets, meta.page, meta.limit],
  )

  const removeAsset = useCallback(
    async (id: string) => {
      await api(`/api/media/${id}`, { method: 'DELETE' })
      const nextPage = assets.length <= 1 && meta.page > 1 ? meta.page - 1 : meta.page
      await fetchAssets({ page: nextPage, limit: meta.limit })
    },
    [fetchAssets, assets.length, meta.page, meta.limit],
  )

  useEffect(() => {
    if (autoFetch) void fetchAssets({ page: 1, limit: defaultPageSize })
  }, [autoFetch, fetchAssets, defaultPageSize])

  return { assets, meta, loading, error, fetchAssets, createAsset, updateAsset, removeAsset }
}
