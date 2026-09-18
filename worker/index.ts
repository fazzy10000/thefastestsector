import { handleApi } from './api'
import type { Env } from './env'
import { syncSchedule } from './schedule/sync'

const RESERVED_SLUGS = new Set([
  'article',
  'category',
  'search',
  'standings',
  'quizzes',
  'quiz',
  'schedule',
  'about',
  'contact',
  'join',
  'privacy',
  'policies',
  'editorial-policy',
  'corrections-policy',
  'terms',
  'unsubscribe',
  'sector-sweep',
  'interactive',
  'games',
  'author',
  'team',
  'admin',
  'api',
  'media',
  'assets',
  'favicon.svg',
  'icons.svg',
  'robots.txt',
  'sitemap.xml',
])

const ARTICLE_CATEGORIES = new Set([
  'formula-1',
  'feeder-series',
  'formula-e',
  'indycar',
  'exclusive',
  'f1-academy',
  'other',
  'news',
])

const STATIC_REDIRECTS: Record<string, string> = {
  '/about-us': '/about',
  '/about-us/': '/about',
  '/join-the-fastest-sector-team-today': '/join',
  '/join-the-fastest-sector-team-today/': '/join',
  '/join-us': '/join',
  '/join-us/': '/join',
  '/privacy-policy': '/privacy',
  '/privacy-policy/': '/privacy',
  '/terms-of-service': '/terms',
  '/terms-of-service/': '/terms',
  '/terms-and-conditions': '/terms',
  '/terms-and-conditions/': '/terms',
}

function redirect(to: string, permanent = true): Response {
  return new Response(null, {
    status: permanent ? 301 : 302,
    headers: { Location: to },
  })
}

async function articlePathBySlug(env: Env, slug: string): Promise<string | null> {
  const row = await env.DB.prepare(
    `SELECT category, slug FROM articles WHERE slug = ? LIMIT 1`,
  )
    .bind(slug)
    .first<{ category: string; slug: string }>()
  if (!row?.slug) return null
  const category = (row.category || 'other').trim() || 'other'
  return `/${category}/${row.slug}`
}

async function resolveLegacyRedirect(pathname: string, env: Env): Promise<string | null> {
  if (STATIC_REDIRECTS[pathname]) return STATIC_REDIRECTS[pathname]

  // Old SPA article URLs → /{category}/{slug}
  const oldArticle = pathname.match(/^\/article\/([a-z0-9-]+)\/?$/i)
  if (oldArticle) {
    return (await articlePathBySlug(env, oldArticle[1])) || `/other/${oldArticle[1]}`
  }

  // WordPress dated permalinks
  const dated = pathname.match(/^\/(\d{4})\/(\d{2})\/(\d{2})\/([a-z0-9-]+)\/?$/i)
  if (dated) {
    return (await articlePathBySlug(env, dated[4])) || `/other/${dated[4]}`
  }

  // Bare category → category listing
  const bare = pathname.match(/^\/([a-z0-9-]+)\/?$/i)
  if (bare) {
    const key = bare[1].toLowerCase()
    if (RESERVED_SLUGS.has(key)) return null
    if (ARTICLE_CATEGORIES.has(key)) return `/category/${key}`
    return (await articlePathBySlug(env, bare[1])) || `/other/${bare[1]}`
  }

  return null
}

export default {
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      syncSchedule(env.DB).catch((err) => {
        console.error('schedule sync failed', err)
      }),
    )
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // Serve uploaded images from R2 (works locally and in production)
    if (
      (request.method === 'GET' || request.method === 'HEAD') &&
      url.pathname.startsWith('/media/')
    ) {
      const key = decodeURIComponent(url.pathname.slice('/media/'.length))
      if (!key || key.includes('..') || key.startsWith('/')) {
        return new Response('Not found', { status: 404 })
      }
      const object = await env.IMAGES.get(key)
      if (!object) return new Response('Not found', { status: 404 })
      const headers = new Headers()
      object.writeHttpMetadata(headers)
      headers.set('etag', object.httpEtag)
      headers.set('Cache-Control', 'public, max-age=31536000, immutable')
      headers.set('Access-Control-Allow-Origin', '*')
      if (request.method === 'HEAD') return new Response(null, { status: 200, headers })
      return new Response(object.body, { status: 200, headers })
    }

    const apiResponse = await handleApi(request, env, url)
    if (apiResponse) return apiResponse

    if (request.method === 'GET' || request.method === 'HEAD') {
      const target = await resolveLegacyRedirect(url.pathname, env)
      if (target) {
        const dest = new URL(target, url.origin)
        dest.search = url.search
        return redirect(dest.toString())
      }
    }

    return env.ASSETS.fetch(request)
  },
}
