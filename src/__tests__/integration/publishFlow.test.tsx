import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useArticles } from '../../hooks/useArticles'
import { useAuth } from '../../hooks/useAuth'
import Home from '../../pages/Home'
import type { Article, Category, ContentType } from '../../lib/types'

const LS_KEY = 'tfs_articles'
const LS_VERSION_KEY = 'tfs_articles_v'

function makeNewArticle(overrides: Partial<Article> = {}): Omit<Article, 'id'> {
  return {
    title: 'Published Test',
    slug: 'published-test',
    excerpt: 'An article published through the admin',
    content: '<p>Published content</p>',
    featuredImage: '',
    category: 'formula-1' as Category,
    contentType: 'news' as ContentType,
    tags: ['test'],
    author: 'Admin User',
    status: 'published',
    featured: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    publishedAt: Date.now(),
    ...overrides,
  }
}

describe('publish flow integration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('full flow: login → create article → article appears on homepage', async () => {
    // 1. Demo login
    const { result: auth } = renderHook(() => useAuth())
    act(() => auth.current.demoSignIn())
    expect(auth.current.isAuthenticated).toBe(true)

    // 2. Create and publish article
    const { result: articles } = renderHook(() => useArticles())
    await act(async () => {
      await articles.current.createArticle(
        makeNewArticle({ title: 'Breaking: Test Passes!' }),
      )
    })

    // 3. Verify it shows on the homepage
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(
        screen.getAllByText('Breaking: Test Passes!').length,
      ).toBeGreaterThan(0)
    })
  })

  it('draft article does NOT appear on homepage', async () => {
    const { result: articles } = renderHook(() => useArticles())
    await act(async () => {
      await articles.current.createArticle(
        makeNewArticle({ title: 'Secret Draft', status: 'draft' }),
      )
    })

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.queryByText('Secret Draft')).not.toBeInTheDocument()
    })
  })

  it('editing an article preserves createdAt', async () => {
    const { result: articles } = renderHook(() => useArticles())
    const originalTime = Date.now() - 100000

    let id = ''
    await act(async () => {
      id = await articles.current.createArticle(
        makeNewArticle({ title: 'Edit Me', createdAt: originalTime }),
      )
    })

    // Simulate the ArticleEditor update (the fixed version that omits createdAt)
    await act(async () => {
      await articles.current.updateArticle(id, {
        title: 'Edited Title',
        updatedAt: Date.now(),
      })
    })

    let found: Article | null = null
    await act(async () => {
      found = await articles.current.getArticle(id)
    })

    expect(found!.title).toBe('Edited Title')
    expect(found!.createdAt).toBe(originalTime)
  })

  it('publishing multiple articles shows all on homepage', async () => {
    const { result: articles } = renderHook(() => useArticles())

    await act(async () => {
      for (let i = 0; i < 3; i++) {
        await articles.current.createArticle(
          makeNewArticle({
            title: `Article ${i}`,
            slug: `article-${i}`,
            createdAt: Date.now() - i * 1000,
          }),
        )
      }
    })

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    await waitFor(() => {
      for (let i = 0; i < 3; i++) {
        expect(screen.getAllByText(`Article ${i}`).length).toBeGreaterThan(0)
      }
    })
  })

  it('deleting an article removes it from homepage', async () => {
    localStorage.setItem(LS_KEY, JSON.stringify([]))
    localStorage.setItem(LS_VERSION_KEY, '3')

    const { result: articles } = renderHook(() => useArticles())

    let id = ''
    await act(async () => {
      id = await articles.current.createArticle(
        makeNewArticle({ title: 'Delete Me' }),
      )
    })

    await act(async () => {
      await articles.current.removeArticle(id)
    })

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.queryByText('Delete Me')).not.toBeInTheDocument()
    })
  })

  it('toggling article status between draft/published works', async () => {
    localStorage.setItem(LS_KEY, JSON.stringify([]))
    localStorage.setItem(LS_VERSION_KEY, '3')

    const { result: articles } = renderHook(() => useArticles())

    let id = ''
    await act(async () => {
      id = await articles.current.createArticle(
        makeNewArticle({ title: 'Toggle Status', status: 'published' }),
      )
    })

    // Unpublish
    await act(async () => {
      await articles.current.updateArticle(id, { status: 'draft' })
    })

    let found: Article | null = null
    await act(async () => {
      found = await articles.current.getArticle(id)
    })
    expect(found!.status).toBe('draft')

    // Republish
    await act(async () => {
      await articles.current.updateArticle(id, { status: 'published' })
    })

    await act(async () => {
      found = await articles.current.getArticle(id)
    })
    expect(found!.status).toBe('published')
  })
})

describe('data corruption recovery', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('app recovers from completely corrupted localStorage', async () => {
    localStorage.setItem(LS_KEY, '!!!not json!!!')
    localStorage.setItem(LS_VERSION_KEY, '3')

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    // Should not crash — either shows empty or re-seeds
    await waitFor(() => {
      expect(document.body).toBeInTheDocument()
    })
  })

  it('app recovers from articles with undefined createdAt (the original bug)', async () => {
    const corruptArticle = {
      id: 'bad-1',
      title: 'Corrupt Article',
      slug: 'corrupt',
      excerpt: 'Has undefined createdAt',
      content: '<p>Content</p>',
      featuredImage: '',
      category: 'formula-1',
      contentType: 'news',
      tags: [],
      author: 'Admin',
      status: 'published',
      featured: true,
      updatedAt: Date.now(),
      publishedAt: Date.now(),
      // createdAt intentionally omitted to simulate the bug
    }

    localStorage.setItem(LS_KEY, JSON.stringify([corruptArticle]))
    localStorage.setItem(LS_VERSION_KEY, '3')

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    // Should not crash
    await waitFor(() => {
      expect(document.body).toBeInTheDocument()
    })
  })

  it('app renders after localStorage is emptied mid-session', async () => {
    const { result: articles } = renderHook(() => useArticles())

    await act(async () => {
      await articles.current.createArticle(
        makeNewArticle({ title: 'Will Survive' }),
      )
    })

    // Wipe localStorage like it's been cleared
    localStorage.clear()

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    )

    // Should re-seed and render without crashing
    await waitFor(() => {
      expect(document.body).toBeInTheDocument()
    })
  })
})
