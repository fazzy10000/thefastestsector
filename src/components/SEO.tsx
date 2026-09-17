import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

interface SEOProps {
  title?: string
  description?: string
  image?: string
  type?: 'website' | 'article'
  article?: {
    author?: string
    publishedTime?: string
    tags?: string[]
  }
}

const SITE_NAME = 'The Fastest Sector'
const DEFAULT_DESC = 'Home of quick, quirky and reliable motorsport content.'
const PRODUCTION_BASE = 'https://thefastestsector.com'

function resolveBaseUrl(): string {
  if (typeof window === 'undefined') return PRODUCTION_BASE
  const host = window.location.hostname
  if (host === 'thefastestsector.com' || host === 'www.thefastestsector.com' || host === 'localhost') {
    return host === 'localhost' ? window.location.origin : PRODUCTION_BASE
  }
  // Preview / workers.dev: use the live origin so shares and canonical match the page
  return window.location.origin
}

function buildDocumentTitle(title?: string): string {
  if (!title?.trim()) return `${SITE_NAME} — ${DEFAULT_DESC}`
  const cleaned = title
    .replace(new RegExp(`\\s*[|—–-]\\s*${SITE_NAME}\\s*$`, 'i'), '')
    .trim()
  if (!cleaned || cleaned.toLowerCase() === SITE_NAME.toLowerCase()) return SITE_NAME
  return `${cleaned} — ${SITE_NAME}`
}

function setMeta(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    if (property.startsWith('og:') || property.startsWith('article:')) {
      el.setAttribute('property', property)
    } else {
      el.setAttribute('name', property)
    }
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setJsonLd(data: object) {
  const id = 'jsonld-seo'
  let el = document.getElementById(id) as HTMLScriptElement | null
  if (!el) {
    el = document.createElement('script')
    el.id = id
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

function setCanonical(url: string) {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.rel = 'canonical'
    document.head.appendChild(el)
  }
  el.href = url
}

export default function SEO({ title, description, image, type = 'website', article }: SEOProps) {
  const location = useLocation()

  useEffect(() => {
    const baseUrl = resolveBaseUrl()
    const pageTitle = buildDocumentTitle(title)
    const pageDesc = description || DEFAULT_DESC
    const pageUrl = `${baseUrl}${location.pathname}`
    const pageImage = image
      ? image.startsWith('http')
        ? image
        : `${baseUrl}${image.startsWith('/') ? '' : '/'}${image}`
      : `${PRODUCTION_BASE}/og-default.jpg`

    document.title = pageTitle

    setMeta('description', pageDesc)
    setMeta('robots', 'index, follow')

    const ogTitle = title
      ? title.replace(new RegExp(`\\s*[|—–-]\\s*${SITE_NAME}\\s*$`, 'i'), '').trim() || SITE_NAME
      : SITE_NAME
    setMeta('og:title', ogTitle)
    setMeta('og:description', pageDesc)
    setMeta('og:url', pageUrl)
    setMeta('og:image', pageImage)
    setMeta('og:type', type === 'article' ? 'article' : 'website')
    setMeta('og:site_name', SITE_NAME)
    setMeta('og:locale', 'en_US')

    setMeta('twitter:card', image ? 'summary_large_image' : 'summary')
    setMeta('twitter:title', ogTitle)
    setMeta('twitter:description', pageDesc)
    setMeta('twitter:image', pageImage)

    setCanonical(pageUrl)

    if (article) {
      if (article.author) setMeta('article:author', article.author)
      if (article.publishedTime) setMeta('article:published_time', article.publishedTime)
      article.tags?.forEach((tag, i) => setMeta(`article:tag:${i}`, tag))
    }

    const jsonLd: Record<string, unknown> = type === 'article'
      ? {
          '@context': 'https://schema.org',
          '@type': 'NewsArticle',
          headline: ogTitle,
          description: pageDesc,
          image: pageImage,
          url: pageUrl,
          datePublished: article?.publishedTime,
          author: article?.author ? { '@type': 'Person', name: article.author } : undefined,
          publisher: {
            '@type': 'Organization',
            name: SITE_NAME,
            url: PRODUCTION_BASE,
          },
        }
      : {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: SITE_NAME,
          description: pageDesc,
          url: baseUrl,
        }

    setJsonLd(jsonLd)
  }, [title, description, image, type, article, location.pathname])

  return null
}
