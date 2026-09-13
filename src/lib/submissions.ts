import { api } from './api'

export type ContactPayload = {
  name: string
  email: string
  subject: string
  foundUs?: string
  message: string
}

export type NewsletterPayload = {
  email: string
  source: 'footer' | 'home' | 'sector-sweep' | 'navbar'
  edition?: string
}

export type JoinPayload = {
  firstName: string
  lastName: string
  email: string
  instagram?: string
  role: 'writer' | 'creator' | 'suggest' | string
  why: string
  portfolioUrl?: string
}

export async function submitContact(payload: ContactPayload) {
  await api('/api/contact', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      email: payload.email.trim().toLowerCase(),
    }),
  })
  return { ok: true as const, demo: false }
}

export async function submitNewsletter(payload: NewsletterPayload) {
  await api('/api/newsletter/subscribe', {
    method: 'POST',
    body: JSON.stringify({
      email: payload.email.trim().toLowerCase(),
      source: payload.source,
      edition: payload.edition || 'all',
    }),
  })
  return { ok: true as const, demo: false }
}

export async function submitJoinApplication(payload: JoinPayload) {
  await api('/api/join', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      email: payload.email.trim().toLowerCase(),
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
    }),
  })
  return { ok: true as const, demo: false }
}
