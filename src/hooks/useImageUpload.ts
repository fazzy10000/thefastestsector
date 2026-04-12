import { useState, useCallback } from 'react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage, isFirebaseConfigured } from '../lib/firebase'

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
    setUploading(true)
    setProgress(0)

    if (isCloudinaryConfigured) {
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

    if (!isFirebaseConfigured || !storage) {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          setProgress(100)
          setUploading(false)
          resolve(reader.result as string)
        }
        reader.readAsDataURL(file)
      })
    }

    try {
      const timestamp = Date.now()
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const storageRef = ref(storage, `images/${timestamp}_${safeName}`)
      await uploadBytes(storageRef, file)
      setProgress(100)
      const url = await getDownloadURL(storageRef)
      return url
    } finally {
      setUploading(false)
    }
  }, [])

  return { uploadImage, uploading, progress, isCloudinaryConfigured }
}
