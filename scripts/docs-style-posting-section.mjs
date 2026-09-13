// Styles the Admin Guide tab after the posting-walkthrough insert:
// - uploads the new tmp-screenshots PNGs referenced by [[IMG:name.png]]
//   markers to Drive (public-read) and swaps markers for inline images,
//   sized from the PNG's real dimensions (centered, max 435pt wide / 480pt tall)
// - re-applies crimson/maroon heading colors, caption styling, callout
//   shading and crimson table header rows across the whole tab (idempotent).
// Secrets are read from files and never printed.
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const DOC_ID = '1Z7we21OkcN3IKCLuovFlZRYtJU_C18H5I_P9pY-pPZs'
const TAB_ID = 't.1w3q099frymf'
const SHOT_DIR = join(process.cwd(), 'tmp-screenshots')

const CRIMSON = { red: 200 / 255, green: 16 / 255, blue: 46 / 255 } // #C8102E
const MAROON = { red: 138 / 255, green: 18 / 255, blue: 32 / 255 } // #8A1220
const NEAR_BLACK = { red: 0.1255, green: 0.1294, blue: 0.1412 } // #202124
const CAPTION_GRAY = { red: 0.3725, green: 0.3882, blue: 0.4078 } // #5F6368
const CALLOUT_BG = { red: 0.9922, green: 0.9255, blue: 0.9176 } // #FDECEA
const WHITE = { red: 1, green: 1, blue: 1 }

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

function pngSize(filePath) {
  const buf = readFileSync(filePath)
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
}

function displaySize(px) {
  // 1 CSS px at 96dpi = 0.75pt; cap at 435pt wide and 480pt tall
  let w = Math.min(435, px.w * 0.75)
  let h = (w * px.h) / px.w
  if (h > 480) {
    w = (w * 480) / h
    h = 480
  }
  return { w: Math.round(w * 100) / 100, h: Math.round(h * 100) / 100 }
}

async function uploadToDrive(access, filePath, name) {
  const bytes = readFileSync(filePath)
  const boundary = '-------docsshot' + Date.now() + Math.random().toString(36).slice(2)
  const preamble =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    JSON.stringify({ name, mimeType: 'image/png' }) +
    `\r\n--${boundary}\r\nContent-Type: image/png\r\n\r\n`
  const body = Buffer.concat([Buffer.from(preamble), bytes, Buffer.from(`\r\n--${boundary}--`)])
  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${access}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    },
  )
  const data = await res.json()
  if (!res.ok) throw new Error('drive upload failed: ' + JSON.stringify(data))
  const permRes = await fetch(`https://www.googleapis.com/drive/v3/files/${data.id}/permissions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'reader', type: 'anyone' }),
  })
  if (!permRes.ok) throw new Error('drive permission failed: ' + permRes.status)
  return `https://drive.google.com/uc?export=download&id=${data.id}`
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
if (!tab) throw new Error('tab not found: ' + TAB_ID)
const content = tab.documentTab.body.content

// Collect and upload marker images once
const markerRe = /^\[\[IMG:([\w.\-]+)\]\]$/
const neededFiles = new Set()
for (const el of content) {
  if (!el.paragraph) continue
  const m = paragraphText(el.paragraph).trim().match(markerRe)
  if (m) neededFiles.add(m[1])
}
const imageUrls = {}
const imageSizes = {}
for (const file of neededFiles) {
  console.log('uploading', file)
  imageUrls[file] = await uploadToDrive(access, join(SHOT_DIR, file), `tfs-doc-${file}`)
  imageSizes[file] = displaySize(pngSize(join(SHOT_DIR, file)))
}

const ops = [] // { sort, requests[] }
const tabId = TAB_ID

for (const el of content) {
  if (el.paragraph) {
    const para = el.paragraph
    const start = el.startIndex ?? 0
    const end = el.endIndex
    const text = paragraphText(para)
    const trimmed = text.trim()
    const style = para.paragraphStyle?.namedStyleType || 'NORMAL_TEXT'

    const m = trimmed.match(markerRe)
    if (m) {
      const size = imageSizes[m[1]]
      ops.push({
        sort: start,
        requests: [
          { deleteContentRange: { range: { startIndex: start, endIndex: end - 1, tabId } } },
          {
            insertInlineImage: {
              location: { index: start, tabId },
              uri: imageUrls[m[1]],
              objectSize: {
                width: { magnitude: size.w, unit: 'PT' },
                height: { magnitude: size.h, unit: 'PT' },
              },
            },
          },
          {
            updateParagraphStyle: {
              range: { startIndex: start, endIndex: start + 1, tabId },
              paragraphStyle: { alignment: 'CENTER' },
              fields: 'alignment',
            },
          },
        ],
      })
      continue
    }

    if (trimmed.startsWith('Figure ') && end - 1 > start) {
      ops.push({
        sort: start,
        requests: [
          {
            updateTextStyle: {
              range: { startIndex: start, endIndex: end - 1, tabId },
              textStyle: {
                fontSize: { magnitude: 9, unit: 'PT' },
                foregroundColor: { color: { rgbColor: CAPTION_GRAY } },
              },
              fields: 'fontSize,foregroundColor',
            },
          },
          {
            updateParagraphStyle: {
              range: { startIndex: start, endIndex: start + 1, tabId },
              paragraphStyle: { alignment: 'CENTER', spaceBelow: { magnitude: 14, unit: 'PT' } },
              fields: 'alignment,spaceBelow',
            },
          },
        ],
      })
      continue
    }

    if (
      (style === 'TITLE' || style === 'HEADING_1' || style === 'HEADING_2' || style === 'HEADING_3') &&
      end - 1 > start
    ) {
      const color = style === 'HEADING_2' ? MAROON : style === 'HEADING_3' ? NEAR_BLACK : CRIMSON
      ops.push({
        sort: start,
        requests: [
          {
            updateTextStyle: {
              range: { startIndex: start, endIndex: end - 1, tabId },
              textStyle: { foregroundColor: { color: { rgbColor: color } } },
              fields: 'foregroundColor',
            },
          },
        ],
      })
      continue
    }

    if (/^(Tip:|Heads-up:|Good to know:)/.test(trimmed)) {
      ops.push({
        sort: start,
        requests: [
          {
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
          },
        ],
      })
    }
  } else if (el.table) {
    const start = el.startIndex ?? 0
    const table = el.table
    const row0 = table.tableRows?.[0]
    if (!row0) continue
    const requests = [
      {
        updateTableCellStyle: {
          tableRange: {
            tableCellLocation: {
              tableStartLocation: { index: start, tabId },
              rowIndex: 0,
              columnIndex: 0,
            },
            rowSpan: 1,
            columnSpan: table.columns,
          },
          tableCellStyle: { backgroundColor: { color: { rgbColor: CRIMSON } } },
          fields: 'backgroundColor',
        },
      },
    ]
    for (const cell of row0.tableCells || []) {
      for (const cEl of cell.content || []) {
        if (!cEl.paragraph) continue
        const s = cEl.startIndex
        const e = cEl.endIndex
        if (e - 1 > s) {
          requests.push({
            updateTextStyle: {
              range: { startIndex: s, endIndex: e - 1, tabId },
              textStyle: { bold: true, foregroundColor: { color: { rgbColor: WHITE } } },
              fields: 'bold,foregroundColor',
            },
          })
        }
      }
    }
    ops.push({ sort: start, requests })
  }
}

// Apply in descending document order so index shifts from image swaps never
// affect not-yet-applied (lower-index) operations.
ops.sort((a, b) => b.sort - a.sort)
const requests = ops.flatMap((o) => o.requests)
console.log('requests:', requests.length)
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
