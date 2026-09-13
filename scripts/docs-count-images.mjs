import { readFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const DOC_ID = '1Z7we21OkcN3IKCLuovFlZRYtJU_C18H5I_P9pY-pPZs'
const token = JSON.parse(readFileSync(join(homedir(), '.config', 'google-docs-mcp', 'token.json'), 'utf8'))

const res = await fetch(
  `https://docs.googleapis.com/v1/documents/${DOC_ID}?includeTabsContent=true`,
  { headers: { Authorization: `Bearer ${token.access_token}` } },
)
const doc = await res.json()
if (!res.ok) throw new Error('fetch failed: ' + res.status)

function walk(tabs) {
  for (const tab of tabs || []) {
    let images = 0
    let markers = 0
    for (const el of tab.documentTab?.body?.content || []) {
      const paras = [el.paragraph].filter(Boolean)
      // also look inside tables
      for (const row of el.table?.tableRows || [])
        for (const cell of row.tableCells || [])
          for (const c of cell.content || []) if (c.paragraph) paras.push(c.paragraph)
      for (const p of paras) {
        for (const pe of p.elements || []) {
          if (pe.inlineObjectElement) images++
          if (pe.textRun?.content?.includes('[[IMG:')) markers++
        }
      }
    }
    console.log(tab.tabProperties.tabId, tab.tabProperties.title, 'images:', images, 'leftover markers:', markers)
    walk(tab.childTabs)
  }
}
walk(doc.tabs)
