import { wrapNewsletterHtml } from './newsletterHtml'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const BATCH_SIZE = 100
const MAX_RECIPIENTS = 2000

export function normalizeRecipientEmails(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return [...new Set(raw.map((e) => String(e).trim().toLowerCase()).filter((e) => EMAIL_RE.test(e)))]
}

/** `"Name" <user@domain>` or a bare address — avoids Resend mis-parsing unquoted display names. */
export function normalizeFromAddress(from: string): string {
  const trimmed = from.trim()
  const angled = trimmed.match(/^(.*?)<([^>]+)>\s*$/)
  if (!angled) return trimmed
  const email = angled[2].trim()
  const name = angled[1].trim().replace(/^["']|["']$/g, '')
  if (!name) return email
  return `"${name.replace(/"/g, '')}" <${email}>`
}

function explainResendError(status: number, message: string, from: string): string {
  const fromLower = from.toLowerCase()
  const usingTestSender = fromLower.includes('@resend.dev')
  const looksLikePlaceholder =
    /example\.com is not verified/i.test(message) || /domain example\.com/i.test(message)

  if (usingTestSender || looksLikePlaceholder) {
    return (
      'Resend’s test sender (beth.t@example.com) can only deliver to the email on your Resend account, or to delivered@resend.dev. ' +
      'Open resend.com/settings and use that exact address in Live send test. ' +
      'Subscriber sends need a verified domain (thefastestsector.com) — that requires DNS you do not have yet.'
    )
  }

  return `Resend rejected the send (${status}): ${message}`
}

async function postResend(
  apiKey: string,
  path: string,
  body: unknown,
): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
  const res = await fetch(`https://api.resend.com${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (res.ok) return { ok: true }
  const detail = await res.text()
  let message = detail.slice(0, 400)
  try {
    const parsed = JSON.parse(detail) as { message?: string }
    if (parsed.message) message = parsed.message
  } catch {
    // keep raw body
  }
  return { ok: false, status: res.status, message }
}

export async function sendViaResend(input: {
  apiKey: string
  from: string
  subject: string
  html: string
  previewText?: string
  emails: unknown
}): Promise<{ sent: number } | { error: string; status: number }> {
  const subject = input.subject.trim()
  const html = input.html.trim()
  const emails = normalizeRecipientEmails(input.emails)
  const from = normalizeFromAddress(input.from)

  if (!subject || !html) {
    return { error: 'Subject and body are required', status: 400 }
  }
  if (emails.length === 0) {
    return { error: 'No valid subscriber emails', status: 400 }
  }
  if (emails.length > MAX_RECIPIENTS) {
    return { error: `Too many recipients (max ${MAX_RECIPIENTS})`, status: 400 }
  }

  const fromLower = from.toLowerCase()
  if (/@gmail\.com\b/.test(fromLower) || /@googlemail\.com\b/.test(fromLower)) {
    return {
      error:
        'Resend cannot send from Gmail. Set NEWSLETTER_FROM to an address on a domain verified in Resend (for example hello@thefastestsector.com), then redeploy.',
      status: 400,
    }
  }

  const wrapped = wrapNewsletterHtml(html, input.previewText?.trim() ?? '')

  if (emails.length === 1) {
    const result = await postResend(input.apiKey, '/emails', {
      from,
      to: [emails[0]],
      subject,
      html: wrapped,
    })
    if (!result.ok) {
      return { error: explainResendError(result.status, result.message, from), status: 502 }
    }
    return { sent: 1 }
  }

  let sent = 0
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE).map((to) => ({
      from,
      to: [to],
      subject,
      html: wrapped,
    }))
    const result = await postResend(input.apiKey, '/emails/batch', batch)
    if (!result.ok) {
      return { error: explainResendError(result.status, result.message, from), status: 502 }
    }
    sent += batch.length
  }

  return { sent }
}
