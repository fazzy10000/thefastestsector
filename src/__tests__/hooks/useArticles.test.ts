import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useArticles } from '../../hooks/useArticles'
import { SAMPLE_ARTICLES } from '../../lib/sampleData'
import type { Article, Category, ContentType } from '../../lib/types'

const LS_KEY = 'tfs_articles'
const LS_VERSION_KEY = 'tfs_articles_v'

function makeArticle(overrides: Partial<Article> = {}): Omit<Article, 'id'> {
  return {
    title: 'Test Article',
    slug: 'test-article',
    excerpt: 'Test excerpt',
    content: '<p>Test content</p>',
    featuredImage: '',
    category: 'formula-1' as Category,
    contentType: 'news' as ContentType,
    tags: ['test'],
    author: 'Tester',
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

describe('useArticles', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('initialization', () => {
    it('seeds sample data on first load', async () => {
      const { result } = renderHook(() => useArticles())
      await act(async () => {
        await result.current.fetchArticles()
      })
      expect(result.current.articles.length).toBeGreaterThan(0)
      expect(localStorage.getItem(LS_KEY)).toBeTruthy()
    })

    it('sets version key after seeding', async () => {
      const { result } = renderHook(() => useArticles())
      await act(async () => {
        await result.current.fetchArticles()
      })
      expect(localStorage.getItem(LS_VERSION_KEY)).toBe('6')
    })

    it('re-seeds when version changes', async () => {
      localStorage.setItem(LS_KEY, JSON.stringify([makeArticle({ title: 'Custom' })]))
      localStorage.setItem(LS_VERSION_KEY, '1')

      const { result } = renderHook(() => useArticles())
      await act(async () => {
        await result.current.fetchArticles()
      })

      const titles = result.current.articles.map((a) => a.title)
      expect(titles).not.toContain('Custom')
      expect(result.current.articles.length).toBe(SAMPLE_ARTICLES.filter(a => a.status === 'published').length)
    })

    it('preserves existing data when version matches', async () => {
      const custom = [{ ...makeArticle({ title: 'My Article' }), id: 'custom-1' }]
      localStorage.setItem(LS_KEY, JSON.stringify(custom))
      localStorage.setItem(LS_VERSION_KEY, '6')

      const { result } = renderHook(() => useArticles())
      await act(async () => {
        await result.current.fetchArticles()
      })

      expect(result.current.articles[0].title).toBe('My Article')
    })
  })

  describe('CRUD operations', () => {
    it('creates a new article with a unique ID', async () => {
      const { result } = renderHook(() => useArticles())
      let newId = ''
      await act(async () => {
        newId = await result.current.createArticle(makeArticle({ title: 'Brand New' }))
      })

      expect(newId).toBeTruthy()
      expect(typeof newId).toBe('string')

      const stored = JSON.parse(localStorage.getItem(LS_KEY)!) as Article[]
      expect(stored.find((a) => a.id === newId)?.title).toBe('Brand New')
    })

    it('retrieves an article by ID', async () => {
      const { result } = renderHook(() => useArticles())
      let newId = ''
      await act(async () => {
        newId = await result.current.createArticle(makeArticle({ title: 'Find Me' }))
      })

      let found: Article | null = null
      await act(async () => {
        found = await result.current.getArticle(newId)
      })

      expect(found).not.toBeNull()
      expect(found!.title).toBe('Find Me')
    })

    it('retrieves an article by slug', async () => {
      const { result } = renderHook(() => useArticles())
      await act(async () => {
        await result.current.createArticle(makeArticle({ slug: 'unique-slug-123' }))
      })

      let found: Article | null = null
      await act(async () => {
        found = await result.current.getArticleBySlug('unique-slug-123')
      })

      expect(found).not.toBeNull()
      expect(found!.slug).toBe('unique-slug-123')
    })

    it('returns null for nonexistent slug', async () => {
      const { result } = renderHook(() => useArticles())
      let found: Article | null = null
      await act(async () => {
        found = await result.current.getArticleBySlug('does-not-exist')
      })
      expect(found).toBeNull()
    })

    it('updates an article without overwriting createdAt', async () => {
      const { result } = renderHook(() => useArticles())
      const original = makeArticle({ title: 'Original Title' })
      let id = ''
      await act(async () => {
        id = await result.current.createArticle(original)
      })

      await act(async () => {
        await result.current.updateArticle(id, { title: 'Updated Title' })
      })

      let found: Article | null = null
      await act(async () => {
        found = await result.current.getArticle(id)
      })

      expect(found!.title).toBe('Updated Title')
      expect(found!.createdAt).toBe(original.createdAt)
    })

    it('deletes an article', async () => {
      const { result } = renderHook(() => useArticles())
      let id = ''
      await act(async () => {
        id = await result.current.createArticle(makeArticle())
      })

      await act(async () => {
        await result.current.removeArticle(id)
      })

      let found: Article | null = null
      await act(async () => {
        found = await result.current.getArticle(id)
      })

      expect(found).toBeNull()
    })
  })

  describe('filtering', () => {
    it('filters by status', async () => {
      const { result } = renderHook(() => useArticles())
      await act(async () => {
        await result.current.createArticle(makeArticle({ status: 'published', title: 'Pub' }))
        await result.current.createArticle(makeArticle({ status: 'draft', title: 'Draft' }))
      })

      let pubArticles: Article[] = []
      await act(async () => {
        pubArticles = await result.current.fetchArticles({ status: 'published' })
      })

      expect(pubArticles.every((a) => a.status === 'published')).toBe(true)
    })

    it('filters by category', async () => {
      const { result } = renderHook(() => useArticles())
      await act(async () => {
        await result.current.createArticle(makeArticle({ category: 'formula-e' }))
        await result.current.createArticle(makeArticle({ category: 'formula-1' }))
      })

      let feArticles: Article[] = []
      await act(async () => {
        feArticles = await result.current.fetchArticles({ category: 'formula-e' })
      })

      expect(feArticles.every((a) => a.category === 'formula-e')).toBe(true)
    })

    it('filters by featured flag', async () => {
      const { result } = renderHook(() => useArticles())
      await act(async () => {
        await result.current.createArticle(makeArticle({ featured: true, title: 'Featured' }))
        await result.current.createArticle(makeArticle({ featured: false, title: 'Not Featured' }))
      })

      let featArticles: Article[] = []
      await act(async () => {
        featArticles = await result.current.fetchArticles({ featured: true })
      })

      expect(featArticles.every((a) => a.featured)).toBe(true)
    })

    it('respects limit', async () => {
      const { result } = renderHook(() => useArticles())
      await act(async () => {
        for (let i = 0; i < 5; i++) {
          await result.current.createArticle(makeArticle({ title: `Art ${i}` }))
        }
      })

      let limited: Article[] = []
      await act(async () => {
        limited = await result.current.fetchArticles({ limit: 2 })
      })

      expect(limited.length).toBe(2)
    })

    it('sorts by createdAt descending', async () => {
      localStorage.setItem(LS_VERSION_KEY, '6')
      localStorage.setItem(LS_KEY, JSON.stringify([]))

      const { result } = renderHook(() => useArticles())
      const now = Date.now()
      await act(async () => {
        await result.current.createArticle(makeArticle({ title: 'Older', createdAt: now - 10000 }))
        await result.current.createArticle(makeArticle({ title: 'Newer', createdAt: now }))
      })

      let articles: Article[] = []
      await act(async () => {
        articles = await result.current.fetchArticles()
      })

      expect(articles[0].title).toBe('Newer')
      expect(articles[1].title).toBe('Older')
    })
  })

  describe('data validation and corruption recovery', () => {
    it('filters out articles with missing id', async () => {
      const corrupt = [
        { title: 'No ID', createdAt: Date.now() },
        { id: 'ok', title: 'Has ID', slug: 'has-id', createdAt: Date.now() },
      ]
      localStorage.setItem(LS_KEY, JSON.stringify(corrupt))
      localStorage.setItem(LS_VERSION_KEY, '6')

      const { result } = renderHook(() => useArticles())
      let articles: Article[] = []
      await act(async () => {
        articles = await result.current.fetchArticles()
      })

      expect(articles.length).toBe(1)
      expect(articles[0].id).toBe('ok')
    })

    it('filters out articles with missing title', async () => {
      const corrupt = [
        { id: '1', createdAt: Date.now() },
        { id: '2', title: 'Good', slug: 'good', createdAt: Date.now() },
      ]
      localStorage.setItem(LS_KEY, JSON.stringify(corrupt))
      localStorage.setItem(LS_VERSION_KEY, '6')

      const { result } = renderHook(() => useArticles())
      let articles: Article[] = []
      await act(async () => {
        articles = await result.current.fetchArticles()
      })

      expect(articles.length).toBe(1)
      expect(articles[0].title).toBe('Good')
    })

    it('filters out articles with non-numeric createdAt', async () => {
      const corrupt = [
        { id: '1', title: 'Bad Date', createdAt: 'not-a-date' },
        { id: '2', title: 'Good', slug: 'good', createdAt: Date.now() },
      ]
      localStorage.setItem(LS_KEY, JSON.stringify(corrupt))
      localStorage.setItem(LS_VERSION_KEY, '6')

      const { result } = renderHook(() => useArticles())
      let articles: Article[] = []
      await act(async () => {
        articles = await result.current.fetchArticles()
      })

      expect(articles.length).toBe(1)
    })

    it('clears localStorage on JSON parse failure', async () => {
      localStorage.setItem(LS_KEY, 'not valid json{{{')
      localStorage.setItem(LS_VERSION_KEY, '6')

      const { result } = renderHook(() => useArticles())
      await act(async () => {
        await result.current.fetchArticles()
      })

      expect(localStorage.getItem(LS_KEY)).not.toBe('not valid json{{{')
    })

    it('adds default contentType for articles missing it', async () => {
      const legacy = [
        { id: '1', title: 'Old', slug: 'old', category: 'formula-1', createdAt: Date.now(), updatedAt: Date.now() },
      ]
      localStorage.setItem(LS_KEY, JSON.stringify(legacy))
      localStorage.setItem(LS_VERSION_KEY, '6')

      const { result } = renderHook(() => useArticles())
      let articles: Article[] = []
      await act(async () => {
        articles = await result.current.fetchArticles()
      })

      expect(articles[0].contentType).toBe('news')
    })

    it('handles null entries in the array', async () => {
      const corrupt = [null, undefined, { id: '1', title: 'Valid', createdAt: Date.now() }]
      localStorage.setItem(LS_KEY, JSON.stringify(corrupt))
      localStorage.setItem(LS_VERSION_KEY, '6')

      const { result } = renderHook(() => useArticles())
      let articles: Article[] = []
      await act(async () => {
        articles = await result.current.fetchArticles()
      })

      expect(articles.length).toBe(1)
    })

    it('handles createdAt set to undefined after bad edit', async () => {
      const corrupt = [
        { id: '1', title: 'Bad Edit', slug: 'bad-edit', category: 'formula-1', createdAt: undefined },
      ]
      localStorage.setItem(LS_KEY, JSON.stringify(corrupt))
      localStorage.setItem(LS_VERSION_KEY, '6')

      const { result } = renderHook(() => useArticles())
      let articles: Article[] = []
      await act(async () => {
        articles = await result.current.fetchArticles()
      })

      // Should be filtered out since createdAt is not a number
      expect(articles.length).toBe(0)
    })
  })
})
