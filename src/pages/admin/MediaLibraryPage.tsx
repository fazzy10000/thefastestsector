import { useRef, useState } from 'react'
import { Copy, Image as ImageIcon, Loader2, Pencil, Trash2, Upload } from 'lucide-react'
import ImageTools from '../../components/admin/ImageTools'
import Pagination from '../../components/Pagination'
import { useAuth } from '../../hooks/useAuth'
import { useImageUpload } from '../../hooks/useImageUpload'
import { useMediaLibrary } from '../../hooks/useMediaLibrary'
import { isVideoUrl, MEDIA_ACCEPT } from '../../lib/mediaFiles'
import type { MediaAsset } from '../../lib/types'

function MediaThumb({ asset, className }: { asset: MediaAsset; className?: string }) {
  if (isVideoUrl(asset.url)) {
    return (
      <video
        src={asset.url}
        className={className}
        muted
        playsInline
        preload="metadata"
      />
    )
  }
  return <img src={asset.url} alt={asset.alt || asset.name} className={className} />
}

const PAGE_SIZE = 24

export default function MediaLibraryPage() {
  const { uid } = useAuth()
  const { assets, meta, loading, error: libraryError, createAsset, updateAsset, removeAsset, fetchAssets } =
    useMediaLibrary({ pageSize: PAGE_SIZE })
  const { uploadImage, uploading } = useImageUpload()
  const fileRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<'library' | 'tools'>('library')
  const [editing, setEditing] = useState<MediaAsset | null>(null)
  const [name, setName] = useState('')
  const [alt, setAlt] = useState('')
  const [tags, setTags] = useState('')
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState('')
  const displayError = error || libraryError

  const startEdit = (asset: MediaAsset) => {
    setEditing(asset)
    setName(asset.name)
    setAlt(asset.alt)
    setTags(asset.tags.join(', '))
  }

  const saveEdit = async () => {
    if (!editing) return
    await updateAsset(editing.id, {
      name: name.trim() || 'Untitled',
      alt: alt.trim(),
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    })
    setEditing(null)
  }

  const handleUpload = async (file: File) => {
    setError('')
    try {
      const url = await uploadImage(file)
      if (!url) throw new Error('Upload returned no URL. Check /api/upload response.')
      await createAsset({
        url,
        name: file.name.replace(/\.[^.]+$/, ''),
        alt: file.name.replace(/\.[^.]+$/, ''),
        tags: isVideoUrl(url) ? ['video'] : [],
        createdBy: uid || '',
      })
      await fetchAssets({ page: 1, limit: PAGE_SIZE })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Media library</h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload images, GIFs, and videos once, then reuse them in articles, quizzes, and newsletters.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab('library')}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${tab === 'library' ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-700'}`}
          >
            Library
          </button>
          <button
            type="button"
            onClick={() => setTab('tools')}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${tab === 'tools' ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-700'}`}
          >
            Image tools
          </button>
        </div>
      </div>

      {tab === 'tools' ? (
        <div className="max-w-3xl">
          <p className="text-sm text-gray-500 mb-4">
            Edit an image, then click Use Image to save the result into the library.
          </p>
          <ImageTools
            onApply={async (dataUrl) => {
              await createAsset({
                url: dataUrl,
                name: 'Edited image',
                alt: '',
                tags: ['edited'],
                createdBy: uid || '',
              })
              setTab('library')
            }}
          />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 mb-4">
            <p className="text-sm text-gray-500">{meta.total} item{meta.total === 1 ? '' : 's'}</p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-60"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Upload
            </button>
            <input
              ref={fileRef}
              type="file"
              accept={MEDIA_ACCEPT}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleUpload(file)
                e.target.value = ''
              }}
            />
          </div>
          {displayError && <p className="text-sm text-red-600 mb-3">{displayError}</p>}

          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : assets.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">The library is empty.</p>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
              >
                <Upload className="w-4 h-4" />
                Upload the first file
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {assets.map((asset) => (
                <div key={asset.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="relative">
                    <MediaThumb asset={asset} className="w-full h-36 object-cover bg-gray-100" />
                    {isVideoUrl(asset.url) && (
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/70 text-white">
                        Video
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 truncate">{asset.name || 'Untitled'}</p>
                    <p className="text-xs text-gray-400 truncate">{asset.alt || 'No alt text'}</p>
                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => startEdit(asset)}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(asset.url)
                          setCopiedId(asset.id)
                          window.setTimeout(() => setCopiedId(''), 1500)
                        }}
                        className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50"
                        aria-label="Copy URL"
                        title={copiedId === asset.id ? 'Copied' : 'Copy URL'}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Remove this item from the library? Content already using it will keep the URL.')) {
                            void removeAsset(asset.id)
                          }
                        }}
                        className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg text-red-600 hover:bg-red-50"
                        aria-label="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Pagination
            variant="admin"
            className="mt-6"
            page={meta.page}
            total={meta.total}
            pageSize={PAGE_SIZE}
            onChange={(p) => void fetchAssets({ page: p, limit: PAGE_SIZE })}
          />
        </>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Edit media</h2>
            <MediaThumb asset={editing} className="w-full h-40 object-cover rounded-lg mb-4 bg-gray-100" />
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mb-3 px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <label className="block text-sm font-medium text-gray-700 mb-1">Alt text</label>
            <input
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              className="w-full mb-3 px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full mb-4 px-3 py-2 border border-gray-200 rounded-lg text-sm"
              placeholder="f1, hero, paddock"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg">
                Cancel
              </button>
              <button type="button" onClick={() => void saveEdit()} className="px-4 py-2 text-sm bg-primary text-white rounded-lg">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
