// Re-applies italics to the Figure captions of the posting-walkthrough
// section (Figures 2-13) to match the doc's caption style. No secrets printed.
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const DOC_ID = '1Z7we21OkcN3IKCLuovFlZRYtJU_C18H5I_P9pY-pPZs'
const TAB_ID = 't.1w3q099frymf'
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

const requests = []
const capRe = /^Figure (\d+) \u2014/
for (const el of tab.documentTab.body.content) {
  if (!el.paragraph) continue
  const trimmed = paragraphText(el.paragraph).trim()
  const m = trimmed.match(capRe)
  if (!m) continue
  const n = Number(m[1])
  if (n < 2 || n > 13) continue // only the new walkthrough captions
  requests.push({
    updateTextStyle: {
      range: { startIndex: el.startIndex, endIndex: el.endIndex - 1, tabId: TAB_ID },
      textStyle: { italic: true },
      fields: 'italic',
    },
  })
}
console.log('captions to italicize:', requests.length)
const res = await fetch(`https://docs.googleapis.com/v1/documents/${DOC_ID}:batchUpdate`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ requests }),
})
const data = await res.json()
if (!res.ok) throw new Error('batchUpdate failed: ' + JSON.stringify(data.error || data))
console.log('done')
