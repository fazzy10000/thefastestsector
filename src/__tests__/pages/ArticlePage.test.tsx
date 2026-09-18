import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ArticlePage from '../../pages/ArticlePage'
import { AuthProvider } from '../../hooks/useAuth'
import type { Article } from '../../lib/types'

function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: '1',
    title: 'Deep Dive Article',
    slug: 'deep-dive',
    excerpt: 'A deep dive into testing',
    content: '<p>Full article content here.</p>',
    featuredImage: 'https://example.com/img.jpg',
    category: 'formula-1',
    contentType: 'news',
    tags: ['testing', 'vitest'],
    author: 'Test Writer',
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

function renderArticlePage(slug: string, category = 'formula-1') {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[`/${category}/${slug}`]}>
        <Routes>
          <Route path="/article/:slug" element={<ArticlePage />} />
          <Route path="/:category/:slug" element={<ArticlePage />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('ArticlePage', () => {
  beforeEach(() => {
    const articles = [makeArticle()]
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo) => {
        const url = String(input)
        if (url.includes('/by-slug/')) {
          const slug = decodeURIComponent(url.split('/by-slug/')[1])
          const found = articles.find((a) => a.slug === slug)
          if (!found) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
          return new Response(JSON.stringify({ article: found }), { status: 200 })
        }
        if (url.startsWith('/api/articles')) {
          return new Response(JSON.stringify({ articles }), { status: 200 })
        }
        if (url.startsWith('/api/authors')) {
          return new Response(JSON.stringify({ authors: [] }), { status: 200 })
        }
        if (url.startsWith('/api/seo')) {
          return new Response(JSON.stringify({ settings: {}, overrides: {} }), { status: 200 })
        }
        if (url.startsWith('/api/settings')) {
          return new Response(JSON.stringify({ settings: {} }), { status: 200 })
        }
        return new Response(JSON.stringify({}), { status: 200 })
      }),
    )
  })

  it('renders the article content when found', async () => {
    renderArticlePage('deep-dive')
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Deep Dive Article' })).toBeInTheDocument()
    })
  })

  it('shows not found for unknown slug', async () => {
    renderArticlePage('nonexistent')
    await waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument()
    })
  })
})
