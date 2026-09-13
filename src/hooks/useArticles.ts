import { useState, useCallback } from 'react'
import { api } from '../lib/api'
import type { Article, Category } from '../lib/types'

export type ArticleListMeta = {
  total: number
  page: number
  limit: number
  counts?: { all: number; published: number; draft: number; scheduled: number }
}

export type FetchArticlesOpts = {
  category?: Category
  status?: 'draft' | 'published' | 'scheduled'
  limit?: number
  page?: number
  featured?: boolean
  authorId?: string
  contentType?: string
  q?: string
  /** summary (default) omits HTML content; full includes it */
  fields?: 'summary' | 'full'
}

export function useArticles() {
  const [articles, setArticles] = useState<Article[]>([])
  const [meta, setMeta] = useState<ArticleListMeta>({ total: 0, page: 1, limit: 0 })
  const [loading, setLoading] = useState(true)

  const fetchArticles = useCallback(async (opts?: FetchArticlesOpts) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (opts?.category) params.set('category', opts.category)
      if (opts?.status) params.set('status', opts.status)
      if (opts?.limit != null) params.set('limit', String(opts.limit))
      if (opts?.page != null) params.set('page', String(opts.page))
      if (opts?.featured !== undefined) params.set('featured', String(opts.featured))
      if (opts?.authorId) params.set('authorId', opts.authorId)
      if (opts?.contentType) params.set('contentType', opts.contentType)
      if (opts?.q) params.set('q', opts.q)
      if (opts?.fields) params.set('fields', opts.fields)
      const qs = params.toString()
      const data = await api<{
        articles: Article[]
        total?: number
        page?: number
        limit?: number
        counts?: ArticleListMeta['counts']
      }>(`/api/articles${qs ? `?${qs}` : ''}`)
      setArticles(data.articles)
      setMeta({
        total: data.total ?? data.articles.length,
        page: data.page ?? 1,
        limit: data.limit ?? data.articles.length,
        counts: data.counts,
      })
      return data.articles
    } finally {
      setLoading(false)
    }
  }, [])

  const getArticle = useCallback(async (id: string): Promise<Article | null> => {
    try {
      const data = await api<{ article: Article }>(`/api/articles/${id}`)
      return data.article
    } catch {
      return null
    }
  }, [])

  const getArticleBySlug = useCallback(async (slug: string, _includeUnpublished = false): Promise<Article | null> => {
    try {
      const data = await api<{ article: Article }>(`/api/articles/by-slug/${encodeURIComponent(slug)}`)
      return data.article
    } catch {
      return null
    }
  }, [])

  const createArticle = useCallback(async (data: Omit<Article, 'id'>) => {
    const res = await api<{ id: string }>('/api/articles', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return res.id
  }, [])

  const updateArticle = useCallback(async (id: string, data: Partial<Article>) => {
    await api(`/api/articles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }, [])

  const deleteArticle = useCallback(async (id: string) => {
    await api(`/api/articles/${id}`, { method: 'DELETE' })
  }, [])

  return {
    articles,
    meta,
    loading,
    fetchArticles,
    getArticle,
    getArticleBySlug,
    createArticle,
    updateArticle,
    deleteArticle,
    removeArticle: deleteArticle,
  }
}
