const BANNER = 'https://thefastestsector.com/sector-sweep-email-banner.png'
const SITE = 'https://thefastestsector.com'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function isEmptyBody(html: string) {
  const stripped = html
    .replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '')
    .replace(/<br\s*\/?>/gi, '')
    .replace(/&nbsp;/gi, '')
    .trim()
  return !stripped
}

/** Make root-relative image paths absolute so email clients can load them. */
function absolutizeAssetUrls(html: string, origin: string) {
  const base = origin.replace(/\/$/, '')
  return html.replace(
    /(\bsrc=["'])(\/(?:newsletter|media|tfs-|sector-sweep)[^"']*)/gi,
    (_m, prefix: string, path: string) => `${prefix}${base}${path}`,
  )
}

export function wrapNewsletterHtml(
  html: string,
  previewText = '',
  opts?: { bannerUrl?: string; forPreview?: boolean; unsubscribeUrl?: string },
): string {
  const banner = opts?.bannerUrl || BANNER
  const preview = previewText
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(previewText)}</div>`
    : ''

  const body = isEmptyBody(html)
    ? `<p style="margin:0;color:#9ca3af;font-style:italic;font-size:15px">Start writing in the editor — your newsletter content will appear here.</p>`
    : opts?.forPreview
      ? html
      : absolutizeAssetUrls(html, SITE)

  const unsub =
    opts?.unsubscribeUrl
      ? `<br/><a href="${escapeHtml(opts.unsubscribeUrl)}" style="color:#888888;text-decoration:underline">Unsubscribe</a>`
      : opts?.forPreview
        ? `<br/><span style="color:#aaaaaa">Unsubscribe</span>`
        : ''

  const table = `${preview}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;margin:0;padding:24px 0;font-family:Arial,Helvetica,sans-serif;border-collapse:collapse">
  <tr>
    <td align="center" style="padding:0 12px">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-collapse:collapse">
        <tr>
          <td style="padding:0;line-height:0;font-size:0">
            <a href="${SITE}" style="display:block;text-decoration:none">
              <img src="${banner}" alt="Sector Sweep Newsletter — The Fastest Sector" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0" />
            </a>
          </td>
        </tr>
        <tr>
          <td class="tfs-body" style="padding:28px 28px 8px;color:#222222;line-height:1.65;font-size:16px;word-break:break-word">
            <style>
              .tfs-body img { max-width: 100% !important; height: auto !important; display: block; margin: 16px 0; }
              .tfs-body a { color: #c8102e; }
              .tfs-body p { margin: 0 0 16px; }
              .tfs-body h2 { margin: 24px 0 8px; font-size: 22px; color: #111; }
              .tfs-body h3 { margin: 20px 0 8px; font-size: 18px; color: #111; }
              .tfs-body ul, .tfs-body ol { margin: 0 0 16px; padding-left: 22px; }
            </style>
            ${body}
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px 32px;font-size:12px;color:#888888;text-align:center;line-height:1.5;word-break:break-word">
            You’re receiving this because you subscribed to Sector Sweep at
            <a href="${SITE}" style="color:#c8102e;text-decoration:none">${SITE.replace('https://', '')}</a>.
            ${unsub}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`

  if (!opts?.forPreview) return table

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <base target="_blank" />
  <style>
    html, body { margin: 0; padding: 0; background: #f4f4f4; }
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body>${table}</body>
</html>`
}

export type NewsletterTemplate = {
  id: string
  name: string
  description: string
  subject: string
  previewText: string
  html: string
  custom?: boolean
}

export const NEWSLETTER_TEMPLATES: NewsletterTemplate[] = [
  {
    id: 'blank',
    name: 'Blank',
    description: 'Sector Sweep banner header and footer only',
    subject: '',
    previewText: '',
    html: '<p></p>',
  },
  {
    id: 'monthly',
    name: 'Monthly Sector Sweep',
    description: 'Intro, top stories, and a closer',
    subject: 'Sector Sweep — Monthly edition',
    previewText: 'The month in motorsport, quick and quirky.',
    html: `<h2>Welcome to Sector Sweep</h2>
<img src="/newsletter/monthly.jpg" alt="Race cars on track" width="544" style="width:100%;max-width:544px;height:auto;border:0;border-radius:4px" />
<p>The engines have barely cooled and already the paddock is talking. Here’s what mattered this month — and what to watch next.</p>
<h3>Top stories</h3>
<ul>
<li><strong>Story one</strong> — add your recap and a link.</li>
<li><strong>Story two</strong> — add your recap and a link.</li>
<li><strong>Story three</strong> — add your recap and a link.</li>
</ul>
<h3>What we’re watching</h3>
<p>Preview the next race weekend, a driver to keep an eye on, or a question you want readers to argue about.</p>
<p>See you next month.<br/>— The Fastest Sector</p>`,
  },
  {
    id: 'recap',
    name: 'Race weekend recap',
    description: 'Qualifying, race, and talking point',
    subject: 'Race recap: [Grand Prix name]',
    previewText: 'Who won, who faded, and what it means.',
    html: `<h2>Race weekend recap</h2>
<p><strong>Event:</strong> [Grand Prix]<br/><strong>Winner:</strong> [Driver]<br/><strong>Team:</strong> [Team]</p>
<img src="/newsletter/recap.jpg" alt="Race weekend action — replace with your photo" width="544" style="width:100%;max-width:544px;height:auto;border:0;border-radius:4px" />
<h3>How it unfolded</h3>
<p>Set the scene from qualifying through the flag. Keep it punchy — one or two paragraphs.</p>
<h3>The talking point</h3>
<p>Strategy, a collision, a rookie moment — pick the one thing fans are still arguing about.</p>
<h3>Championship picture</h3>
<p>Where the standings sit now, and who is under pressure heading to the next round.</p>
<p><a href="https://thefastestsector.com">Read the full report on TFS →</a></p>`,
  },
  {
    id: 'breaking',
    name: 'Breaking news',
    description: 'Short alert with a headline and link',
    subject: 'Breaking: [headline]',
    previewText: 'Just in from the paddock.',
    html: `<h2>Breaking</h2>
<p><strong>[Headline goes here]</strong></p>
<img src="/newsletter/breaking.jpg" alt="Breaking story image — replace with your photo" width="544" style="width:100%;max-width:544px;height:auto;border:0;border-radius:4px" />
<p>Two or three sentences on what happened, why it matters, and what comes next.</p>
<p><a href="https://thefastestsector.com">Read the full story →</a></p>`,
  },
]
