import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ArticlePage from '../../pages/ArticlePage'
import type { Article } from '../../lib/types'

const LS_KEY = 'tfs_articles'
const LS_VERSION_KEY = 'tfs_articles_v'

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
    status: 'published',
    featured: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    publishedAt: Date.now(),
    ...overrides,
  }
}

function renderArticlePage(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/article/${slug}`]}>
      <Routes>
        <Route path="/article/:slug" element={<ArticlePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ArticlePage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders the article content when found', async () => {
    localStorage.setItem(LS_KEY, JSON.stringify([makeArticle()]))
    localStorage.setItem(LS_VERSION_KEY, '3')

    renderArticlePage('deep-dive')

    await waitFor(() => {
      expect(screen.getByText('Deep Dive Article')).toBeInTheDocument()
    })
    expect(screen.getByText('Full article content here.')).toBeInTheDocument()
    expect(screen.getByText('Test Writer')).toBeInTheDocument()
  })

  it('shows "Article Not Found" for unknown slug', async () => {
    localStorage.setItem(LS_KEY, JSON.stringify([]))
    localStorage.setItem(LS_VERSION_KEY, '3')

    renderArticlePage('nonexistent')

    await waitFor(() => {
      expect(screen.getByText('Article Not Found')).toBeInTheDocument()
    })
  })

  it('renders tags', async () => {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify([makeArticle({ tags: ['f1', 'racing'] })]),
    )
    localStorage.setItem(LS_VERSION_KEY, '3')

    renderArticlePage('deep-dive')

    await waitFor(() => {
      expect(screen.getByText('#f1')).toBeInTheDocument()
      expect(screen.getByText('#racing')).toBeInTheDocument()
    })
  })

  it('handles article with missing publishedAt', async () => {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify([makeArticle({ publishedAt: null })]),
    )
    localStorage.setItem(LS_VERSION_KEY, '3')

    renderArticlePage('deep-dive')

    await waitFor(() => {
      expect(screen.getByText('Deep Dive Article')).toBeInTheDocument()
    })
  })

  it('filters out article with NaN createdAt and shows not found', async () => {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify([makeArticle({ createdAt: NaN, publishedAt: null })]),
    )
    localStorage.setItem(LS_VERSION_KEY, '3')

    renderArticlePage('deep-dive')

    await waitFor(() => {
      // Article is filtered out by readLocal validation, so page shows not found
      expect(screen.getByText('Article Not Found')).toBeInTheDocument()
    })
  })

  it('renders featured image when present', async () => {
    localStorage.setItem(LS_KEY, JSON.stringify([makeArticle()]))
    localStorage.setItem(LS_VERSION_KEY, '3')

    renderArticlePage('deep-dive')

    await waitFor(() => {
      const img = screen.getByAltText('Deep Dive Article')
      expect(img).toBeInTheDocument()
    })
  })

  it('does not render image when no featured image', async () => {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify([makeArticle({ featuredImage: '' })]),
    )
    localStorage.setItem(LS_VERSION_KEY, '3')

    renderArticlePage('deep-dive')

    await waitFor(() => {
      expect(screen.getByText('Deep Dive Article')).toBeInTheDocument()
      expect(screen.queryByAltText('Deep Dive Article')).not.toBeInTheDocument()
    })
  })
})
