/**
 * Seed Cloudflare D1 from wp-import.json + optional bootstrap admin.
 *
 * Usage:
 *   SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD=secret npm run seed:d1
 *   npm run seed:d1 -- --remote
 *
 * Local: node:sqlite against Wrangler's D1 file.
 * Remote: wrangler d1 execute with chunked SQL (D1 ~100KB statement cap).
 */
import { spawnSync } from 'node:child_process'
import { createHash, randomBytes, pbkdf2Sync } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const remote = process.argv.includes('--remote')
const SQL_CHUNK = 20_000
const MAX_FILE_BYTES = 400_000

function b64url(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function hashPassword(password) {
  const salt = randomBytes(16)
  const hash = pbkdf2Sync(password, salt, 100_000, 32, 'sha256')
  return `pbkdf2$${b64url(salt)}$${b64url(hash)}`
}

function sqlString(value) {
  return `'${String(value ?? '').replace(/'/g, "''")}'`
}

function findLocalDbPath() {
  const base = path.join(root, '.wrangler', 'state', 'v3', 'd1')
  if (!fs.existsSync(base)) {
    throw new Error('Local D1 state missing. Run `npm run db:migrate` first.')
  }
  const matches = []
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name)
      const st = fs.statSync(full)
      if (st.isDirectory()) walk(full)
      else if (name.endsWith('.sqlite')) matches.push(full)
    }
  }
  walk(base)
  if (!matches.length) {
    throw new Error('No local D1 sqlite file found. Run `npm run db:migrate` first.')
  }
  matches.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)
  const preferred = matches.find((p) => !path.basename(p).startsWith('metadata'))
  return preferred || matches[0]
}

function runSqlFile(filePath) {
  const args = ['wrangler', 'd1', 'execute', 'thefastestsector', '--file', filePath, '--remote']
  const result = spawnSync('npx', args, { cwd: root, encoding: 'utf8', shell: true })
  if (result.status !== 0) {
    console.error(result.stdout)
    console.error(result.stderr)
    throw new Error(`wrangler d1 execute failed (${result.status})`)
  }
}

function writeBatch(statements, label) {
  const tmp = path.join(root, `.seed-${label}-${Date.now()}.sql`)
  fs.writeFileSync(tmp, statements.join(';\n') + ';\n', 'utf8')
  try {
    console.log(`Executing ${label} (${statements.length} statements)...`)
    runSqlFile(tmp)
  } finally {
    fs.unlinkSync(tmp)
  }
}

function writeSizedBatches(statements, labelPrefix) {
  let batch = []
  let batchBytes = 0
  let part = 0
  for (const stmt of statements) {
    const size = Buffer.byteLength(stmt, 'utf8') + 2
    if (batch.length && batchBytes + size > MAX_FILE_BYTES) {
      writeBatch(batch, `${labelPrefix}-${part}`)
      part += 1
      batch = []
      batchBytes = 0
    }
    batch.push(stmt)
    batchBytes += size
  }
  if (batch.length) writeBatch(batch, `${labelPrefix}-${part}`)
}

function articleRow(a) {
  return {
    id: a.id,
    title: a.title || '',
    slug: a.slug || '',
    excerpt: a.excerpt || '',
    content: a.content || '',
    featured_image: a.featuredImage || '',
    category: a.category || 'formula-1',
    content_type: a.contentType || 'news',
    tags_json: JSON.stringify(a.tags || []),
    author: a.author || '',
    author_id: a.authorId || '',
    status: a.status || 'published',
    featured: a.featured ? 1 : 0,
    scheduled_at: a.scheduledAt == null ? null : Number(a.scheduledAt),
    created_at: Number(a.createdAt) || Date.now(),
    updated_at: Number(a.updatedAt) || Date.now(),
    published_at: a.publishedAt == null ? null : Number(a.publishedAt),
  }
}

function articleSqlStatements(a) {
  const row = articleRow(a)
  const content = row.content
  const head = content.slice(0, SQL_CHUNK)
  const stmts = [
    `INSERT OR REPLACE INTO articles (
      id, title, slug, excerpt, content, featured_image, category, content_type, tags_json,
      author, author_id, status, featured, scheduled_at, created_at, updated_at, published_at
    ) VALUES (${[
      sqlString(row.id),
      sqlString(row.title),
      sqlString(row.slug),
      sqlString(row.excerpt),
      sqlString(head),
      sqlString(row.featured_image),
      sqlString(row.category),
      sqlString(row.content_type),
      sqlString(row.tags_json),
      sqlString(row.author),
      sqlString(row.author_id),
      sqlString(row.status),
      row.featured,
      row.scheduled_at == null ? 'NULL' : row.scheduled_at,
      row.created_at,
      row.updated_at,
      row.published_at == null ? 'NULL' : row.published_at,
    ].join(', ')})`,
  ]
  for (let i = SQL_CHUNK; i < content.length; i += SQL_CHUNK) {
    stmts.push(
      `UPDATE articles SET content = content || ${sqlString(content.slice(i, i + SQL_CHUNK))} WHERE id = ${sqlString(row.id)}`,
    )
  }
  return stmts
}

const importPath = path.join(root, 'src', 'data', 'wp-import.json')
const data = JSON.parse(fs.readFileSync(importPath, 'utf8'))
const authors = data.authors || []
const articles = data.articles || []

const adminEmail = (process.env.SEED_ADMIN_EMAIL || '').trim().toLowerCase()
const adminPassword = process.env.SEED_ADMIN_PASSWORD || ''

const INSERT_AUTHOR = `
  INSERT OR REPLACE INTO authors (id, name, bio, avatar, twitter, instagram, linkedin)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`
const INSERT_ARTICLE = `
  INSERT OR REPLACE INTO articles (
    id, title, slug, excerpt, content, featured_image, category, content_type, tags_json,
    author, author_id, status, featured, scheduled_at, created_at, updated_at, published_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`
const INSERT_USER = `
  INSERT OR REPLACE INTO users (id, email, password_hash, display_name, role, created_at)
  VALUES (?, ?, ?, ?, 'admin', ?)
`

function seedLocal() {
  const dbPath = findLocalDbPath()
  console.log(`Seeding local D1 via ${dbPath}`)
  const db = new DatabaseSync(dbPath)
  db.exec('PRAGMA foreign_keys = ON;')

  const insertAuthor = db.prepare(INSERT_AUTHOR)
  const insertArticle = db.prepare(INSERT_ARTICLE)

  db.exec('BEGIN')
  try {
    for (const a of authors) {
      insertAuthor.run(
        a.id,
        a.name || '',
        a.bio || '',
        a.avatar || '',
        a.twitter || '',
        a.instagram || '',
        a.linkedin || '',
      )
    }
    for (const a of articles) {
      const row = articleRow(a)
      insertArticle.run(
        row.id,
        row.title,
        row.slug,
        row.excerpt,
        row.content,
        row.featured_image,
        row.category,
        row.content_type,
        row.tags_json,
        row.author,
        row.author_id,
        row.status,
        row.featured,
        row.scheduled_at,
        row.created_at,
        row.updated_at,
        row.published_at,
      )
    }
    if (adminEmail && adminPassword) {
      const id = createHash('sha256').update(adminEmail).digest('hex').slice(0, 32)
      const passwordHash = hashPassword(adminPassword)
      const display = process.env.SEED_ADMIN_NAME || adminEmail.split('@')[0]
      db.prepare(INSERT_USER).run(id, adminEmail, passwordHash, display, Date.now())
    }
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
  db.close()
}

function seedRemote() {
  console.log('Seeding remote D1 via wrangler...')
  const authorSql = authors.map(
    (a) =>
      `INSERT OR REPLACE INTO authors (id, name, bio, avatar, twitter, instagram, linkedin) VALUES (${[
        sqlString(a.id),
        sqlString(a.name),
        sqlString(a.bio || ''),
        sqlString(a.avatar || ''),
        sqlString(a.twitter || ''),
        sqlString(a.instagram || ''),
        sqlString(a.linkedin || ''),
      ].join(', ')})`,
  )
  if (authorSql.length) writeSizedBatches(authorSql, 'authors')
  writeSizedBatches(articles.flatMap(articleSqlStatements), 'articles')

  if (adminEmail && adminPassword) {
    const id = createHash('sha256').update(adminEmail).digest('hex').slice(0, 32)
    const passwordHash = hashPassword(adminPassword)
    const display = process.env.SEED_ADMIN_NAME || adminEmail.split('@')[0]
    writeBatch(
      [
        `INSERT OR REPLACE INTO users (id, email, password_hash, display_name, role, created_at) VALUES (${[
          sqlString(id),
          sqlString(adminEmail),
          sqlString(passwordHash),
          sqlString(display),
          sqlString('admin'),
          Date.now(),
        ].join(', ')})`,
      ],
      'admin',
    )
  }
}

if (remote) seedRemote()
else seedLocal()

if (adminEmail && adminPassword) console.log(`Bootstrap admin ready: ${adminEmail}`)
else console.log('Skipped admin seed (set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to create one).')

console.log(`Done. Seeded ${authors.length} authors and ${articles.length} articles${remote ? ' (remote)' : ' (local)'}.`)
