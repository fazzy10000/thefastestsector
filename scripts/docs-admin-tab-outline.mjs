// Prints heading/paragraph outline with character indices for the Admin Guide
// tab, so we can compute the exact range to replace. No secrets printed.
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

function flattenTabs(tabs, out = []) {
  for (const tab of tabs || []) {
    out.push(tab)
    flattenTabs(tab.childTabs, out)
  }
  return out
}

const access = await accessToken()
const res = await fetch(
  `https://docs.googleapis.com/v1/documents/${DOC_ID}?includeTabsContent=true`,
  { headers: { Authorization: `Bearer ${access}` } },
)
const doc = await res.json()
if (!res.ok) throw new Error('doc fetch failed: ' + res.status)
const tab = flattenTabs(doc.tabs).find((t) => t.tabProperties.tabId === TAB_ID)
if (!tab) throw new Error('tab not found')

for (const el of tab.documentTab.body.content) {
  if (el.paragraph) {
    let text = ''
    let hasImage = false
    for (const pe of el.paragraph.elements || []) {
      if (pe.textRun) text += pe.textRun.content
      if (pe.inlineObjectElement) hasImage = true
    }
    const style = el.paragraph.paragraphStyle?.namedStyleType || 'NORMAL_TEXT'
    const t = text.trim().slice(0, 70)
    console.log(`${el.startIndex}\t${el.endIndex}\t${style}${hasImage ? '\t[IMG]' : ''}\t${t}`)
  } else if (el.table) {
    console.log(`${el.startIndex}\t${el.endIndex}\tTABLE\t(${el.table.rows}x${el.table.columns})`)
  }
}
