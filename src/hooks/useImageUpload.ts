import { useState, useCallback } from 'react'
import { isAllowedMediaFile, isVideoFile } from '../lib/mediaFiles'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined
const isCloudinaryConfigured = Boolean(CLOUD_NAME && UPLOAD_PRESET)

export function cloudinaryUrl(
  url: string,
  transforms: string = 'w_800,f_auto,q_auto',
): string {
  if (!url || !url.includes('res.cloudinary.com')) return url
  return url.replace('/upload/', `/upload/${transforms}/`)
}

export function useImageUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const uploadImage = useCallback(async (file: File): Promise<string> => {
    if (!isAllowedMediaFile(file)) {
      throw new Error('Please upload an image, GIF, or video (MP4, WebM, MOV).')
    }

    setUploading(true)
    setProgress(0)

    // Cloudinary image endpoint can't take video — use R2 for videos (and when Cloudinary isn't set)
    if (isCloudinaryConfigured && !isVideoFile(file)) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', UPLOAD_PRESET!)
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          { method: 'POST', body: formData },
        )
        if (!res.ok) throw new Error('Cloudinary upload failed')
        const data = await res.json()
        setProgress(100)
        return data.secure_url as string
      } finally {
        setUploading(false)
      }
    }

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string }
      if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`)
      if (!data.url) throw new Error('Upload succeeded but returned no URL.')
      setProgress(100)
      return data.url
    } finally {
      setUploading(false)
    }
  }, [])

  return { uploadImage, uploading, progress, isCloudinaryConfigured }
}
