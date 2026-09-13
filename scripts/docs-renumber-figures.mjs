// Renumbers Figure 3..10 -> Figure 14..21 in the Admin Guide tab only, making
// room for the new posting-walkthrough figures (2..13). Targets don't collide
// with sources, so order doesn't matter. No secrets printed.
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

const access = await accessToken()
const requests = []
for (let n = 3; n <= 10; n++) {
  requests.push({
    replaceAllText: {
      containsText: { text: `Figure ${n} \u2014`, matchCase: true },
      replaceText: `Figure ${n + 11} \u2014`,
      tabsCriteria: { tabIds: [TAB_ID] },
    },
  })
}
const res = await fetch(`https://docs.googleapis.com/v1/documents/${DOC_ID}:batchUpdate`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ requests }),
})
const data = await res.json()
if (!res.ok) throw new Error('batchUpdate failed: ' + JSON.stringify(data.error || data))
const counts = (data.replies || []).map((r) => r.replaceAllText?.occurrencesChanged || 0)
console.log('occurrences changed per figure:', counts.join(','))
