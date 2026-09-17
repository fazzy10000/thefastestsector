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
  'admin',
  'api',
  'media',
  'assets',
  'favicon.svg',
  'icons.svg',
  'robots.txt',
  'sitemap.xml',
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

function resolveLegacyRedirect(pathname: string): string | null {
  if (STATIC_REDIRECTS[pathname]) return STATIC_REDIRECTS[pathname]

  const dated = pathname.match(/^\/(\d{4})\/(\d{2})\/(\d{2})\/([a-z0-9-]+)\/?$/i)
  if (dated) return `/article/${dated[4]}`

  const bare = pathname.match(/^\/([a-z0-9-]+)\/?$/i)
  if (bare && !RESERVED_SLUGS.has(bare[1].toLowerCase())) {
    return `/article/${bare[1]}`
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
      const target = resolveLegacyRedirect(url.pathname)
      if (target) {
        const dest = new URL(target, url.origin)
        dest.search = url.search
        return redirect(dest.toString())
      }
    }

    return env.ASSETS.fetch(request)
  },
}
