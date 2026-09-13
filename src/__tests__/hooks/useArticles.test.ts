import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useArticles } from '../../hooks/useArticles'
import type { Article, Category, ContentType } from '../../lib/types'

const store: { articles: Article[] } = { articles: [] }

function article(partial: Partial<Article> = {}): Article {
  return {
    id: partial.id || crypto.randomUUID(),
    title: partial.title || 'Title',
    slug: partial.slug || 'title',
    excerpt: '',
    content: '',
    featuredImage: '',
    category: 'formula-1' as Category,
    contentType: 'news' as ContentType,
    tags: [],
    author: '',
    authorId: '',
    editor: '',
    editorId: '',
    status: 'published',
    featured: false,
    scheduledAt: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    publishedAt: Date.now(),
    ...partial,
  }
}

describe('useArticles', () => {
  beforeEach(() => {
    store.articles = [article({ id: '1', title: 'One', slug: 'one' })]
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo, init?: RequestInit) => {
        const url = String(input)
        const method = (init?.method || 'GET').toUpperCase()
        if (url.startsWith('/api/articles') && method === 'GET' && !url.includes('/by-slug/')) {
          if (url.match(/^\/api\/articles\/[^/?]+$/)) {
            const id = url.split('/').pop()!
            const found = store.articles.find((a) => a.id === id)
            if (!found) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
            return new Response(JSON.stringify({ article: found }), { status: 200 })
          }
          return new Response(JSON.stringify({ articles: store.articles }), { status: 200 })
        }
        if (url.includes('/by-slug/')) {
          const slug = decodeURIComponent(url.split('/by-slug/')[1])
          const found = store.articles.find((a) => a.slug === slug)
          if (!found) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
          return new Response(JSON.stringify({ article: found }), { status: 200 })
        }
        if (url === '/api/articles' && method === 'POST') {
          const body = JSON.parse(String(init?.body || '{}')) as Omit<Article, 'id'>
          const created = article(body)
          store.articles.unshift(created)
          return new Response(JSON.stringify({ id: created.id }), { status: 200 })
        }
        return new Response(JSON.stringify({ error: 'not found' }), { status: 404 })
      }),
    )
  })

  it('fetches articles from the API', async () => {
    const { result } = renderHook(() => useArticles())
    await act(async () => {
      await result.current.fetchArticles()
    })
    await waitFor(() => expect(result.current.articles[0]?.title).toBe('One'))
  })

  it('gets article by slug', async () => {
    const { result } = renderHook(() => useArticles())
    let found: Article | null = null
    await act(async () => {
      found = await result.current.getArticleBySlug('one')
    })
    expect(found!.id).toBe('1')
  })
})
