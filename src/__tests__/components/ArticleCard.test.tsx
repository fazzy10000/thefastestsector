import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ArticleCard from '../../components/ArticleCard'
import type { Article } from '../../lib/types'

function makeArticle(overrides: Partial<Article> = {}): Article {
  return {
    id: '1',
    title: 'Test Title',
    slug: 'test-title',
    excerpt: 'Test excerpt for the article',
    content: '<p>Content</p>',
    featuredImage: 'https://example.com/img.jpg',
    category: 'formula-1',
    contentType: 'news',
    tags: ['tag1'],
    author: 'Test Author',
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

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('ArticleCard', () => {
  it('renders title, excerpt, author, and category', () => {
    renderWithRouter(<ArticleCard article={makeArticle()} />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test excerpt for the article')).toBeInTheDocument()
    expect(screen.getByText('Test Author')).toBeInTheDocument()
    expect(screen.getByText('Formula 1')).toBeInTheDocument()
  })

  it('links to the correct article slug', () => {
    renderWithRouter(<ArticleCard article={makeArticle({ slug: 'my-slug' })} />)
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toBe('/article/my-slug')
  })

  it('renders hero variant without crashing', () => {
    renderWithRouter(<ArticleCard article={makeArticle()} variant="hero" />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('renders compact variant without crashing', () => {
    renderWithRouter(<ArticleCard article={makeArticle()} variant="compact" />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('handles missing publishedAt gracefully', () => {
    renderWithRouter(
      <ArticleCard article={makeArticle({ publishedAt: null })} />,
    )
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('handles undefined publishedAt and createdAt gracefully', () => {
    renderWithRouter(
      <ArticleCard
        article={makeArticle({
          publishedAt: undefined as unknown as null,
          createdAt: undefined as unknown as number,
        })}
      />,
    )
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('handles zero timestamp gracefully', () => {
    renderWithRouter(
      <ArticleCard article={makeArticle({ publishedAt: 0, createdAt: 0 })} />,
    )
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('handles NaN timestamp gracefully', () => {
    renderWithRouter(
      <ArticleCard
        article={makeArticle({
          publishedAt: NaN,
          createdAt: NaN,
        })}
      />,
    )
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('renders featured image', () => {
    renderWithRouter(<ArticleCard article={makeArticle()} />)
    const img = screen.getByAltText('Test Title')
    expect(img).toBeInTheDocument()
    expect(img.getAttribute('src')).toBe('https://example.com/img.jpg')
  })

  it('uses placeholder when no featured image', () => {
    renderWithRouter(
      <ArticleCard article={makeArticle({ featuredImage: '' })} />,
    )
    const img = screen.getByAltText('Test Title')
    expect(img.getAttribute('src')).toBe('/placeholder.jpg')
  })
})
