import { useState, useCallback } from 'react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage, isFirebaseConfigured } from '../lib/firebase'

export function useImageUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const uploadImage = useCallback(async (file: File): Promise<string> => {
    setUploading(true)
    setProgress(0)

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

  return { uploadImage, uploading, progress }
}
