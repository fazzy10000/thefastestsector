import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import CategoryPage from '../../pages/CategoryPage'
import type { Article } from '../../lib/types'

const LS_KEY = 'tfs_articles'
const LS_VERSION_KEY = 'tfs_articles_v'

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
    status: 'published',
    featured: false,
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
    localStorage.clear()
  })

  it('shows articles for the selected category', async () => {
    const articles = [
      makeArticle({ title: 'F1 Article', category: 'formula-1' }),
      makeArticle({ title: 'FE Article', category: 'formula-e' }),
    ]
    localStorage.setItem(LS_KEY, JSON.stringify(articles))
    localStorage.setItem(LS_VERSION_KEY, '3')

    renderCategoryPage('formula-1')

    await waitFor(() => {
      expect(screen.getAllByText('F1 Article').length).toBeGreaterThan(0)
    })
    expect(screen.queryByText('FE Article')).not.toBeInTheDocument()
  })

  it('renders content type tabs', async () => {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify([makeArticle({ category: 'formula-1' })]),
    )
    localStorage.setItem(LS_VERSION_KEY, '3')

    renderCategoryPage('formula-1')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /news/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /results/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /opinion/i })).toBeInTheDocument()
    })
  })

  it('filters articles by content type tab', async () => {
    const articles = [
      makeArticle({ title: 'News Item', category: 'formula-1', contentType: 'news' }),
      makeArticle({ title: 'Results Item', category: 'formula-1', contentType: 'results' }),
      makeArticle({ title: 'Opinion Item', category: 'formula-1', contentType: 'opinion' }),
    ]
    localStorage.setItem(LS_KEY, JSON.stringify(articles))
    localStorage.setItem(LS_VERSION_KEY, '3')

    renderCategoryPage('formula-1')

    await waitFor(() => {
      expect(screen.getAllByText('News Item').length).toBeGreaterThan(0)
    })

    fireEvent.click(screen.getByRole('button', { name: /results/i }))

    await waitFor(() => {
      expect(screen.getAllByText('Results Item').length).toBeGreaterThan(0)
    })
    expect(screen.queryByText('News Item')).not.toBeInTheDocument()
  })

  it('shows empty state when no articles in category', async () => {
    localStorage.setItem(LS_KEY, JSON.stringify([]))
    localStorage.setItem(LS_VERSION_KEY, '3')

    renderCategoryPage('indycar')

    await waitFor(() => {
      expect(screen.getByText(/no.*articles/i)).toBeInTheDocument()
    })
  })
})
