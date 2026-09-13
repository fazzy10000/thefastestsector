import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from '../../hooks/useAuth'

describe('useAuth', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo) => {
        const url = String(input)
        if (url.includes('/api/auth/me')) {
          return new Response(JSON.stringify({ user: null }), { status: 200 })
        }
        if (url.includes('/api/auth/login')) {
          return new Response(
            JSON.stringify({
              user: {
                uid: 'u1',
                email: 'admin@example.com',
                displayName: 'Admin',
                role: 'admin',
              },
            }),
            { status: 200 },
          )
        }
        if (url.includes('/api/auth/logout')) {
          return new Response(JSON.stringify({ ok: true }), { status: 200 })
        }
        return new Response(JSON.stringify({ error: 'not found' }), { status: 404 })
      }),
    )
  })

  it('starts unauthenticated after /me', async () => {
    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('signs in against the Worker session API', async () => {
    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.loading).toBe(false))
    await act(async () => {
      await result.current.signIn('admin@example.com', 'secret')
    })
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.role).toBe('admin')
    expect(result.current.uid).toBe('u1')
  })
})
