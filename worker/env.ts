export type UserRole = 'admin' | 'editor' | 'author' | 'seo'

export interface Env {
  DB: D1Database
  IMAGES: R2Bucket
  ASSETS: Fetcher
  R2_PUBLIC_URL: string
  SESSION_SECRET: string
  RESEND_API_KEY?: string
  NEWSLETTER_FROM?: string
  NEWSLETTER_ALLOW_DEMO_SEND?: string
  NEWSLETTER_DEV_KEY?: string
}

export interface SessionUser {
  id: string
  email: string
  displayName: string
  role: UserRole
}

export const COOKIE_NAME = 'tfs_session'
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14
