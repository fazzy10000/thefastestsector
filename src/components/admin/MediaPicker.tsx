import { useEffect, useMemo, useRef, useState } from 'react'
import { Image as ImageIcon, Loader2, Search, Upload, X } from 'lucide-react'
import Pagination from '../Pagination'
import { useAuth } from '../../hooks/useAuth'
import { useImageUpload } from '../../hooks/useImageUpload'
import { useMediaLibrary } from '../../hooks/useMediaLibrary'
import { isVideoUrl, MEDIA_ACCEPT } from '../../lib/mediaFiles'
import type { MediaAsset } from '../../lib/types'

interface MediaPickerProps {
  open: boolean
  onClose: () => void
  onSelect: (asset: MediaAsset) => void
  title?: string
  /** When true, videos are hidden (e.g. featured image / ad creatives). */
  imagesOnly?: boolean
}

function MediaThumb({ asset }: { asset: MediaAsset }) {
  if (isVideoUrl(asset.url)) {
    return (
      <video
        src={asset.url}
        className="w-full h-28 object-cover bg-gray-100"
        muted
        playsInline
        preload="metadata"
      />
    )
  }
  return (
    <img src={asset.url} alt={asset.alt || asset.name} className="w-full h-28 object-cover bg-gray-100" />
  )
}

const PAGE_SIZE = 24

export default function MediaPicker({
  open,
  onClose,
  onSelect,
  title = 'Media library',
  imagesOnly = false,
}: MediaPickerProps) {
  const { uid } = useAuth()
  const { assets, meta, loading, createAsset, fetchAssets } = useMediaLibrary({
    autoFetch: false,
    pageSize: PAGE_SIZE,
  })
  const { uploadImage, uploading } = useImageUpload()
  const fileRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(query.trim()), 250)
    return () => window.clearTimeout(t)
  }, [query])

  useEffect(() => {
    setPage(1)
  }, [debouncedQ, open])

  useEffect(() => {
    if (open) void fetchAssets({ page, limit: PAGE_SIZE, q: debouncedQ || undefined })
  }, [open, page, debouncedQ, fetchAssets])

  const visible = useMemo(() => {
    if (!imagesOnly) return assets
    return assets.filter((a) => !isVideoUrl(a.url))
  }, [assets, imagesOnly])

  if (!open) return null

  const handleUpload = async (file: File) => {
    setError('')
    try {
      if (imagesOnly && file.type.startsWith('video/')) {
        setError('This picker only accepts images and GIFs.')
        return
      }
      const url = await uploadImage(file)
      const asset = await createAsset({
        url,
        name: file.name.replace(/\.[^.]+$/, ''),
        alt: file.name.replace(/\.[^.]+$/, ''),
        tags: isVideoUrl(url) ? ['video'] : [],
        createdBy: uid || '',
      })
      onSelect(asset)
      onClose()
    } catch {
      setError('Could not upload that file.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button type="button" onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-3 flex flex-col sm:flex-row gap-2 border-b border-gray-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, alt text, tags"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-60"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Upload new
          </button>
          <input
            ref={fileRef}
            type="file"
            accept={imagesOnly ? 'image/*,image/gif,.gif' : MEDIA_ACCEPT}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleUpload(file)
              e.target.value = ''
            }}
          />
        </div>

        {error && <p className="px-5 pt-3 text-sm text-red-600">{error}</p>}

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <p className="text-sm text-gray-500">Loading library…</p>
          ) : visible.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                {imagesOnly ? 'No images yet. Upload one to start the library.' : 'No media yet. Upload an image, GIF, or video.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {visible.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => {
                    onSelect(asset)
                    onClose()
                  }}
                  className="group text-left rounded-lg border border-gray-200 overflow-hidden hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary relative"
                >
                  <MediaThumb asset={asset} />
                  {isVideoUrl(asset.url) && (
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-black/70 text-white">
                      Video
                    </span>
                  )}
                  <span className="block px-2 py-1.5 text-xs text-gray-700 truncate">{asset.name || 'Untitled'}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-100">
          <Pagination
            variant="admin"
            page={page}
            total={meta.total}
            pageSize={PAGE_SIZE}
            onChange={setPage}
          />
        </div>
      </div>
    </div>
  )
}
