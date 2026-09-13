export const MEDIA_ACCEPT =
  'image/*,image/gif,video/mp4,video/webm,video/quicktime,video/x-m4v,.gif,.mp4,.webm,.mov,.m4v'

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv)(\?|$)/i

export function isVideoUrl(url: string): boolean {
  if (!url) return false
  if (url.startsWith('data:video/')) return true
  return VIDEO_EXT.test(url)
}

export function isVideoFile(file: File): boolean {
  if (file.type.startsWith('video/')) return true
  return VIDEO_EXT.test(file.name)
}

export function isAllowedMediaFile(file: File): boolean {
  if (file.type.startsWith('image/') || file.type.startsWith('video/')) return true
  return /\.(gif|jpe?g|png|webp|avif|svg|mp4|webm|mov|m4v)$/i.test(file.name)
}

export function mediaKindLabel(url: string): 'video' | 'image' {
  return isVideoUrl(url) ? 'video' : 'image'
}
