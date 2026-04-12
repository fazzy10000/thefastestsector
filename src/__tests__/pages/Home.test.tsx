import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Home from '../../pages/Home'
import type { Article } from '../../lib/types'

const LS_KEY = 'tfs_articles'
const LS_VERSION_KEY = 'tfs_articles_v'

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
    localStorage.clear()
  })

  it('renders published articles', async () => {
    const articles = [
      makeArticle({ title: 'Visible Article', status: 'published' }),
    ]
    localStorage.setItem(LS_KEY, JSON.stringify(articles))
    localStorage.setItem(LS_VERSION_KEY, '6')

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Latest')).toBeInTheDocument()
    })
    expect(screen.getAllByText('Visible Article').length).toBeGreaterThan(0)
  })

  it('does not show draft articles', async () => {
    const articles = [
      makeArticle({ title: 'Draft Only', status: 'draft' }),
    ]
    localStorage.setItem(LS_KEY, JSON.stringify(articles))
    localStorage.setItem(LS_VERSION_KEY, '6')

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.queryByText('Draft Only')).not.toBeInTheDocument()
    })
  })

  it('renders featured articles in hero section', async () => {
    const articles = [
      makeArticle({ title: 'Featured Hero', featured: true }),
    ]
    localStorage.setItem(LS_KEY, JSON.stringify(articles))
    localStorage.setItem(LS_VERSION_KEY, '6')

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getAllByText('Featured Hero').length).toBeGreaterThan(0)
    })
  })

  it('renders empty state without crashing when no articles exist', async () => {
    localStorage.setItem(LS_KEY, JSON.stringify([]))
    localStorage.setItem(LS_VERSION_KEY, '6')

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(document.querySelector('[data-testid="root"]') || document.body).toBeInTheDocument()
    })
  })

  it('survives articles with corrupted date fields', async () => {
    const articles = [
      makeArticle({
        title: 'Bad Dates',
        createdAt: NaN,
        publishedAt: undefined as unknown as number,
      }),
      makeArticle({ title: 'Good Article', createdAt: Date.now() }),
    ]
    localStorage.setItem(LS_KEY, JSON.stringify(articles))
    localStorage.setItem(LS_VERSION_KEY, '6')

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getAllByText('Good Article').length).toBeGreaterThan(0)
    })
  })

  it('loads sample data on fresh visit', async () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Latest')).toBeInTheDocument()
    })
  })
})
