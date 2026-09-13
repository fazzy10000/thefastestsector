import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Home from '../../pages/Home'
import type { Article } from '../../lib/types'

function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: crypto.randomUUID(),
    title: 'Home Page Article',
    slug: 'home-article',
    excerpt: 'Excerpt here',
    content: '<p>Body</p>',
    featuredImage: 'https://example.com/img.jpg',
    category: 'formula-1',
    contentType: 'news',
    tags: [],
    author: 'Author',
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

describe('Home page', () => {
  beforeEach(() => {
    const articles = [makeArticle({ title: 'Visible Article', status: 'published' })]
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo) => {
        const url = String(input)
        if (url.startsWith('/api/articles')) {
          return new Response(JSON.stringify({ articles }), { status: 200 })
        }
        if (url.startsWith('/api/settings')) {
          return new Response(JSON.stringify({ settings: {} }), { status: 200 })
        }
        if (url.startsWith('/api/authors')) {
          return new Response(JSON.stringify({ authors: [] }), { status: 200 })
        }
        if (url.startsWith('/api/quizzes')) {
          return new Response(JSON.stringify({ quizzes: [] }), { status: 200 })
        }
        return new Response(JSON.stringify({}), { status: 200 })
      }),
    )
  })

  it('renders published articles', async () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getAllByText('Visible Article').length).toBeGreaterThan(0)
    })
  })
})
