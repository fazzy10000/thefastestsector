import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ReadNext from '../../components/ReadNext'
import { SAMPLE_ARTICLES } from '../../lib/sampleData'
import type { Article } from '../../lib/types'

const LS_KEY = 'tfs_articles'
const LS_VERSION_KEY = 'tfs_articles_v'
const CURRENT_VERSION = '4'

function seedArticles(articles: Article[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(articles))
  localStorage.setItem(LS_VERSION_KEY, CURRENT_VERSION)
}

describe('ReadNext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders recommended articles excluding the current one', () => {
    seedArticles(SAMPLE_ARTICLES)
    const current = SAMPLE_ARTICLES[0]

    render(
      <MemoryRouter>
        <ReadNext current={current} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Read Next')).toBeInTheDocument()
    expect(screen.queryByText(current.title)).not.toBeInTheDocument()
  })

  it('shows at most 3 recommendations', () => {
    seedArticles(SAMPLE_ARTICLES)
    const current = SAMPLE_ARTICLES[0]

    render(
      <MemoryRouter>
        <ReadNext current={current} />
      </MemoryRouter>,
    )

    const links = screen.getAllByRole('link').filter(
      (l) => l.getAttribute('href')?.startsWith('/article/'),
    )
    expect(links.length).toBeLessThanOrEqual(3)
  })

  it('prioritizes same-category articles', () => {
    const f1Articles = SAMPLE_ARTICLES.filter((a) => a.category === 'formula-1')
    seedArticles(SAMPLE_ARTICLES)
    const current = f1Articles[0]

    render(
      <MemoryRouter>
        <ReadNext current={current} />
      </MemoryRouter>,
    )

    const links = screen.getAllByRole('link').filter(
      (l) => l.getAttribute('href')?.startsWith('/article/'),
    )
    expect(links.length).toBeGreaterThan(0)
  })

  it('renders nothing when no other articles exist', () => {
    seedArticles([SAMPLE_ARTICLES[0]])
    const current = SAMPLE_ARTICLES[0]

    const { container } = render(
      <MemoryRouter>
        <ReadNext current={current} />
      </MemoryRouter>,
    )

    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when all other articles are drafts', () => {
    const articles: Article[] = SAMPLE_ARTICLES.map((a) => ({ ...a, status: 'draft' as const }))
    articles[0].status = 'published'
    seedArticles(articles)

    const { container } = render(
      <MemoryRouter>
        <ReadNext current={articles[0]} />
      </MemoryRouter>,
    )

    expect(container.innerHTML).toBe('')
  })

  it('shows category link with correct label', () => {
    seedArticles(SAMPLE_ARTICLES)
    const current = SAMPLE_ARTICLES[0] // formula-1

    render(
      <MemoryRouter>
        <ReadNext current={current} />
      </MemoryRouter>,
    )

    expect(screen.getByText('More in Formula 1')).toBeInTheDocument()
  })
})
