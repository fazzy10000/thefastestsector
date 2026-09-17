const enc = new TextEncoder()

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let binary = ''
  for (const b of arr) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  const binary = atob(padded + pad)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

/** Stable signed token for one-click unsubscribe links (no DB column needed). */
export async function makeUnsubscribeToken(email: string, secret: string): Promise<string> {
  const normalized = email.trim().toLowerCase()
  const key = await hmacKey(secret)
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`unsubscribe:${normalized}`))
  return toBase64Url(sig)
}

export async function verifyUnsubscribeToken(
  email: string,
  token: string,
  secret: string,
): Promise<boolean> {
  if (!email || !token || !secret) return false
  try {
    const normalized = email.trim().toLowerCase()
    const key = await hmacKey(secret)
    const sig = fromBase64Url(token)
    // Copy into a fresh ArrayBuffer-backed view for Web Crypto typings
    const sigCopy = new Uint8Array(sig)
    return crypto.subtle.verify('HMAC', key, sigCopy, enc.encode(`unsubscribe:${normalized}`))
  } catch {
    return false
  }
}

export function buildUnsubscribeUrl(siteOrigin: string, email: string, token: string): string {
  const base = siteOrigin.replace(/\/$/, '')
  const params = new URLSearchParams({
    e: email.trim().toLowerCase(),
    t: token,
  })
  return `${base}/unsubscribe?${params}`
}

export const SITE_ORIGIN = 'https://thefastestsector.com'
