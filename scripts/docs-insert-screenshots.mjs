import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const DOC_ID = '1Z7we21OkcN3IKCLuovFlZRYtJU_C18H5I_P9pY-pPZs'
const tokenPath = join(homedir(), '.config', 'google-docs-mcp', 'token.json')
const mcp = JSON.parse(readFileSync(join(homedir(), '.cursor', 'mcp.json'), 'utf8'))
const env = mcp.mcpServers['google-docs'].env
let token = JSON.parse(readFileSync(tokenPath, 'utf8'))

const shots = [
  { file: '10-admin-traffic.png', caption: 'Admin — Traffic & Insights → Traffic (views, chart, top pages, referrers)' },
  { file: '11-admin-insights.png', caption: 'Admin — Traffic & Insights → Insights' },
  { file: '12-admin-subscribers.png', caption: 'Admin — Traffic & Insights → Subscribers' },
  { file: '13-admin-ads.png', caption: 'Admin — Ads manager (active creatives, shown / clicks / click rate)' },
  { file: '14-home-with-ad.png', caption: 'Public site — Home with live ad placement' },
]

async function accessToken() {
  if (token.expiry_date && Date.now() < token.expiry_date - 60_000 && token.access_token) {
    return token.access_token
  }
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
  if (!res.ok) throw new Error(JSON.stringify(data))
  token.access_token = data.access_token
  token.expiry_date = Date.now() + data.expires_in * 1000
  writeFileSync(tokenPath, JSON.stringify(token, null, 2))
  return token.access_token
}

async function endIndex(access) {
  const docRes = await fetch(
    `https://docs.googleapis.com/v1/documents/${DOC_ID}?fields=body(content(endIndex))`,
    { headers: { Authorization: `Bearer ${access}` } },
  )
  const doc = await docRes.json()
  if (!docRes.ok) throw new Error(JSON.stringify(doc))
  const content = doc.body.content
  return content[content.length - 1].endIndex
}

async function uploadToDrive(access, filePath, name) {
  const bytes = readFileSync(filePath)
  const meta = {
    name,
    mimeType: 'image/png',
  }
  const boundary = '-------docsshot' + Date.now()
  const preamble =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    JSON.stringify(meta) +
    `\r\n--${boundary}\r\nContent-Type: image/png\r\n\r\n`
  const closing = `\r\n--${boundary}--`
  const body = Buffer.concat([Buffer.from(preamble), bytes, Buffer.from(closing)])
  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webContentLink,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  )
  const data = await res.json()
  if (!res.ok) throw new Error(JSON.stringify(data))
  // Make readable by anyone with link so Docs can fetch it... Docs insert uses Drive file ID differently
  await fetch(`https://www.googleapis.com/drive/v3/files/${data.id}/permissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role: 'reader', type: 'anyone' }),
  })
  return data.id
}

async function appendCaptionAndImage(access, caption, fileId) {
  const end = await endIndex(access)
  const insertAt = end - 1
  const text = `\n${caption}\n`
  // insert text then image after caption line
  const requests = [
    {
      insertText: {
        location: { index: insertAt },
        text,
      },
    },
    {
      insertInlineImage: {
        location: { index: insertAt + text.length },
        uri: `https://drive.google.com/uc?export=download&id=${fileId}`,
        objectSize: {
          width: { magnitude: 450, unit: 'PT' },
          height: { magnitude: 281, unit: 'PT' },
        },
      },
    },
    {
      insertText: {
        location: { index: insertAt + text.length + 1 },
        text: '\n',
      },
    },
  ]
  const res = await fetch(`https://docs.googleapis.com/v1/documents/${DOC_ID}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(JSON.stringify(data))
}

const access = await accessToken()
const dir = join(process.cwd(), 'tmp-screenshots')
for (const shot of shots) {
  const path = join(dir, shot.file)
  if (!existsSync(path)) {
    console.log('missing', shot.file)
    continue
  }
  console.log('uploading', shot.file)
  const fileId = await uploadToDrive(access, path, `tfs-review-${shot.file}`)
  console.log('inserting', shot.caption)
  await appendCaptionAndImage(access, shot.caption, fileId)
  console.log('ok', shot.file)
}
console.log('all done')
