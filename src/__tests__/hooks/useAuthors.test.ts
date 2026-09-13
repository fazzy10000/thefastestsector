import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAuthors } from '../../hooks/useAuthors'
import type { Author } from '../../lib/types'

const store: { authors: Author[] } = {
  authors: [
    {
      id: 'a1',
      name: 'Alice',
      bio: 'Writer',
      avatar: '',
      twitter: '',
      instagram: '',
      linkedin: '',
    },
  ],
}

describe('useAuthors', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo, init?: RequestInit) => {
        const url = String(input)
        const method = (init?.method || 'GET').toUpperCase()
        if (url === '/api/authors' && method === 'GET') {
          return new Response(JSON.stringify({ authors: store.authors }), { status: 200 })
        }
        if (url === '/api/authors' && method === 'POST') {
          const body = JSON.parse(String(init?.body || '{}')) as Author
          const idx = store.authors.findIndex((a) => a.id === body.id)
          if (idx >= 0) store.authors[idx] = body
          else store.authors.push(body)
          return new Response(JSON.stringify({ id: body.id }), { status: 200 })
        }
        const del = url.match(/^\/api\/authors\/([^/]+)$/)
        if (del && method === 'DELETE') {
          store.authors = store.authors.filter((a) => a.id !== del[1])
          return new Response(JSON.stringify({ ok: true }), { status: 200 })
        }
        return new Response(JSON.stringify({ error: 'not found' }), { status: 404 })
      }),
    )
  })

  it('loads authors from the API', async () => {
    const { result } = renderHook(() => useAuthors())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.authors.some((a) => a.name === 'Alice')).toBe(true)
  })

  it('finds authors by id and name', async () => {
    const { result } = renderHook(() => useAuthors())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.getAuthor('a1')?.name).toBe('Alice')
    expect(result.current.getAuthorByName('alice')?.id).toBe('a1')
  })
})
