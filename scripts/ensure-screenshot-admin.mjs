/**
 * Ensure a local-only screenshot admin exists (does not print secrets).
 * Usage: node scripts/ensure-screenshot-admin.mjs
 */
import { createHash, randomBytes, pbkdf2Sync, randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const EMAIL = 'screenshot-admin@tfs.local'
const PASSWORD = 'ScreenshotAdmin1!'

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function hashPassword(password) {
  const salt = randomBytes(16)
  const hash = pbkdf2Sync(password, salt, 100_000, 32, 'sha256')
  return `pbkdf2$${b64url(salt)}$${b64url(hash)}`
}

function findLocalDbPath() {
  const base = path.join(root, '.wrangler', 'state', 'v3', 'd1')
  const matches = []
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name)
      const st = fs.statSync(full)
      if (st.isDirectory()) walk(full)
      else if (name.endsWith('.sqlite') && !name.startsWith('metadata')) matches.push(full)
    }
  }
  walk(base)
  matches.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)
  if (!matches.length) throw new Error('No local D1 sqlite')
  return matches[0]
}

const dbPath = findLocalDbPath()
const db = new DatabaseSync(dbPath)
const id = createHash('sha256').update(EMAIL).digest('hex').slice(0, 32)
const passwordHash = hashPassword(PASSWORD)
db.prepare(
  `INSERT INTO users (id, email, password_hash, display_name, role, created_at)
   VALUES (?, ?, ?, ?, 'admin', ?)
   ON CONFLICT(id) DO UPDATE SET password_hash=excluded.password_hash, role='admin', display_name=excluded.display_name`,
).run(id, EMAIL, passwordHash, 'Screenshot Admin', Date.now())

// Ensure demo ad exists so public AdSlot can render
const adCount = db.prepare(`SELECT COUNT(*) AS c FROM ads`).get().c
if (!adCount) {
  // Use an existing media image if present, else a placeholder path
  const media = db.prepare(`SELECT url FROM media ORDER BY created_at DESC LIMIT 1`).get()
  const imageUrl = media?.url || '/tfs-logo.png'
  db.prepare(
    `INSERT INTO ads (id, name, placement, image_url, target_url, html, active, starts_at, ends_at, impressions, clicks, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, '', 1, NULL, NULL, 12, 1, ?, ?)`,
  ).run(
    randomUUID(),
    'Demo sidebar ad',
    'article-sidebar',
    imageUrl,
    'https://example.com',
    Date.now(),
    Date.now(),
  )
  db.prepare(
    `INSERT INTO ads (id, name, placement, image_url, target_url, html, active, starts_at, ends_at, impressions, clicks, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, '', 1, NULL, NULL, 8, 0, ?, ?)`,
  ).run(
    randomUUID(),
    'Demo home ad',
    'home',
    imageUrl,
    'https://example.com',
    Date.now(),
    Date.now(),
  )
}

// Seed a few page views so Traffic charts aren't empty
const viewCount = db.prepare(`SELECT COUNT(*) AS c FROM page_views`).get().c
if (viewCount < 5) {
  const insert = db.prepare(
    `INSERT INTO page_views (id, path, article_slug, referrer, visitor_id, country, device, day, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
  const now = Date.now()
  for (let i = 0; i < 20; i++) {
    const dayOffset = i % 7
    const created = now - dayOffset * 86_400_000 - i * 3_600_000
    const day = new Date(created).toISOString().slice(0, 10)
    insert.run(
      randomUUID(),
      i % 3 === 0 ? '/' : i % 3 === 1 ? '/schedule' : '/category/news',
      '',
      i % 4 === 0 ? 'google.com' : '',
      `seed-visitor-${i % 5}`,
      ['IE', 'GB', 'US', 'DE'][i % 4],
      ['desktop', 'mobile', 'tablet'][i % 3],
      day,
      created,
    )
  }
}

console.log('ok')
console.log(EMAIL)
