import type { Env, SessionUser, UserRole } from './env'
import { COOKIE_NAME, SESSION_TTL_MS } from './env'

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let s = ''
  for (const b of arr) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromB64url(s: string): Uint8Array {
  const pad = '='.repeat((4 - (s.length % 4)) % 4)
  const b64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function hmacKey(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    key,
    256,
  )
  return `pbkdf2$${b64url(salt)}$${b64url(bits)}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, saltB64, hashB64] = stored.split('$')
  if (algo !== 'pbkdf2' || !saltB64 || !hashB64) return false
  const salt = fromB64url(saltB64)
  const expected = fromB64url(hashB64)
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    key,
    256,
  )
  const actual = new Uint8Array(bits)
  if (actual.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i]
  return diff === 0
}

export async function createSessionToken(user: SessionUser, secret: string): Promise<string> {
  const payload = {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    exp: Date.now() + SESSION_TTL_MS,
  }
  const body = b64url(new TextEncoder().encode(JSON.stringify(payload)))
  const key = await hmacKey(secret)
  const sig = b64url(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)))
  return `${body}.${sig}`
}

export async function readSessionToken(token: string, secret: string): Promise<SessionUser | null> {
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const key = await hmacKey(secret)
  const expected = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)))
  const actual = fromB64url(sig)
  if (expected.length !== actual.length) return null
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected[i] ^ actual[i]
  if (diff !== 0) return null
  try {
    const json = new TextDecoder().decode(fromB64url(body))
    const payload = JSON.parse(json) as SessionUser & { exp: number }
    if (!payload.exp || payload.exp < Date.now()) return null
    if (!payload.id || !payload.email || !payload.role) return null
    return {
      id: payload.id,
      email: payload.email,
      displayName: payload.displayName || '',
      role: payload.role as UserRole,
    }
  } catch {
    return null
  }
}

export function sessionCookie(token: string, secure: boolean): string {
  const maxAge = Math.floor(SESSION_TTL_MS / 1000)
  const parts = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ]
  if (secure) parts.push('Secure')
  return parts.join('; ')
}

export function clearSessionCookie(secure: boolean): string {
  const parts = [`${COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0']
  if (secure) parts.push('Secure')
  return parts.join('; ')
}

export function getCookie(request: Request, name: string): string | null {
  const raw = request.headers.get('Cookie') || ''
  for (const part of raw.split(';')) {
    const [k, ...rest] = part.trim().split('=')
    if (k === name) return rest.join('=')
  }
  return null
}

export async function getSessionUser(request: Request, env: Env): Promise<SessionUser | null> {
  const secret = env.SESSION_SECRET
  if (!secret) return null
  const token = getCookie(request, COOKIE_NAME)
  if (!token) return null
  return readSessionToken(token, secret)
}

export type AuthAction =
  | 'manage_users'
  | 'manage_authors'
  | 'edit_any_article'
  | 'edit_own_article'
  | 'publish_article'
  | 'manage_settings'
  | 'manage_seo'
  | 'manage_quizzes'
  | 'manage_newsletter'
  | 'manage_media'
  | 'manage_ads'
  | 'view_stats'

export function can(role: UserRole, action: AuthAction): boolean {
  switch (action) {
    case 'manage_users':
      return role === 'admin'
    case 'manage_settings':
    case 'manage_seo':
      return role === 'admin' || role === 'seo'
    case 'manage_authors':
    case 'edit_any_article':
    case 'publish_article':
    case 'manage_newsletter':
    case 'manage_ads':
      return role === 'admin' || role === 'editor'
    case 'manage_quizzes':
    case 'manage_media':
    case 'edit_own_article':
    case 'view_stats':
      return role === 'admin' || role === 'editor' || role === 'author' || role === 'seo'
    default:
      return false
  }
}

export async function requireUser(
  request: Request,
  env: Env,
  action?: AuthAction,
): Promise<{ user: SessionUser } | { error: Response }> {
  const user = await getSessionUser(request, env)
  if (!user) {
    return { error: Response.json({ error: 'Sign in required' }, { status: 401 }) }
  }
  if (action && !can(user.role, action)) {
    return { error: Response.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { user }
}
