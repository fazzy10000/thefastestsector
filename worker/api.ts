import type { Env, SessionUser, UserRole } from './env'
import {
  can,
  clearSessionCookie,
  createSessionToken,
  getSessionUser,
  hashPassword,
  requireUser,
  sessionCookie,
  verifyPassword,
} from './auth'
import { id, json, parseJson, parseJsonArray, parseJsonValue } from './http'
import { sendViaResend } from '../src/lib/resendSend'
import { verifyUnsubscribeToken } from '../src/lib/unsubscribeToken'
import { DEFAULT_SEO_SETTINGS, DEFAULT_SETTINGS } from '../src/lib/types'
import { mergeSettings } from '../src/lib/mergeSettings'
import { normalizeCategory } from '../src/lib/normalizeCategory'
import { ensureScheduleTable, readScheduleSnapshot, syncSchedule } from './schedule/sync'
import { sortEventsChronologically, withStatus } from './schedule/status'

type ArticleRow = {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  featured_image: string
  category: string
  content_type: string
  tags_json: string
  author: string
  author_id: string
  editor?: string
  editor_id?: string
  status: string
  featured: number
  scheduled_at: number | null
  created_at: number
  updated_at: number
  published_at: number | null
}

function mapArticle(row: ArticleRow) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: rewriteMediaUrls(row.content),
    featuredImage: rewriteMediaUrls(row.featured_image),
    category: normalizeCategory(row.category, row.title, row.slug),
    contentType: row.content_type,
    tags: parseJsonArray(row.tags_json),
    author: row.author,
    authorId: row.author_id,
    editor: row.editor ?? '',
    editorId: row.editor_id ?? '',
    status: row.status,
    featured: Boolean(row.featured),
    scheduledAt: row.scheduled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
  }
}

/** Old uploads stored absolute r2.dev URLs; serve them via the Worker instead. */
function rewriteMediaUrls(value: string): string {
  if (!value) return value
  return value
    .replace(/https:\/\/pub-[a-z0-9]+\.r2\.dev\/((?:images|videos)\/[^\s"'\\]+)/gi, '/media/$1')
    .replace(/https:\/\/[^/\s"']+\/media\/((?:images|videos)\/[^\s"'\\]+)/gi, '/media/$1')
}

function normalizeExternalUrl(raw: string): string {
  const value = (raw || '').trim()
  if (!value) return ''
  if (/^(https?:|mailto:|tel:)/i.test(value)) return value
  if (value.startsWith('//')) return `https:${value}`
  return `https://${value}`
}

async function ensureArticleEditorColumns(env: Env) {
  try {
    await env.DB.prepare(`ALTER TABLE articles ADD COLUMN editor TEXT NOT NULL DEFAULT ''`).run()
  } catch {
    // column already exists
  }
  try {
    await env.DB.prepare(`ALTER TABLE articles ADD COLUMN editor_id TEXT NOT NULL DEFAULT ''`).run()
  } catch {
    // column already exists
  }
}

let statsAdsTablesReady = false

async function ensureStatsAdsTables(env: Env) {
  if (statsAdsTablesReady) return
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS page_views (
      id TEXT PRIMARY KEY,
      path TEXT NOT NULL,
      article_slug TEXT NOT NULL DEFAULT '',
      referrer TEXT NOT NULL DEFAULT '',
      visitor_id TEXT NOT NULL DEFAULT '',
      country TEXT NOT NULL DEFAULT '',
      device TEXT NOT NULL DEFAULT '',
      day TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_page_views_day ON page_views(day)`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at)`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS ads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      placement TEXT NOT NULL DEFAULT 'article-sidebar',
      image_url TEXT NOT NULL DEFAULT '',
      target_url TEXT NOT NULL DEFAULT '',
      html TEXT NOT NULL DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1,
      starts_at INTEGER,
      ends_at INTEGER,
      impressions INTEGER NOT NULL DEFAULT 0,
      clicks INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_ads_placement ON ads(placement, active)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS newsletter_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      subject TEXT NOT NULL DEFAULT '',
      preview_text TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      created_by TEXT NOT NULL DEFAULT ''
    )`),
  ])
  // Columns added after the table first shipped — safe no-ops when they already exist
  try {
    await env.DB.prepare(`ALTER TABLE page_views ADD COLUMN country TEXT NOT NULL DEFAULT ''`).run()
  } catch {
    // column already exists
  }
  try {
    await env.DB.prepare(`ALTER TABLE page_views ADD COLUMN device TEXT NOT NULL DEFAULT ''`).run()
  } catch {
    // column already exists
  }
  statsAdsTablesReady = true
}

function deviceFromUserAgent(ua: string): string {
  if (/iPad|Tablet/i.test(ua)) return 'tablet'
  if (/Mobi|Android|iPhone/i.test(ua)) return 'mobile'
  if (!ua) return ''
  return 'desktop'
}

type AdRow = {
  id: string
  name: string
  placement: string
  image_url: string
  target_url: string
  html: string
  active: number
  starts_at: number | null
  ends_at: number | null
  impressions: number
  clicks: number
  created_at: number
  updated_at: number
}

function mapAd(row: AdRow) {
  return {
    id: row.id,
    name: row.name,
    placement: row.placement,
    imageUrl: rewriteMediaUrls(row.image_url),
    targetUrl: normalizeExternalUrl(row.target_url),
    html: row.html,
    active: Boolean(row.active),
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    impressions: row.impressions,
    clicks: row.clicks,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function publishDueScheduled(env: Env) {
  const now = Date.now()
  await env.DB.prepare(
    `UPDATE articles SET status = 'published', published_at = scheduled_at, updated_at = ?
     WHERE status = 'scheduled' AND scheduled_at IS NOT NULL AND scheduled_at <= ?`,
  )
    .bind(now, now)
    .run()
}

export async function handleApi(request: Request, env: Env, url: URL): Promise<Response | null> {
  if (!url.pathname.startsWith('/api/')) return null

  const path = url.pathname
  const method = request.method
  const secure = url.protocol === 'https:'

  try {
    await ensureArticleEditorColumns(env)
    await ensureStatsAdsTables(env)
    await ensureScheduleTable(env.DB)

    // --- Public race calendar (D1 snapshot; Worker cron refreshes weekly) ---
    if (path === '/api/schedule' && method === 'GET') {
      const snapshot = await readScheduleSnapshot(env.DB)
      // Lazy first sync when the snapshot is empty (local/dev or fresh D1)
      if (snapshot.events.length === 0) {
        const synced = await syncSchedule(env.DB)
        return json({
          events: withStatus(synced.events),
          syncedAt: synced.syncedAt,
          sources: synced.sources,
        })
      }
      return json({
        events: withStatus(sortEventsChronologically(snapshot.events)),
        syncedAt: snapshot.syncedAt,
        sources: snapshot.sources,
      })
    }

    if (path === '/api/schedule/refresh' && method === 'POST') {
      const auth = await requireUser(request, env, 'manage_settings')
      if ('error' in auth) return auth.error
      if (auth.user.role !== 'admin') return json({ error: 'Forbidden' }, { status: 403 })
      const synced = await syncSchedule(env.DB)
      return json({
        ok: true,
        changed: synced.changed,
        events: withStatus(synced.events),
        syncedAt: synced.syncedAt,
        sources: synced.sources,
      })
    }

    // --- Auth ---
    if (path === '/api/auth/login' && method === 'POST') {
      const body = await parseJson<{ email?: string; password?: string }>(request)
      const email = body?.email?.trim().toLowerCase() || ''
      const password = body?.password || ''
      if (!email || !password) return json({ error: 'Email and password required' }, { status: 400 })
      if (!env.SESSION_SECRET) {
        return json({ error: 'SESSION_SECRET is not configured on the Worker' }, { status: 503 })
      }
      const row = await env.DB.prepare(
        'SELECT id, email, password_hash, display_name, role FROM users WHERE email = ?',
      )
        .bind(email)
        .first<{ id: string; email: string; password_hash: string; display_name: string; role: UserRole }>()
      if (!row || !(await verifyPassword(password, row.password_hash))) {
        return json({ error: 'Invalid email or password' }, { status: 401 })
      }
      const user: SessionUser = {
        id: row.id,
        email: row.email,
        displayName: row.display_name,
        role: row.role,
      }
      const token = await createSessionToken(user, env.SESSION_SECRET)
      return json(
        { user: { uid: user.id, email: user.email, displayName: user.displayName, role: user.role } },
        { headers: { 'Set-Cookie': sessionCookie(token, secure) } },
      )
    }

    if (path === '/api/auth/logout' && method === 'POST') {
      return json({ ok: true }, { headers: { 'Set-Cookie': clearSessionCookie(secure) } })
    }

    if (path === '/api/auth/me' && method === 'GET') {
      const user = await getSessionUser(request, env)
      if (!user) return json({ user: null })
      return json({
        user: { uid: user.id, email: user.email, displayName: user.displayName, role: user.role },
      })
    }

    if (path === '/api/auth/signup' && method === 'POST') {
      const body = await parseJson<{
        inviteId?: string
        email?: string
        password?: string
        displayName?: string
      }>(request)
      const inviteId = body?.inviteId?.trim() || ''
      const email = body?.email?.trim().toLowerCase() || ''
      const password = body?.password || ''
      const displayName = body?.displayName?.trim() || email.split('@')[0] || 'User'
      if (!inviteId || !email || !password) {
        return json({ error: 'Invite, email, and password required' }, { status: 400 })
      }
      if (!env.SESSION_SECRET) {
        return json({ error: 'SESSION_SECRET is not configured on the Worker' }, { status: 503 })
      }
      const invite = await env.DB.prepare(
        'SELECT id, email, role, used FROM invites WHERE id = ?',
      )
        .bind(inviteId)
        .first<{ id: string; email: string; role: UserRole; used: number }>()
      if (!invite || invite.used) return json({ error: 'Invalid or used invite' }, { status: 400 })
      if (invite.email.trim().toLowerCase() !== email) {
        return json({ error: 'Email does not match invite' }, { status: 400 })
      }
      const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
      if (existing) return json({ error: 'Account already exists' }, { status: 409 })
      const userId = id()
      const passwordHash = await hashPassword(password)
      const now = Date.now()
      await env.DB.batch([
        env.DB.prepare(
          'INSERT INTO users (id, email, password_hash, display_name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        ).bind(userId, email, passwordHash, displayName, invite.role, now),
        env.DB.prepare('UPDATE invites SET used = 1 WHERE id = ?').bind(inviteId),
      ])
      const user: SessionUser = { id: userId, email, displayName, role: invite.role }
      const token = await createSessionToken(user, env.SESSION_SECRET)
      return json(
        { user: { uid: user.id, email: user.email, displayName: user.displayName, role: user.role } },
        { headers: { 'Set-Cookie': sessionCookie(token, secure) } },
      )
    }

    // --- Upload ---
    if (path === '/api/upload' && method === 'POST') {
      const auth = await requireUser(request, env, 'manage_media')
      if ('error' in auth) return auth.error
      const formData = await request.formData()
      const file = formData.get('file') as unknown as File | null
      if (!file) return json({ error: 'Missing file' }, { status: 400 })
      const type = file.type || ''
      const nameLower = file.name.toLowerCase()
      const isVideo =
        type.startsWith('video/') || /\.(mp4|webm|mov|m4v|ogv)$/i.test(nameLower)
      const isImage =
        type.startsWith('image/') || /\.(gif|jpe?g|png|webp|avif|svg)$/i.test(nameLower)
      if (!isVideo && !isImage) {
        return json({ error: 'Only images, GIFs, and videos are allowed' }, { status: 400 })
      }
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const folder = isVideo ? 'videos' : 'images'
      const key = `${folder}/${Date.now()}_${safeName}`
      await env.IMAGES.put(key, file.stream(), {
        httpMetadata: { contentType: file.type || 'application/octet-stream' },
      })
      // Same-origin path served by the Worker from R2 (works in local + production)
      return json({ url: `/media/${key}` })
    }

    // --- Newsletter send ---
    if (path === '/api/newsletter/status' && method === 'GET') {
      return json({
        configured: Boolean(env.RESEND_API_KEY),
        from: env.NEWSLETTER_FROM || 'The Fastest Sector <beth.t@example.com>',
      })
    }

    if (path === '/api/newsletter/send' && method === 'POST') {
      const auth = await requireUser(request, env, 'manage_newsletter')
      if ('error' in auth) return auth.error
      const apiKey = env.RESEND_API_KEY
      if (!apiKey) {
        return json(
          {
            error:
              'Newsletter sending is not configured. Add RESEND_API_KEY secret: npx wrangler secret put RESEND_API_KEY',
          },
          { status: 503 },
        )
      }
      const body = await parseJson<{
        subject?: string
        html?: string
        previewText?: string
        emails?: unknown
      }>(request)
      const result = await sendViaResend({
        apiKey,
        from: env.NEWSLETTER_FROM || 'The Fastest Sector <beth.t@example.com>',
        subject: body?.subject ?? '',
        html: body?.html ?? '',
        previewText: body?.previewText,
        emails: body?.emails ?? [],
        secret: env.SESSION_SECRET,
        siteOrigin: 'https://thefastestsector.com',
      })
      if ('error' in result) return json({ error: result.error }, { status: result.status })
      return json({ sent: result.sent })
    }

    // --- Forms (public) ---
    if (path === '/api/contact' && method === 'POST') {
      const body = await parseJson<{
        name?: string
        email?: string
        subject?: string
        foundUs?: string
        message?: string
      }>(request)
      if (!body?.name?.trim() || !body?.email?.trim() || !body?.message?.trim()) {
        return json({ error: 'Name, email, and message required' }, { status: 400 })
      }
      await env.DB.prepare(
        `INSERT INTO contact_submissions (id, name, email, subject, found_us, message, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'new', ?)`,
      )
        .bind(
          id(),
          body.name.trim(),
          body.email.trim().toLowerCase(),
          body.subject?.trim() || '',
          body.foundUs?.trim() || '',
          body.message.trim(),
          Date.now(),
        )
        .run()
      return json({ ok: true })
    }

    if (path === '/api/newsletter/subscribe' && method === 'POST') {
      const body = await parseJson<{ email?: string; source?: string; edition?: string }>(request)
      const email = body?.email?.trim().toLowerCase() || ''
      if (!email || !email.includes('@')) return json({ error: 'Valid email required' }, { status: 400 })
      const existing = await env.DB.prepare(
        'SELECT id, status FROM newsletter_subscribers WHERE email = ?',
      )
        .bind(email)
        .first<{ id: string; status: string }>()
      if (!existing) {
        await env.DB.prepare(
          `INSERT INTO newsletter_subscribers (id, email, source, edition, status, created_at)
           VALUES (?, ?, ?, ?, 'active', ?)`,
        )
          .bind(id(), email, body?.source || 'footer', body?.edition || 'all', Date.now())
          .run()
      } else if (existing.status === 'unsubscribed') {
        // Re-subscribe after an unsubscribe
        await env.DB.prepare(
          `UPDATE newsletter_subscribers SET status = 'active', source = ?, edition = ? WHERE id = ?`,
        )
          .bind(body?.source || 'footer', body?.edition || 'all', existing.id)
          .run()
      }
      return json({ ok: true })
    }

    // One-click / signed-link unsubscribe (public)
    if (path === '/api/newsletter/unsubscribe' && (method === 'GET' || method === 'POST')) {
      let email = ''
      let token = ''
      if (method === 'GET') {
        email = (url.searchParams.get('e') || url.searchParams.get('email') || '').trim().toLowerCase()
        token = (url.searchParams.get('t') || url.searchParams.get('token') || '').trim()
      } else {
        const ct = request.headers.get('content-type') || ''
        if (ct.includes('application/json')) {
          const body = await parseJson<{ email?: string; e?: string; token?: string; t?: string }>(request)
          email = (body?.email || body?.e || '').trim().toLowerCase()
          token = (body?.token || body?.t || '').trim()
        } else {
          const raw = await request.text()
          const params = new URLSearchParams(raw)
          email = (params.get('e') || params.get('email') || '').trim().toLowerCase()
          token = (params.get('t') || params.get('token') || '').trim()
        }
      }
      if (!email || !email.includes('@') || !token) {
        return json({ error: 'Invalid unsubscribe link' }, { status: 400 })
      }
      if (!env.SESSION_SECRET) {
        return json({ error: 'Unsubscribe is not configured' }, { status: 503 })
      }
      const ok = await verifyUnsubscribeToken(email, token, env.SESSION_SECRET)
      if (!ok) return json({ error: 'Invalid or expired unsubscribe link' }, { status: 403 })

      const row = await env.DB.prepare('SELECT id, status FROM newsletter_subscribers WHERE email = ?')
        .bind(email)
        .first<{ id: string; status: string }>()
      if (row && row.status !== 'unsubscribed') {
        await env.DB.prepare(
          `UPDATE newsletter_subscribers SET status = 'unsubscribed' WHERE id = ?`,
        )
          .bind(row.id)
          .run()
      }
      return json({ ok: true, email, status: 'unsubscribed' })
    }

    if (path === '/api/join' && method === 'POST') {
      const body = await parseJson<{
        firstName?: string
        lastName?: string
        email?: string
        instagram?: string
        role?: string
        why?: string
        portfolioUrl?: string
      }>(request)
      if (!body?.firstName?.trim() || !body?.lastName?.trim() || !body?.email?.trim() || !body?.why?.trim()) {
        return json({ error: 'Required fields missing' }, { status: 400 })
      }
      await env.DB.prepare(
        `INSERT INTO team_applications
         (id, first_name, last_name, email, instagram, role, why, portfolio_url, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)`,
      )
        .bind(
          id(),
          body.firstName.trim(),
          body.lastName.trim(),
          body.email.trim().toLowerCase(),
          body.instagram?.trim() || '',
          body.role || 'writer',
          body.why.trim(),
          body.portfolioUrl?.trim() || '',
          Date.now(),
        )
        .run()
      return json({ ok: true })
    }

    // --- Analytics tracking (public) ---
    if (path === '/api/track' && method === 'POST') {
      const body = await parseJson<{ path?: string; referrer?: string; visitorId?: string }>(request)
      const pagePath = (body?.path || '').slice(0, 500)
      if (!pagePath || !pagePath.startsWith('/') || pagePath.startsWith('/admin')) {
        return json({ ok: true })
      }
      const slugMatch = pagePath.match(/^\/article\/([^/?#]+)/)
      let referrerHost = ''
      try {
        if (body?.referrer) {
          const ref = new URL(body.referrer)
          if (ref.hostname !== url.hostname) referrerHost = ref.hostname
        }
      } catch {
        // ignore invalid referrer
      }
      const now = Date.now()
      const day = new Date(now).toISOString().slice(0, 10)
      const cf = (request as Request & { cf?: { country?: string } }).cf
      const country = typeof cf?.country === 'string' ? cf.country.toUpperCase().slice(0, 2) : ''
      const device = deviceFromUserAgent(request.headers.get('User-Agent') || '')
      await env.DB.prepare(
        `INSERT INTO page_views (id, path, article_slug, referrer, visitor_id, country, device, day, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          id(),
          pagePath,
          slugMatch ? decodeURIComponent(slugMatch[1]) : '',
          referrerHost,
          String(body?.visitorId || '').slice(0, 64),
          country,
          device,
          day,
          now,
        )
        .run()
      return json({ ok: true })
    }

    // --- Stats (staff) ---
    if (path === '/api/stats/traffic' && method === 'GET') {
      const auth = await requireUser(request, env, 'view_stats')
      if ('error' in auth) return auth.error
      const days = Math.min(Math.max(Number(url.searchParams.get('days') || '30'), 1), 365)
      const since = Date.now() - days * 86_400_000
      const prevSince = since - days * 86_400_000
      const [daily, topPages, referrers, totals, prevTotals, countries, devices, byWeekday, byHour] =
        await Promise.all([
        env.DB.prepare(
          `SELECT day, COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS visitors
           FROM page_views WHERE created_at >= ? GROUP BY day ORDER BY day ASC`,
        )
          .bind(since)
          .all<{ day: string; views: number; visitors: number }>(),
        env.DB.prepare(
          `SELECT pv.path, pv.article_slug, COUNT(*) AS views, a.title
           FROM page_views pv
           LEFT JOIN articles a ON a.slug = pv.article_slug AND pv.article_slug != ''
           WHERE pv.created_at >= ?
           GROUP BY pv.path ORDER BY views DESC LIMIT 15`,
        )
          .bind(since)
          .all<{ path: string; article_slug: string; views: number; title: string | null }>(),
        env.DB.prepare(
          `SELECT referrer, COUNT(*) AS views FROM page_views
           WHERE created_at >= ? AND referrer != ''
           GROUP BY referrer ORDER BY views DESC LIMIT 10`,
        )
          .bind(since)
          .all<{ referrer: string; views: number }>(),
        env.DB.prepare(
          `SELECT COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS visitors
           FROM page_views WHERE created_at >= ?`,
        )
          .bind(since)
          .first<{ views: number; visitors: number }>(),
        env.DB.prepare(
          `SELECT COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS visitors
           FROM page_views WHERE created_at >= ? AND created_at < ?`,
        )
          .bind(prevSince, since)
          .first<{ views: number; visitors: number }>(),
        env.DB.prepare(
          `SELECT country, COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS visitors
           FROM page_views WHERE created_at >= ? AND country != ''
           GROUP BY country ORDER BY views DESC LIMIT 12`,
        )
          .bind(since)
          .all<{ country: string; views: number; visitors: number }>(),
        env.DB.prepare(
          `SELECT device, COUNT(*) AS views FROM page_views
           WHERE created_at >= ? AND device != ''
           GROUP BY device ORDER BY views DESC`,
        )
          .bind(since)
          .all<{ device: string; views: number }>(),
        env.DB.prepare(
          `SELECT CAST(strftime('%w', created_at / 1000, 'unixepoch') AS INTEGER) AS weekday,
                  COUNT(*) AS views
           FROM page_views WHERE created_at >= ? GROUP BY weekday ORDER BY weekday`,
        )
          .bind(since)
          .all<{ weekday: number; views: number }>(),
        env.DB.prepare(
          `SELECT CAST(strftime('%H', created_at / 1000, 'unixepoch') AS INTEGER) AS hour,
                  COUNT(*) AS views
           FROM page_views WHERE created_at >= ? GROUP BY hour ORDER BY hour`,
        )
          .bind(since)
          .all<{ hour: number; views: number }>(),
      ])
      return json({
        days,
        totals: { views: totals?.views || 0, visitors: totals?.visitors || 0 },
        prevTotals: { views: prevTotals?.views || 0, visitors: prevTotals?.visitors || 0 },
        daily: daily.results || [],
        topPages: (topPages.results || []).map((p) => ({
          path: p.path,
          slug: p.article_slug,
          title: p.title || '',
          views: p.views,
        })),
        referrers: referrers.results || [],
        countries: countries.results || [],
        devices: devices.results || [],
        byWeekday: byWeekday.results || [],
        byHour: byHour.results || [],
      })
    }

    if (path === '/api/stats/insights' && method === 'GET') {
      const auth = await requireUser(request, env, 'view_stats')
      if ('error' in auth) return auth.error
      const [allTime, bestDay, byCategory, byAuthor, monthly, subscribers, firstView] =
        await Promise.all([
          env.DB.prepare(
            `SELECT COUNT(*) AS views, COUNT(DISTINCT visitor_id) AS visitors FROM page_views`,
          ).first<{ views: number; visitors: number }>(),
          env.DB.prepare(
            `SELECT day, COUNT(*) AS views FROM page_views GROUP BY day ORDER BY views DESC LIMIT 1`,
          ).first<{ day: string; views: number }>(),
          env.DB.prepare(
            `SELECT a.category, COUNT(*) AS views FROM page_views pv
             JOIN articles a ON a.slug = pv.article_slug
             WHERE pv.article_slug != '' GROUP BY a.category ORDER BY views DESC`,
          ).all<{ category: string; views: number }>(),
          env.DB.prepare(
            `SELECT a.author, COUNT(*) AS views FROM page_views pv
             JOIN articles a ON a.slug = pv.article_slug
             WHERE pv.article_slug != '' AND a.author != ''
             GROUP BY a.author ORDER BY views DESC LIMIT 10`,
          ).all<{ author: string; views: number }>(),
          env.DB.prepare(
            `SELECT strftime('%Y-%m', published_at / 1000, 'unixepoch') AS month, COUNT(*) AS posts
             FROM articles WHERE status = 'published' AND published_at IS NOT NULL
             GROUP BY month ORDER BY month DESC LIMIT 12`,
          ).all<{ month: string; posts: number }>(),
          env.DB.prepare(
            `SELECT COUNT(*) AS count FROM newsletter_subscribers WHERE status != 'unsubscribed'`,
          ).first<{
            count: number
          }>(),
          env.DB.prepare(`SELECT MIN(created_at) AS first FROM page_views`).first<{
            first: number | null
          }>(),
        ])
      return json({
        allTime: { views: allTime?.views || 0, visitors: allTime?.visitors || 0 },
        bestDay: bestDay || null,
        byCategory: byCategory.results || [],
        byAuthor: byAuthor.results || [],
        monthlyPosts: (monthly.results || []).reverse(),
        subscriberCount: subscribers?.count || 0,
        trackingSince: firstView?.first || null,
      })
    }

    // --- Ads ---
    if (path === '/api/ads/active' && method === 'GET') {
      const placement = url.searchParams.get('placement') || 'article-sidebar'
      const now = Date.now()
      const ad = await env.DB.prepare(
        `SELECT * FROM ads WHERE placement = ? AND active = 1
         AND (starts_at IS NULL OR starts_at <= ?)
         AND (ends_at IS NULL OR ends_at >= ?)
         ORDER BY RANDOM() LIMIT 1`,
      )
        .bind(placement, now, now)
        .first<AdRow>()
      if (!ad) return json({ ad: null })
      await env.DB.prepare('UPDATE ads SET impressions = impressions + 1 WHERE id = ?')
        .bind(ad.id)
        .run()
      return json({
        ad: {
          id: ad.id,
          placement: ad.placement,
          imageUrl: rewriteMediaUrls(ad.image_url),
          targetUrl: normalizeExternalUrl(ad.target_url),
          html: ad.html,
        },
      })
    }

    const adClickMatch = path.match(/^\/api\/ads\/([^/]+)\/click$/)
    if (adClickMatch && method === 'POST') {
      await env.DB.prepare('UPDATE ads SET clicks = clicks + 1 WHERE id = ?')
        .bind(adClickMatch[1])
        .run()
      return json({ ok: true })
    }

    if (path === '/api/ads' && method === 'GET') {
      const auth = await requireUser(request, env, 'manage_ads')
      if ('error' in auth) return auth.error
      const { results } = await env.DB.prepare('SELECT * FROM ads ORDER BY created_at DESC').all<AdRow>()
      return json({ ads: (results || []).map(mapAd) })
    }

    if (path === '/api/ads' && method === 'POST') {
      const auth = await requireUser(request, env, 'manage_ads')
      if ('error' in auth) return auth.error
      const body = await parseJson<Record<string, unknown>>(request)
      if (!body?.name || !String(body.name).trim()) {
        return json({ error: 'Name required' }, { status: 400 })
      }
      const adId = id()
      const now = Date.now()
      await env.DB.prepare(
        `INSERT INTO ads (id, name, placement, image_url, target_url, html, active, starts_at, ends_at, impressions, clicks, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)`,
      )
        .bind(
          adId,
          String(body.name).trim(),
          String(body.placement || 'article-sidebar'),
          String(body.imageUrl || ''),
          normalizeExternalUrl(String(body.targetUrl || '')),
          String(body.html || ''),
          body.active === false ? 0 : 1,
          (body.startsAt as number | null) ?? null,
          (body.endsAt as number | null) ?? null,
          now,
          now,
        )
        .run()
      return json({ id: adId })
    }

    const adMatch = path.match(/^\/api\/ads\/([^/]+)$/)
    if (adMatch) {
      const adId = adMatch[1]
      if (method === 'PATCH') {
        const auth = await requireUser(request, env, 'manage_ads')
        if ('error' in auth) return auth.error
        const body = await parseJson<Record<string, unknown>>(request)
        const existing = await env.DB.prepare('SELECT * FROM ads WHERE id = ?')
          .bind(adId)
          .first<AdRow>()
        if (!existing) return json({ error: 'Not found' }, { status: 404 })
        await env.DB.prepare(
          `UPDATE ads SET name=?, placement=?, image_url=?, target_url=?, html=?, active=?, starts_at=?, ends_at=?, updated_at=? WHERE id=?`,
        )
          .bind(
            body?.name !== undefined ? String(body.name) : existing.name,
            body?.placement !== undefined ? String(body.placement) : existing.placement,
            body?.imageUrl !== undefined ? String(body.imageUrl) : existing.image_url,
            body?.targetUrl !== undefined
              ? normalizeExternalUrl(String(body.targetUrl))
              : existing.target_url,
            body?.html !== undefined ? String(body.html) : existing.html,
            body?.active !== undefined ? (body.active ? 1 : 0) : existing.active,
            body?.startsAt !== undefined ? (body.startsAt as number | null) : existing.starts_at,
            body?.endsAt !== undefined ? (body.endsAt as number | null) : existing.ends_at,
            Date.now(),
            adId,
          )
          .run()
        return json({ ok: true })
      }
      if (method === 'DELETE') {
        const auth = await requireUser(request, env, 'manage_ads')
        if ('error' in auth) return auth.error
        await env.DB.prepare('DELETE FROM ads WHERE id = ?').bind(adId).run()
        return json({ ok: true })
      }
    }

    // --- Articles ---
    if (path === '/api/articles' && method === 'GET') {
      await publishDueScheduled(env)
      const status = url.searchParams.get('status')
      const category = url.searchParams.get('category')
      const authorId = url.searchParams.get('authorId')
      const featured = url.searchParams.get('featured')
      const contentType = url.searchParams.get('contentType')
      const q = (url.searchParams.get('q') || '').trim()
      const fields = url.searchParams.get('fields') || 'summary'
      const page = Math.max(1, Number(url.searchParams.get('page') || '1') || 1)
      const rawLimit = url.searchParams.get('limit')
      // Default 0 = return all (legacy). Cap page size when paginating.
      const limit = rawLimit !== null ? Math.min(100, Math.max(0, Number(rawLimit) || 0)) : 0
      const staff = await getSessionUser(request, env)
      const clauses: string[] = []
      const binds: unknown[] = []
      if (!staff) {
        clauses.push(`status = 'published'`)
      } else if (status) {
        clauses.push('status = ?')
        binds.push(status)
      }
      if (category) {
        if (category === 'f1-academy') {
          clauses.push(
            `(category = ? OR (category = 'other' AND (LOWER(title) LIKE '%f1 academy%' OR LOWER(slug) LIKE '%f1-academy%')))`,
          )
          binds.push(category)
        } else {
          clauses.push('category = ?')
          binds.push(category)
        }
      }
      if (authorId) {
        clauses.push('author_id = ?')
        binds.push(authorId)
      }
      if (contentType === 'news') {
        // Treat blank/legacy content_type as news (matches prior client filter)
        clauses.push(`(content_type = 'news' OR content_type = '' OR content_type IS NULL)`)
      } else if (contentType) {
        clauses.push('content_type = ?')
        binds.push(contentType)
      }
      if (featured === 'true') clauses.push('featured = 1')
      if (featured === 'false') clauses.push('featured = 0')
      if (q) {
        const like = `%${q.replace(/[%_]/g, '')}%`
        clauses.push('(title LIKE ? OR excerpt LIKE ? OR author LIKE ? OR tags_json LIKE ?)')
        binds.push(like, like, like, like)
      }
      const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : ''
      const countRow = await env.DB.prepare(`SELECT COUNT(*) AS total FROM articles${where}`)
        .bind(...binds)
        .first<{ total: number }>()
      const total = Number(countRow?.total || 0)

      // Lean list payload by default — full HTML content only when fields=full
      const selectCols =
        fields === 'full'
          ? 'SELECT * FROM articles'
          : `SELECT id, title, slug, excerpt, '' AS content, featured_image, category, content_type,
             tags_json, author, author_id, editor, editor_id, status, featured, scheduled_at,
             created_at, updated_at, published_at FROM articles`
      let sql = selectCols + where + ' ORDER BY COALESCE(published_at, created_at) DESC'
      const listBinds = [...binds]
      if (limit > 0) {
        sql += ' LIMIT ? OFFSET ?'
        listBinds.push(limit, (page - 1) * limit)
      }
      const { results } = await env.DB.prepare(sql)
        .bind(...listBinds)
        .all<ArticleRow>()

      let counts: { all: number; published: number; draft: number; scheduled: number } | undefined
      if (staff) {
        const { results: statusRows } = await env.DB.prepare(
          `SELECT status, COUNT(*) AS c FROM articles GROUP BY status`,
        ).all<{ status: string; c: number }>()
        const byStatus = Object.fromEntries((statusRows || []).map((r) => [r.status, Number(r.c)]))
        counts = {
          published: byStatus.published || 0,
          draft: byStatus.draft || 0,
          scheduled: byStatus.scheduled || 0,
          all: (byStatus.published || 0) + (byStatus.draft || 0) + (byStatus.scheduled || 0),
        }
      }

      return json({
        articles: (results || []).map(mapArticle),
        total,
        page: limit > 0 ? page : 1,
        limit: limit > 0 ? limit : total,
        counts,
      })
    }

    if (path === '/api/articles' && method === 'POST') {
      const auth = await requireUser(request, env, 'edit_own_article')
      if ('error' in auth) return auth.error
      const body = await parseJson<Record<string, unknown>>(request)
      if (!body?.title || !body?.slug) return json({ error: 'Title and slug required' }, { status: 400 })
      const status = String(body.status || 'draft')
      if (
        (status === 'published' || status === 'scheduled') &&
        !can(auth.user.role, 'publish_article')
      ) {
        return json(
          { error: 'Only editors and admins can publish or schedule articles' },
          { status: 403 },
        )
      }
      const articleId = id()
      const now = Date.now()
      await env.DB.prepare(
        `INSERT INTO articles
         (id, title, slug, excerpt, content, featured_image, category, content_type, tags_json,
          author, author_id, editor, editor_id, status, featured, scheduled_at, created_at, updated_at, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          articleId,
          String(body.title),
          String(body.slug),
          String(body.excerpt || ''),
          String(body.content || ''),
          String(body.featuredImage || ''),
          String(body.category || 'formula-1'),
          String(body.contentType || 'news'),
          JSON.stringify(body.tags || []),
          String(body.author || ''),
          String(body.authorId || ''),
          String(body.editor || ''),
          String(body.editorId || ''),
          status,
          body.featured ? 1 : 0,
          body.scheduledAt ?? null,
          Number(body.createdAt) || now,
          Number(body.updatedAt) || now,
          body.publishedAt ?? null,
        )
        .run()
      return json({ id: articleId })
    }

    const articleBySlug = path.match(/^\/api\/articles\/by-slug\/([^/]+)$/)
    if (articleBySlug && method === 'GET') {
      await publishDueScheduled(env)
      const slug = decodeURIComponent(articleBySlug[1])
      const staff = await getSessionUser(request, env)
      const row = await env.DB.prepare('SELECT * FROM articles WHERE slug = ?')
        .bind(slug)
        .first<ArticleRow>()
      if (!row) return json({ error: 'Not found' }, { status: 404 })
      if (!staff && row.status !== 'published') return json({ error: 'Not found' }, { status: 404 })
      return json({ article: mapArticle(row) })
    }

    const articleMatch = path.match(/^\/api\/articles\/([^/]+)$/)
    if (articleMatch) {
      const articleId = articleMatch[1]
      if (method === 'GET') {
        const staff = await getSessionUser(request, env)
        const row = await env.DB.prepare('SELECT * FROM articles WHERE id = ?')
          .bind(articleId)
          .first<ArticleRow>()
        if (!row) return json({ error: 'Not found' }, { status: 404 })
        if (!staff && row.status !== 'published') return json({ error: 'Not found' }, { status: 404 })
        return json({ article: mapArticle(row) })
      }
      if (method === 'PATCH') {
        const auth = await requireUser(request, env, 'edit_own_article')
        if ('error' in auth) return auth.error
        const body = await parseJson<Record<string, unknown>>(request)
        if (!body) return json({ error: 'Invalid body' }, { status: 400 })
        const existing = await env.DB.prepare('SELECT * FROM articles WHERE id = ?')
          .bind(articleId)
          .first<ArticleRow>()
        if (!existing) return json({ error: 'Not found' }, { status: 404 })
        const nextStatus = body.status !== undefined ? String(body.status) : existing.status
        const statusChanging = nextStatus !== existing.status
        const liveStatuses = new Set(['published', 'scheduled'])
        const publishAction =
          statusChanging && (liveStatuses.has(nextStatus) || liveStatuses.has(existing.status))
        if (publishAction && !can(auth.user.role, 'publish_article')) {
          return json(
            { error: 'Only editors and admins can publish, schedule, or unpublish articles' },
            { status: 403 },
          )
        }
        const next = {
          title: body.title !== undefined ? String(body.title) : existing.title,
          slug: body.slug !== undefined ? String(body.slug) : existing.slug,
          excerpt: body.excerpt !== undefined ? String(body.excerpt) : existing.excerpt,
          content: body.content !== undefined ? String(body.content) : existing.content,
          featured_image:
            body.featuredImage !== undefined ? String(body.featuredImage) : existing.featured_image,
          category: body.category !== undefined ? String(body.category) : existing.category,
          content_type:
            body.contentType !== undefined ? String(body.contentType) : existing.content_type,
          tags_json: body.tags !== undefined ? JSON.stringify(body.tags) : existing.tags_json,
          author: body.author !== undefined ? String(body.author) : existing.author,
          author_id: body.authorId !== undefined ? String(body.authorId) : existing.author_id,
          editor: body.editor !== undefined ? String(body.editor) : (existing.editor ?? ''),
          editor_id: body.editorId !== undefined ? String(body.editorId) : (existing.editor_id ?? ''),
          status: nextStatus,
          featured: body.featured !== undefined ? (body.featured ? 1 : 0) : existing.featured,
          scheduled_at:
            body.scheduledAt !== undefined ? (body.scheduledAt as number | null) : existing.scheduled_at,
          published_at:
            body.publishedAt !== undefined ? (body.publishedAt as number | null) : existing.published_at,
          updated_at: Date.now(),
        }
        await env.DB.prepare(
          `UPDATE articles SET title=?, slug=?, excerpt=?, content=?, featured_image=?, category=?,
           content_type=?, tags_json=?, author=?, author_id=?, editor=?, editor_id=?, status=?, featured=?,
           scheduled_at=?, published_at=?, updated_at=? WHERE id=?`,
        )
          .bind(
            next.title,
            next.slug,
            next.excerpt,
            next.content,
            next.featured_image,
            next.category,
            next.content_type,
            next.tags_json,
            next.author,
            next.author_id,
            next.editor,
            next.editor_id,
            next.status,
            next.featured,
            next.scheduled_at,
            next.published_at,
            next.updated_at,
            articleId,
          )
          .run()
        return json({ ok: true })
      }
      if (method === 'DELETE') {
        const auth = await requireUser(request, env, 'edit_any_article')
        if ('error' in auth) return auth.error
        await env.DB.batch([
          env.DB.prepare('DELETE FROM article_versions WHERE article_id = ?').bind(articleId),
          env.DB.prepare('DELETE FROM seo_overrides WHERE article_id = ?').bind(articleId),
          env.DB.prepare('DELETE FROM articles WHERE id = ?').bind(articleId),
        ])
        return json({ ok: true })
      }
    }

    const versionsMatch = path.match(/^\/api\/articles\/([^/]+)\/versions$/)
    if (versionsMatch) {
      const articleId = versionsMatch[1]
      if (method === 'GET') {
        const auth = await requireUser(request, env, 'edit_own_article')
        if ('error' in auth) return auth.error
        const { results } = await env.DB.prepare(
          'SELECT content, title, excerpt, edited_by, edited_at FROM article_versions WHERE article_id = ? ORDER BY edited_at DESC',
        )
          .bind(articleId)
          .all<{
            content: string
            title: string
            excerpt: string
            edited_by: string
            edited_at: number
          }>()
        return json({
          versions: (results || []).map((v) => ({
            content: v.content,
            title: v.title,
            excerpt: v.excerpt,
            editedBy: v.edited_by,
            editedAt: v.edited_at,
          })),
        })
      }
      if (method === 'POST') {
        const auth = await requireUser(request, env, 'edit_own_article')
        if ('error' in auth) return auth.error
        const body = await parseJson<{
          content?: string
          title?: string
          excerpt?: string
          editedBy?: string
          editedAt?: number
        }>(request)
        await env.DB.prepare(
          `INSERT INTO article_versions (id, article_id, content, title, excerpt, edited_by, edited_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
          .bind(
            id(),
            articleId,
            body?.content || '',
            body?.title || '',
            body?.excerpt || '',
            body?.editedBy || auth.user.email,
            body?.editedAt || Date.now(),
          )
          .run()
        return json({ ok: true })
      }
    }

    // --- Authors ---
    if (path === '/api/authors' && method === 'GET') {
      const { results } = await env.DB.prepare('SELECT * FROM authors ORDER BY name ASC').all<{
        id: string
        name: string
        bio: string
        avatar: string
        twitter: string
        instagram: string
        linkedin: string
      }>()
      return json({
        authors: (results || []).map((a) => ({
          id: a.id,
          name: a.name,
          bio: a.bio,
          avatar: rewriteMediaUrls(a.avatar),
          twitter: a.twitter,
          instagram: a.instagram,
          linkedin: a.linkedin,
        })),
      })
    }

    if (path === '/api/authors' && method === 'POST') {
      const auth = await requireUser(request, env, 'manage_authors')
      if ('error' in auth) return auth.error
      const body = await parseJson<{
        id?: string
        name?: string
        bio?: string
        avatar?: string
        twitter?: string
        instagram?: string
        linkedin?: string
      }>(request)
      if (!body?.name?.trim()) return json({ error: 'Name required' }, { status: 400 })
      const authorId = body.id || id()
      await env.DB.prepare(
        `INSERT INTO authors (id, name, bio, avatar, twitter, instagram, linkedin)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name=excluded.name, bio=excluded.bio, avatar=excluded.avatar,
           twitter=excluded.twitter, instagram=excluded.instagram, linkedin=excluded.linkedin`,
      )
        .bind(
          authorId,
          body.name.trim(),
          body.bio || '',
          body.avatar || '',
          body.twitter || '',
          body.instagram || '',
          body.linkedin || '',
        )
        .run()
      return json({ id: authorId })
    }

    const authorMatch = path.match(/^\/api\/authors\/([^/]+)$/)
    if (authorMatch && method === 'DELETE') {
      const auth = await requireUser(request, env, 'manage_authors')
      if ('error' in auth) return auth.error
      await env.DB.prepare('DELETE FROM authors WHERE id = ?').bind(authorMatch[1]).run()
      return json({ ok: true })
    }

    // --- Quizzes ---
    if (path === '/api/quizzes' && method === 'GET') {
      const status = url.searchParams.get('status')
      const staff = await getSessionUser(request, env)
      let sql = 'SELECT * FROM quizzes'
      const binds: unknown[] = []
      if (!staff) {
        sql += ` WHERE status = 'published'`
      } else if (status) {
        sql += ' WHERE status = ?'
        binds.push(status)
      }
      sql += ' ORDER BY updated_at DESC'
      const { results } = await env.DB.prepare(sql)
        .bind(...binds)
        .all<{
          id: string
          title: string
          slug: string
          description: string
          category: string
          featured_image: string
          questions_json: string
          status: string
          created_at: number
          updated_at: number
        }>()
      return json({
        quizzes: (results || []).map((q) => ({
          id: q.id,
          title: q.title,
          slug: q.slug,
          description: q.description,
          category: q.category,
          featuredImage: rewriteMediaUrls(q.featured_image),
          questions: parseJsonValue(q.questions_json, []),
          status: q.status,
          createdAt: q.created_at,
          updatedAt: q.updated_at,
        })),
      })
    }

    if (path === '/api/quizzes' && method === 'POST') {
      const auth = await requireUser(request, env, 'manage_quizzes')
      if ('error' in auth) return auth.error
      const body = await parseJson<Record<string, unknown>>(request)
      if (!body?.title || !body?.slug) return json({ error: 'Title and slug required' }, { status: 400 })
      const quizId = id()
      const now = Date.now()
      await env.DB.prepare(
        `INSERT INTO quizzes
         (id, title, slug, description, category, featured_image, questions_json, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          quizId,
          String(body.title),
          String(body.slug),
          String(body.description || ''),
          String(body.category || 'formula-1'),
          String(body.featuredImage || ''),
          JSON.stringify(body.questions || []),
          String(body.status || 'draft'),
          Number(body.createdAt) || now,
          Number(body.updatedAt) || now,
        )
        .run()
      return json({ id: quizId })
    }

    const quizBySlug = path.match(/^\/api\/quizzes\/by-slug\/([^/]+)$/)
    if (quizBySlug && method === 'GET') {
      const slug = decodeURIComponent(quizBySlug[1])
      const staff = await getSessionUser(request, env)
      const q = await env.DB.prepare('SELECT * FROM quizzes WHERE slug = ?')
        .bind(slug)
        .first<{
          id: string
          title: string
          slug: string
          description: string
          category: string
          featured_image: string
          questions_json: string
          status: string
          created_at: number
          updated_at: number
        }>()
      if (!q || (!staff && q.status !== 'published')) return json({ error: 'Not found' }, { status: 404 })
      return json({
        quiz: {
          id: q.id,
          title: q.title,
          slug: q.slug,
          description: q.description,
          category: q.category,
          featuredImage: rewriteMediaUrls(q.featured_image),
          questions: parseJsonValue(q.questions_json, []),
          status: q.status,
          createdAt: q.created_at,
          updatedAt: q.updated_at,
        },
      })
    }

    const quizMatch = path.match(/^\/api\/quizzes\/([^/]+)$/)
    if (quizMatch) {
      const quizId = quizMatch[1]
      if (method === 'GET') {
        const staff = await getSessionUser(request, env)
        const q = await env.DB.prepare('SELECT * FROM quizzes WHERE id = ?')
          .bind(quizId)
          .first<{
            id: string
            title: string
            slug: string
            description: string
            category: string
            featured_image: string
            questions_json: string
            status: string
            created_at: number
            updated_at: number
          }>()
        if (!q || (!staff && q.status !== 'published')) return json({ error: 'Not found' }, { status: 404 })
        return json({
          quiz: {
            id: q.id,
            title: q.title,
            slug: q.slug,
            description: q.description,
            category: q.category,
            featuredImage: rewriteMediaUrls(q.featured_image),
            questions: parseJsonValue(q.questions_json, []),
            status: q.status,
            createdAt: q.created_at,
            updatedAt: q.updated_at,
          },
        })
      }
      if (method === 'PATCH') {
        const auth = await requireUser(request, env, 'manage_quizzes')
        if ('error' in auth) return auth.error
        const body = await parseJson<Record<string, unknown>>(request)
        const existing = await env.DB.prepare('SELECT * FROM quizzes WHERE id = ?').bind(quizId).first<{
          title: string
          slug: string
          description: string
          category: string
          featured_image: string
          questions_json: string
          status: string
          created_at: number
        }>()
        if (!existing) return json({ error: 'Not found' }, { status: 404 })
        await env.DB.prepare(
          `UPDATE quizzes SET title=?, slug=?, description=?, category=?, featured_image=?,
           questions_json=?, status=?, updated_at=? WHERE id=?`,
        )
          .bind(
            body?.title !== undefined ? String(body.title) : existing.title,
            body?.slug !== undefined ? String(body.slug) : existing.slug,
            body?.description !== undefined ? String(body.description) : existing.description,
            body?.category !== undefined ? String(body.category) : existing.category,
            body?.featuredImage !== undefined ? String(body.featuredImage) : existing.featured_image,
            body?.questions !== undefined ? JSON.stringify(body.questions) : existing.questions_json,
            body?.status !== undefined ? String(body.status) : existing.status,
            Date.now(),
            quizId,
          )
          .run()
        return json({ ok: true })
      }
      if (method === 'DELETE') {
        const auth = await requireUser(request, env, 'manage_quizzes')
        if ('error' in auth) return auth.error
        await env.DB.prepare('DELETE FROM quizzes WHERE id = ?').bind(quizId).run()
        return json({ ok: true })
      }
    }

    // --- Media ---
    if (path === '/api/media' && method === 'GET') {
      const auth = await requireUser(request, env, 'manage_media')
      if ('error' in auth) return auth.error
      const q = (url.searchParams.get('q') || '').trim()
      const page = Math.max(1, Number(url.searchParams.get('page') || '1') || 1)
      const rawLimit = url.searchParams.get('limit')
      const limit = rawLimit !== null ? Math.min(100, Math.max(0, Number(rawLimit) || 0)) : 0
      const clauses: string[] = []
      const binds: unknown[] = []
      if (q) {
        const like = `%${q.replace(/[%_]/g, '')}%`
        clauses.push('(name LIKE ? OR alt LIKE ? OR tags_json LIKE ?)')
        binds.push(like, like, like)
      }
      const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : ''
      const countRow = await env.DB.prepare(`SELECT COUNT(*) AS total FROM media${where}`)
        .bind(...binds)
        .first<{ total: number }>()
      const total = Number(countRow?.total || 0)
      let sql = `SELECT * FROM media${where} ORDER BY created_at DESC`
      const listBinds = [...binds]
      if (limit > 0) {
        sql += ' LIMIT ? OFFSET ?'
        listBinds.push(limit, (page - 1) * limit)
      }
      const { results } = await env.DB.prepare(sql)
        .bind(...listBinds)
        .all<{
          id: string
          url: string
          name: string
          alt: string
          tags_json: string
          created_at: number
          updated_at: number
          created_by: string
        }>()
      return json({
        assets: (results || []).map((a) => ({
          id: a.id,
          url: rewriteMediaUrls(a.url),
          name: a.name,
          alt: a.alt,
          tags: parseJsonArray(a.tags_json),
          createdAt: a.created_at,
          updatedAt: a.updated_at,
          createdBy: a.created_by,
        })),
        total,
        page: limit > 0 ? page : 1,
        limit: limit > 0 ? limit : total,
      })
    }

    if (path === '/api/media' && method === 'POST') {
      const auth = await requireUser(request, env, 'manage_media')
      if ('error' in auth) return auth.error
      const body = await parseJson<{
        url?: string
        name?: string
        alt?: string
        tags?: string[]
        createdBy?: string
      }>(request)
      if (!body?.url) return json({ error: 'URL required' }, { status: 400 })
      const existing = await env.DB.prepare('SELECT * FROM media WHERE url = ?')
        .bind(body.url)
        .first<{
          id: string
          url: string
          name: string
          alt: string
          tags_json: string
          created_at: number
          updated_at: number
          created_by: string
        }>()
      if (existing) {
        return json({
          asset: {
            id: existing.id,
            url: rewriteMediaUrls(existing.url),
            name: existing.name,
            alt: existing.alt,
            tags: parseJsonArray(existing.tags_json),
            createdAt: existing.created_at,
            updatedAt: existing.updated_at,
            createdBy: existing.created_by,
          },
        })
      }
      const assetId = id()
      const now = Date.now()
      await env.DB.prepare(
        `INSERT INTO media (id, url, name, alt, tags_json, created_at, updated_at, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          assetId,
          body.url,
          body.name || 'Untitled',
          body.alt || '',
          JSON.stringify(body.tags || []),
          now,
          now,
          body.createdBy || auth.user.id,
        )
        .run()
      return json({
        asset: {
          id: assetId,
          url: rewriteMediaUrls(body.url),
          name: body.name || 'Untitled',
          alt: body.alt || '',
          tags: body.tags || [],
          createdAt: now,
          updatedAt: now,
          createdBy: body.createdBy || auth.user.id,
        },
      })
    }

    const mediaMatch = path.match(/^\/api\/media\/([^/]+)$/)
    if (mediaMatch) {
      const mediaId = mediaMatch[1]
      if (method === 'PATCH') {
        const auth = await requireUser(request, env, 'manage_media')
        if ('error' in auth) return auth.error
        const body = await parseJson<{ name?: string; alt?: string; tags?: string[]; url?: string }>(
          request,
        )
        const existing = await env.DB.prepare('SELECT * FROM media WHERE id = ?').bind(mediaId).first<{
          name: string
          alt: string
          tags_json: string
          url: string
        }>()
        if (!existing) return json({ error: 'Not found' }, { status: 404 })
        await env.DB.prepare(
          'UPDATE media SET name=?, alt=?, tags_json=?, url=?, updated_at=? WHERE id=?',
        )
          .bind(
            body?.name !== undefined ? body.name : existing.name,
            body?.alt !== undefined ? body.alt : existing.alt,
            body?.tags !== undefined ? JSON.stringify(body.tags) : existing.tags_json,
            body?.url !== undefined ? body.url : existing.url,
            Date.now(),
            mediaId,
          )
          .run()
        return json({ ok: true })
      }
      if (method === 'DELETE') {
        const auth = await requireUser(request, env, 'manage_media')
        if ('error' in auth) return auth.error
        await env.DB.prepare('DELETE FROM media WHERE id = ?').bind(mediaId).run()
        return json({ ok: true })
      }
    }

    // --- Newsletters ---
    if (path === '/api/newsletter-templates' && method === 'GET') {
      const auth = await requireUser(request, env, 'manage_newsletter')
      if ('error' in auth) return auth.error
      const { results } = await env.DB.prepare(
        'SELECT * FROM newsletter_templates ORDER BY updated_at DESC',
      ).all<{
        id: string
        name: string
        description: string
        subject: string
        preview_text: string
        content: string
        created_at: number
        updated_at: number
        created_by: string
      }>()
      return json({
        templates: (results || []).map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          subject: t.subject,
          previewText: t.preview_text,
          html: rewriteMediaUrls(t.content),
          createdAt: t.created_at,
          updatedAt: t.updated_at,
          createdBy: t.created_by,
          custom: true as const,
        })),
      })
    }

    if (path === '/api/newsletter-templates' && method === 'POST') {
      const auth = await requireUser(request, env, 'manage_newsletter')
      if ('error' in auth) return auth.error
      const body = await parseJson<{
        name?: string
        description?: string
        subject?: string
        previewText?: string
        html?: string
        content?: string
      }>(request)
      const name = body?.name?.trim() || ''
      if (!name) return json({ error: 'Template name required' }, { status: 400 })
      const content = String(body?.html ?? body?.content ?? '')
      const templateId = id()
      const now = Date.now()
      await env.DB.prepare(
        `INSERT INTO newsletter_templates
         (id, name, description, subject, preview_text, content, created_at, updated_at, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          templateId,
          name,
          body?.description?.trim() || '',
          body?.subject?.trim() || '',
          body?.previewText?.trim() || '',
          content,
          now,
          now,
          auth.user.id,
        )
        .run()
      return json({ id: templateId })
    }

    const templateMatch = path.match(/^\/api\/newsletter-templates\/([^/]+)$/)
    if (templateMatch) {
      const templateId = templateMatch[1]
      if (method === 'PATCH') {
        const auth = await requireUser(request, env, 'manage_newsletter')
        if ('error' in auth) return auth.error
        const existing = await env.DB.prepare('SELECT * FROM newsletter_templates WHERE id = ?')
          .bind(templateId)
          .first<{ id: string }>()
        if (!existing) return json({ error: 'Not found' }, { status: 404 })
        const body = await parseJson<{
          name?: string
          description?: string
          subject?: string
          previewText?: string
          html?: string
          content?: string
        }>(request)
        const name = body?.name?.trim()
        if (name !== undefined && !name) return json({ error: 'Template name required' }, { status: 400 })
        await env.DB.prepare(
          `UPDATE newsletter_templates SET
            name = COALESCE(?, name),
            description = COALESCE(?, description),
            subject = COALESCE(?, subject),
            preview_text = COALESCE(?, preview_text),
            content = COALESCE(?, content),
            updated_at = ?
           WHERE id = ?`,
        )
          .bind(
            name ?? null,
            body?.description !== undefined ? body.description.trim() : null,
            body?.subject !== undefined ? body.subject.trim() : null,
            body?.previewText !== undefined ? body.previewText.trim() : null,
            body?.html !== undefined ? body.html : body?.content !== undefined ? body.content : null,
            Date.now(),
            templateId,
          )
          .run()
        return json({ ok: true })
      }
      if (method === 'DELETE') {
        const auth = await requireUser(request, env, 'manage_newsletter')
        if ('error' in auth) return auth.error
        await env.DB.prepare('DELETE FROM newsletter_templates WHERE id = ?').bind(templateId).run()
        return json({ ok: true })
      }
    }

    if (path === '/api/newsletters' && method === 'GET') {
      const auth = await requireUser(request, env, 'manage_newsletter')
      if ('error' in auth) return auth.error
      const { results } = await env.DB.prepare('SELECT * FROM newsletters ORDER BY updated_at DESC').all<{
        id: string
        subject: string
        preview_text: string
        content: string
        edition: string
        status: string
        recipient_count: number
        created_at: number
        updated_at: number
        sent_at: number | null
        created_by: string
      }>()
      return json({
        newsletters: (results || []).map((n) => ({
          id: n.id,
          subject: n.subject,
          previewText: n.preview_text,
          content: n.content,
          edition: n.edition,
          status: n.status,
          recipientCount: n.recipient_count,
          createdAt: n.created_at,
          updatedAt: n.updated_at,
          sentAt: n.sent_at,
          createdBy: n.created_by,
        })),
      })
    }

    if (path === '/api/newsletters' && method === 'POST') {
      const auth = await requireUser(request, env, 'manage_newsletter')
      if ('error' in auth) return auth.error
      const body = await parseJson<Record<string, unknown>>(request)
      const newsletterId = id()
      const now = Date.now()
      await env.DB.prepare(
        `INSERT INTO newsletters
         (id, subject, preview_text, content, edition, status, recipient_count, created_at, updated_at, sent_at, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
        .bind(
          newsletterId,
          String(body?.subject || 'Untitled newsletter'),
          String(body?.previewText || ''),
          String(body?.content || ''),
          String(body?.edition || 'all'),
          String(body?.status || 'draft'),
          Number(body?.recipientCount) || 0,
          Number(body?.createdAt) || now,
          Number(body?.updatedAt) || now,
          body?.sentAt ?? null,
          String(body?.createdBy || auth.user.id),
        )
        .run()
      return json({ id: newsletterId })
    }

    if (path === '/api/newsletter-subscribers' && method === 'GET') {
      const auth = await requireUser(request, env, 'manage_newsletter')
      if ('error' in auth) return auth.error
      const page = Math.max(1, Number(url.searchParams.get('page') || '1') || 1)
      const rawLimit = url.searchParams.get('limit')
      const limit = rawLimit !== null ? Math.min(200, Math.max(0, Number(rawLimit) || 0)) : 0
      const countRow = await env.DB.prepare(
        'SELECT COUNT(*) AS total FROM newsletter_subscribers',
      ).first<{ total: number }>()
      const total = Number(countRow?.total || 0)
      let sql = 'SELECT * FROM newsletter_subscribers ORDER BY created_at DESC'
      const binds: unknown[] = []
      if (limit > 0) {
        sql += ' LIMIT ? OFFSET ?'
        binds.push(limit, (page - 1) * limit)
      }
      const { results } = await env.DB.prepare(sql)
        .bind(...binds)
        .all<{
          id: string
          email: string
          source: string
          edition: string
          status: string
          created_at: number
        }>()
      return json({
        subscribers: (results || []).map((s) => ({
          id: s.id,
          email: s.email,
          source: s.source,
          edition: s.edition,
          status: s.status,
          createdAt: s.created_at,
        })),
        total,
        page: limit > 0 ? page : 1,
        limit: limit > 0 ? limit : total,
      })
    }

    const newsletterMatch = path.match(/^\/api\/newsletters\/([^/]+)$/)
    if (newsletterMatch) {
      const newsletterId = newsletterMatch[1]
      if (method === 'GET') {
        const auth = await requireUser(request, env, 'manage_newsletter')
        if ('error' in auth) return auth.error
        const n = await env.DB.prepare('SELECT * FROM newsletters WHERE id = ?')
          .bind(newsletterId)
          .first<{
            id: string
            subject: string
            preview_text: string
            content: string
            edition: string
            status: string
            recipient_count: number
            created_at: number
            updated_at: number
            sent_at: number | null
            created_by: string
          }>()
        if (!n) return json({ error: 'Not found' }, { status: 404 })
        return json({
          newsletter: {
            id: n.id,
            subject: n.subject,
            previewText: n.preview_text,
            content: n.content,
            edition: n.edition,
            status: n.status,
            recipientCount: n.recipient_count,
            createdAt: n.created_at,
            updatedAt: n.updated_at,
            sentAt: n.sent_at,
            createdBy: n.created_by,
          },
        })
      }
      if (method === 'PATCH') {
        const auth = await requireUser(request, env, 'manage_newsletter')
        if ('error' in auth) return auth.error
        const body = await parseJson<Record<string, unknown>>(request)
        const existing = await env.DB.prepare('SELECT * FROM newsletters WHERE id = ?')
          .bind(newsletterId)
          .first<{
            subject: string
            preview_text: string
            content: string
            edition: string
            status: string
            recipient_count: number
            sent_at: number | null
          }>()
        if (!existing) return json({ error: 'Not found' }, { status: 404 })
        await env.DB.prepare(
          `UPDATE newsletters SET subject=?, preview_text=?, content=?, edition=?, status=?,
           recipient_count=?, sent_at=?, updated_at=? WHERE id=?`,
        )
          .bind(
            body?.subject !== undefined ? String(body.subject) : existing.subject,
            body?.previewText !== undefined ? String(body.previewText) : existing.preview_text,
            body?.content !== undefined ? String(body.content) : existing.content,
            body?.edition !== undefined ? String(body.edition) : existing.edition,
            body?.status !== undefined ? String(body.status) : existing.status,
            body?.recipientCount !== undefined
              ? Number(body.recipientCount)
              : existing.recipient_count,
            body?.sentAt !== undefined ? (body.sentAt as number | null) : existing.sent_at,
            Date.now(),
            newsletterId,
          )
          .run()
        return json({ ok: true })
      }
      if (method === 'DELETE') {
        const auth = await requireUser(request, env, 'manage_newsletter')
        if ('error' in auth) return auth.error
        await env.DB.prepare('DELETE FROM newsletters WHERE id = ?').bind(newsletterId).run()
        return json({ ok: true })
      }
    }

    // --- Users / invites ---
    if (path === '/api/users' && method === 'GET') {
      const auth = await requireUser(request, env, 'manage_users')
      if ('error' in auth) return auth.error
      const { results } = await env.DB.prepare(
        'SELECT id, email, display_name, role, created_at FROM users ORDER BY created_at ASC',
      ).all<{
        id: string
        email: string
        display_name: string
        role: UserRole
        created_at: number
      }>()
      return json({
        users: (results || []).map((u) => ({
          uid: u.id,
          email: u.email,
          displayName: u.display_name,
          role: u.role,
          createdAt: u.created_at,
        })),
      })
    }

    const userMatch = path.match(/^\/api\/users\/([^/]+)$/)
    if (userMatch) {
      const userId = userMatch[1]
      if (method === 'PATCH') {
        const auth = await requireUser(request, env, 'manage_users')
        if ('error' in auth) return auth.error
        const body = await parseJson<{ role?: UserRole; displayName?: string }>(request)
        if (body?.role) {
          await env.DB.prepare('UPDATE users SET role = ? WHERE id = ?').bind(body.role, userId).run()
        }
        if (body?.displayName !== undefined) {
          await env.DB.prepare('UPDATE users SET display_name = ? WHERE id = ?')
            .bind(body.displayName, userId)
            .run()
        }
        return json({ ok: true })
      }
      if (method === 'DELETE') {
        const auth = await requireUser(request, env, 'manage_users')
        if ('error' in auth) return auth.error
        if (auth.user.id === userId) return json({ error: 'Cannot delete yourself' }, { status: 400 })
        await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run()
        return json({ ok: true })
      }
    }

    if (path === '/api/invites' && method === 'GET') {
      const auth = await requireUser(request, env, 'manage_users')
      if ('error' in auth) return auth.error
      const { results } = await env.DB.prepare('SELECT * FROM invites ORDER BY created_at DESC').all<{
        id: string
        email: string
        role: UserRole
        created_by: string
        created_at: number
        used: number
      }>()
      return json({
        invites: (results || []).map((i) => ({
          id: i.id,
          email: i.email,
          role: i.role,
          createdBy: i.created_by,
          createdAt: i.created_at,
          used: Boolean(i.used),
        })),
      })
    }

    if (path === '/api/invites' && method === 'POST') {
      const auth = await requireUser(request, env, 'manage_users')
      if ('error' in auth) return auth.error
      const body = await parseJson<{ email?: string; role?: UserRole }>(request)
      const email = body?.email?.trim().toLowerCase() || ''
      if (!email) return json({ error: 'Email required' }, { status: 400 })
      const inviteId = id()
      await env.DB.prepare(
        'INSERT INTO invites (id, email, role, created_by, created_at, used) VALUES (?, ?, ?, ?, ?, 0)',
      )
        .bind(inviteId, email, body?.role || 'author', auth.user.id, Date.now())
        .run()
      return json({ id: inviteId })
    }

    const inviteMatch = path.match(/^\/api\/invites\/([^/]+)$/)
    if (inviteMatch) {
      if (method === 'GET') {
        const invite = await env.DB.prepare('SELECT * FROM invites WHERE id = ?')
          .bind(inviteMatch[1])
          .first<{
            id: string
            email: string
            role: UserRole
            created_by: string
            created_at: number
            used: number
          }>()
        if (!invite) return json({ error: 'Not found' }, { status: 404 })
        return json({
          invite: {
            id: invite.id,
            email: invite.email,
            role: invite.role,
            createdBy: invite.created_by,
            createdAt: invite.created_at,
            used: Boolean(invite.used),
          },
        })
      }
      if (method === 'DELETE') {
        const auth = await requireUser(request, env, 'manage_users')
        if ('error' in auth) return auth.error
        await env.DB.prepare('DELETE FROM invites WHERE id = ?').bind(inviteMatch[1]).run()
        return json({ ok: true })
      }
    }

    // --- Settings / SEO ---
    if (path === '/api/settings' && method === 'GET') {
      const row = await env.DB.prepare('SELECT data_json FROM settings WHERE id = ?')
        .bind('site')
        .first<{ data_json: string }>()
      return json({ settings: mergeSettings(parseJsonValue(row?.data_json, {})) })
    }

    if (path === '/api/settings' && method === 'PUT') {
      const auth = await requireUser(request, env, 'manage_settings')
      if ('error' in auth) return auth.error
      const body = await parseJson<unknown>(request)
      await env.DB.prepare(
        `INSERT INTO settings (id, data_json) VALUES ('site', ?)
         ON CONFLICT(id) DO UPDATE SET data_json = excluded.data_json`,
      )
        .bind(JSON.stringify(body || DEFAULT_SETTINGS))
        .run()
      return json({ ok: true })
    }

    if (path === '/api/seo/settings' && method === 'GET') {
      const row = await env.DB.prepare('SELECT data_json FROM settings WHERE id = ?')
        .bind('seo')
        .first<{ data_json: string }>()
      return json({ settings: parseJsonValue(row?.data_json, DEFAULT_SEO_SETTINGS) })
    }

    if (path === '/api/seo/settings' && method === 'PUT') {
      const auth = await requireUser(request, env, 'manage_seo')
      if ('error' in auth) return auth.error
      const body = await parseJson<unknown>(request)
      await env.DB.prepare(
        `INSERT INTO settings (id, data_json) VALUES ('seo', ?)
         ON CONFLICT(id) DO UPDATE SET data_json = excluded.data_json`,
      )
        .bind(JSON.stringify(body || DEFAULT_SEO_SETTINGS))
        .run()
      return json({ ok: true })
    }

    if (path === '/api/seo/overrides' && method === 'GET') {
      const { results } = await env.DB.prepare('SELECT * FROM seo_overrides').all<{
        article_id: string
        meta_title: string
        meta_description: string
        focus_keyphrase: string
        no_index: number
      }>()
      const overrides: Record<
        string,
        { metaTitle: string; metaDescription: string; focusKeyphrase: string; noIndex: boolean }
      > = {}
      for (const row of results || []) {
        overrides[row.article_id] = {
          metaTitle: row.meta_title,
          metaDescription: row.meta_description,
          focusKeyphrase: row.focus_keyphrase,
          noIndex: Boolean(row.no_index),
        }
      }
      return json({ overrides })
    }

    const seoOverrideMatch = path.match(/^\/api\/seo\/overrides\/([^/]+)$/)
    if (seoOverrideMatch && method === 'PUT') {
      const auth = await requireUser(request, env, 'manage_seo')
      if ('error' in auth) return auth.error
      const articleId = seoOverrideMatch[1]
      const body = await parseJson<{
        metaTitle?: string
        metaDescription?: string
        focusKeyphrase?: string
        noIndex?: boolean
      }>(request)
      await env.DB.prepare(
        `INSERT INTO seo_overrides (article_id, meta_title, meta_description, focus_keyphrase, no_index)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(article_id) DO UPDATE SET
           meta_title=excluded.meta_title,
           meta_description=excluded.meta_description,
           focus_keyphrase=excluded.focus_keyphrase,
           no_index=excluded.no_index`,
      )
        .bind(
          articleId,
          body?.metaTitle || '',
          body?.metaDescription || '',
          body?.focusKeyphrase || '',
          body?.noIndex ? 1 : 0,
        )
        .run()
      return json({ ok: true })
    }

    return json({ error: 'Not found' }, { status: 404 })
  } catch (err) {
    console.error(err)
    return json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
