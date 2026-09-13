// Fix-up pass for the posting-walkthrough section: the markdown insert left
// plain paragraphs with an inherited HEADING_2 named style. Demote everything
// that isn't the section heading or a numbered step heading back to
// NORMAL_TEXT, reset the maroon heading color that got applied to body text,
// and apply the callout shading to the new Tip / Heads-up / Good to know
// paragraphs. No secrets printed.
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const DOC_ID = '1Z7we21OkcN3IKCLuovFlZRYtJU_C18H5I_P9pY-pPZs'
const TAB_ID = 't.1w3q099frymf'
const CRIMSON = { red: 200 / 255, green: 16 / 255, blue: 46 / 255 }
const CALLOUT_BG = { red: 0.9922, green: 0.9255, blue: 0.9176 }

const tokenPath = join(homedir(), '.config', 'google-docs-mcp', 'token.json')
const token = JSON.parse(readFileSync(tokenPath, 'utf8'))

async function accessToken() {
  if (token.expiry_date && Date.now() < token.expiry_date - 60_000 && token.access_token) {
    return token.access_token
  }
  const mcp = JSON.parse(readFileSync(join(homedir(), '.cursor', 'mcp.json'), 'utf8'))
  const env = mcp.mcpServers['google-docs'].env
  const body = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    refresh_token: token.refresh_token,
    grant_type: 'refresh_token',
  })
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const data = await res.json()
  if (!res.ok) throw new Error('token refresh failed (status ' + res.status + ')')
  token.access_token = data.access_token
  token.expiry_date = Date.now() + data.expires_in * 1000
  writeFileSync(tokenPath, JSON.stringify(token, null, 2))
  return token.access_token
}

function paragraphText(para) {
  let t = ''
  for (const el of para.elements || []) {
    if (el.textRun) t += el.textRun.content
  }
  return t
}

function flattenTabs(tabs, out = []) {
  for (const tab of tabs || []) {
    out.push(tab)
    flattenTabs(tab.childTabs, out)
  }
  return out
}

const access = await accessToken()
const docRes = await fetch(
  `https://docs.googleapis.com/v1/documents/${DOC_ID}?includeTabsContent=true`,
  { headers: { Authorization: `Bearer ${access}` } },
)
const doc = await docRes.json()
if (!docRes.ok) throw new Error('doc fetch failed: ' + docRes.status)
const tab = flattenTabs(doc.tabs).find((t) => t.tabProperties.tabId === TAB_ID)
const content = tab.documentTab.body.content

// Locate section bounds
let sectionStart = null
let sectionEnd = null
for (const el of content) {
  if (!el.paragraph) continue
  const t = paragraphText(el.paragraph).trim()
  if (t.startsWith('Posting articles — the complete walkthrough')) sectionStart = el.startIndex
  if (sectionStart !== null && t === 'Media library') {
    sectionEnd = el.startIndex
    break
  }
}
if (sectionStart === null || sectionEnd === null) throw new Error('section bounds not found')
console.log('section range:', sectionStart, '-', sectionEnd)

const tabId = TAB_ID
const requests = []
let demoted = 0
let callouts = 0

for (const el of content) {
  if (!el.paragraph) continue
  const start = el.startIndex ?? 0
  const end = el.endIndex
  if (start < sectionStart || start >= sectionEnd) continue
  const para = el.paragraph
  const style = para.paragraphStyle?.namedStyleType || 'NORMAL_TEXT'
  const trimmed = paragraphText(para).trim()

  // Keep the intended headings: the section H2 and the numbered-step /
  // subsection H3s (inserted correctly by the markdown tool).
  if (trimmed.startsWith('Posting articles — the complete walkthrough')) continue
  if (style === 'HEADING_3') continue

  if (style === 'HEADING_2') {
    demoted++
    requests.push({
      updateParagraphStyle: {
        range: { startIndex: start, endIndex: start + 1, tabId },
        paragraphStyle: { namedStyleType: 'NORMAL_TEXT' },
        fields: 'namedStyleType',
      },
    })
    // Body paragraphs picked up the maroon H2 color from the styling pass —
    // reset it. Captions keep their explicit 9pt gray (char-level overrides
    // survive a namedStyleType change), so skip them.
    if (!trimmed.startsWith('Figure ') && end - 1 > start) {
      requests.push({
        updateTextStyle: {
          range: { startIndex: start, endIndex: end - 1, tabId },
          textStyle: {},
          fields: 'foregroundColor',
        },
      })
    }
  }

  // Callouts missed their shading (the heading branch won in the style pass)
  if (/^(Tip:|Heads-up:|Good to know:)/.test(trimmed)) {
    callouts++
    requests.push({
      updateParagraphStyle: {
        range: { startIndex: start, endIndex: start + 1, tabId },
        paragraphStyle: {
          shading: { backgroundColor: { color: { rgbColor: CALLOUT_BG } } },
          borderLeft: {
            color: { color: { rgbColor: CRIMSON } },
            width: { magnitude: 3, unit: 'PT' },
            padding: { magnitude: 8, unit: 'PT' },
            dashStyle: 'SOLID',
          },
          indentStart: { magnitude: 8, unit: 'PT' },
        },
        fields: 'shading,borderLeft,indentStart',
      },
    })
  }
}

console.log('demoted paragraphs:', demoted, '| callouts styled:', callouts, '| requests:', requests.length)
for (let i = 0; i < requests.length; i += 400) {
  const chunk = requests.slice(i, i + 400)
  const res = await fetch(`https://docs.googleapis.com/v1/documents/${DOC_ID}:batchUpdate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests: chunk }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error('batchUpdate failed: ' + JSON.stringify(data.error || data))
}
console.log('done')
