const LOGO = 'https://thefastestsector.com/tfs-logo.png'
const SITE = 'https://thefastestsector.com'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function wrapNewsletterHtml(html: string, previewText = ''): string {
  const preview = previewText
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(previewText)}</div>`
    : ''

  return `${preview}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;margin:0;padding:24px 0;font-family:Inter,Arial,Helvetica,sans-serif">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#ffffff">
        <tr>
          <td style="background:#111111;padding:22px 24px;text-align:center">
            <img src="${LOGO}" alt="The Fastest Sector" width="40" height="40" style="display:inline-block;border-radius:20px;vertical-align:middle;margin-right:10px" />
            <span style="color:#ffffff;font-weight:800;letter-spacing:0.12em;font-size:13px;vertical-align:middle">THE FASTEST <span style="color:#c8102e">SECTOR</span></span>
          </td>
        </tr>
        <tr>
          <td class="tfs-body" style="padding:28px 28px 8px;color:#222222;line-height:1.65;font-size:16px">
            <style>
              .tfs-body img { max-width: 100% !important; height: auto !important; display: block; margin: 16px 0; }
              .tfs-body a { color: #c8102e; }
              .tfs-body p { margin: 0 0 16px; }
              .tfs-body h2 { margin: 24px 0 8px; font-size: 22px; }
              .tfs-body h3 { margin: 20px 0 8px; font-size: 18px; }
            </style>
            ${html}
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px 32px;font-size:12px;color:#888888;text-align:center;line-height:1.5">
            You’re receiving this because you subscribed to Sector Sweep at
            <a href="${SITE}" style="color:#c8102e;text-decoration:none">${SITE.replace('https://', '')}</a>.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`
}

export type NewsletterTemplate = {
  id: string
  name: string
  description: string
  subject: string
  previewText: string
  html: string
}

export const NEWSLETTER_TEMPLATES: NewsletterTemplate[] = [
  {
    id: 'blank',
    name: 'Blank',
    description: 'Branded header and footer only',
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
<p>The engines have barely cooled and already the paddock is talking. Here’s what mattered this month — and what to watch next.</p>
<img src="https://thefastestsector.com/tfs-logo.png" alt="The Fastest Sector" />
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
<img src="https://thefastestsector.com/tfs-logo.png" alt="Race image — replace this" />
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
<img src="https://thefastestsector.com/tfs-logo.png" alt="Story image — replace this" />
<p>Two or three sentences on what happened, why it matters, and what comes next.</p>
<p><a href="https://thefastestsector.com">Read the full story →</a></p>`,
  },
]
