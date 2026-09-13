import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const DOC_ID = '1Z7we21OkcN3IKCLuovFlZRYtJU_C18H5I_P9pY-pPZs'
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
  if (!res.ok) throw new Error('token refresh failed')
  token.access_token = data.access_token
  token.expiry_date = Date.now() + data.expires_in * 1000
  writeFileSync(tokenPath, JSON.stringify(token, null, 2))
  return token.access_token
}

const access = await accessToken()
const res = await fetch(
  `https://docs.googleapis.com/v1/documents/${DOC_ID}?includeTabsContent=true&fields=tabs(tabProperties(tabId,title),documentTab(body(content(endIndex))))`,
  { headers: { Authorization: `Bearer ${access}` } },
)
const doc = await res.json()
if (!res.ok) throw new Error(JSON.stringify(doc))
for (const tab of doc.tabs || []) {
  const content = tab.documentTab?.body?.content || []
  const endIndex = content.length ? content[content.length - 1].endIndex : null
  console.log(JSON.stringify({ tabId: tab.tabProperties.tabId, title: tab.tabProperties.title, endIndex }))
}
