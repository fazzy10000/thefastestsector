import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useArticles } from '../../hooks/useArticles'
import type { Article, Category, ContentType } from '../../lib/types'

const store: { articles: Article[] } = { articles: [] }

function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: overrides.id || crypto.randomUUID(),
    title: 'Published Test',
    slug: 'published-test',
    excerpt: 'An article published through the admin',
    content: '<p>Published content</p>',
    featuredImage: '',
    category: 'formula-1' as Category,
    contentType: 'news' as ContentType,
    tags: ['test'],
    author: 'Admin User',
    authorId: '',
    editor: '',
    editorId: '',
    status: 'published',
    featured: false,
    scheduledAt: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    publishedAt: Date.now(),
    ...overrides,
  }
}

describe('articles API hook', () => {
  beforeEach(() => {
    store.articles = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo, init?: RequestInit) => {
        const url = String(input)
        const method = (init?.method || 'GET').toUpperCase()

        if (url.startsWith('/api/articles') && method === 'GET') {
          const u = new URL(url, 'http://localhost')
          let list = [...store.articles]
          const status = u.searchParams.get('status')
          if (status) list = list.filter((a) => a.status === status)
          return new Response(JSON.stringify({ articles: list }), { status: 200 })
        }

        if (url === '/api/articles' && method === 'POST') {
          const body = JSON.parse(String(init?.body || '{}')) as Omit<Article, 'id'>
          const article = makeArticle(body)
          store.articles.unshift(article)
          return new Response(JSON.stringify({ id: article.id }), { status: 200 })
        }

        const patch = url.match(/^\/api\/articles\/([^/]+)$/)
        if (patch && method === 'PATCH') {
          const id = patch[1]
          const body = JSON.parse(String(init?.body || '{}')) as Partial<Article>
          const idx = store.articles.findIndex((a) => a.id === id)
          if (idx >= 0) store.articles[idx] = { ...store.articles[idx], ...body }
          return new Response(JSON.stringify({ ok: true }), { status: 200 })
        }

        if (patch && method === 'DELETE') {
          const id = patch[1]
          store.articles = store.articles.filter((a) => a.id !== id)
          return new Response(JSON.stringify({ ok: true }), { status: 200 })
        }

        return new Response(JSON.stringify({ error: 'not found' }), { status: 404 })
      }),
    )
  })

  it('creates and lists published articles', async () => {
    const { result } = renderHook(() => useArticles())
    await act(async () => {
      await result.current.createArticle(
        makeArticle({ title: 'Breaking: Test Passes!', id: undefined as unknown as string }),
      )
    })
    await act(async () => {
      await result.current.fetchArticles({ status: 'published' })
    })
    await waitFor(() => {
      expect(result.current.articles.some((a) => a.title === 'Breaking: Test Passes!')).toBe(true)
    })
  })

  it('keeps drafts out of published list', async () => {
    const { result } = renderHook(() => useArticles())
    await act(async () => {
      await result.current.createArticle(
        makeArticle({ title: 'Secret Draft', status: 'draft', id: undefined as unknown as string }),
      )
    })
    await act(async () => {
      await result.current.fetchArticles({ status: 'published' })
    })
    expect(result.current.articles.some((a) => a.title === 'Secret Draft')).toBe(false)
  })
})
