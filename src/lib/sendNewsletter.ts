import { api } from './api'

export async function sendNewsletterEmails(input: {
  subject: string
  html: string
  previewText?: string
  emails: string[]
  live?: boolean
}): Promise<{ sent: number; demo?: boolean }> {
  const emails = [...new Set(input.emails.map((e) => e.trim().toLowerCase()).filter(Boolean))]
  if (emails.length === 0) {
    throw new Error('No subscribers to send to')
  }

  const data = await api<{ sent: number }>('/api/newsletter/send', {
    method: 'POST',
    body: JSON.stringify({
      subject: input.subject,
      html: input.html,
      previewText: input.previewText || '',
      emails,
    }),
  })
  return { sent: data.sent ?? emails.length }
}

export async function getNewsletterSendStatus(): Promise<{
  configured: boolean
  localDev: boolean
  from: string
}> {
  try {
    const data = await api<{ configured?: boolean; from?: string }>('/api/newsletter/status')
    return {
      configured: Boolean(data.configured),
      localDev: import.meta.env.DEV,
      from: data.from || '',
    }
  } catch {
    return { configured: false, localDev: import.meta.env.DEV, from: '' }
  }
}
