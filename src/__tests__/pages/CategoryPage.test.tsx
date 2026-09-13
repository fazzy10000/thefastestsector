import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import CategoryPage from '../../pages/CategoryPage'
import type { Article } from '../../lib/types'

function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: crypto.randomUUID(),
    title: 'Category Article',
    slug: 'cat-article',
    excerpt: 'Excerpt',
    content: '<p>Body</p>',
    featuredImage: 'https://example.com/img.jpg',
    category: 'formula-1',
    contentType: 'news',
    tags: [],
    author: 'Writer',
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

function renderCategoryPage(category: string) {
  return render(
    <MemoryRouter initialEntries={[`/category/${category}`]}>
      <Routes>
        <Route path="/category/:category" element={<CategoryPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CategoryPage', () => {
  beforeEach(() => {
    const articles = [
      makeArticle({ title: 'F1 Article', category: 'formula-1' }),
      makeArticle({ title: 'FE Article', category: 'formula-e' }),
    ]
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo) => {
        const url = String(input)
        if (url.startsWith('/api/articles')) {
          const u = new URL(url, 'http://localhost')
          const category = u.searchParams.get('category')
          const list = category ? articles.filter((a) => a.category === category) : articles
          return new Response(JSON.stringify({ articles: list }), { status: 200 })
        }
        return new Response(JSON.stringify({}), { status: 200 })
      }),
    )
  })

  it('shows articles for the selected category', async () => {
    renderCategoryPage('formula-1')
    await waitFor(() => {
      expect(screen.getAllByText('F1 Article').length).toBeGreaterThan(0)
    })
    expect(screen.queryByText('FE Article')).not.toBeInTheDocument()
  })
})
