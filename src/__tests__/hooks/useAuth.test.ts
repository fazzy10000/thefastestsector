import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '../../hooks/useAuth'

const DEMO_KEY = 'tfs_demo_auth'

describe('useAuth (demo mode)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts unauthenticated', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isDemo).toBe(true)
    expect(result.current.user).toBeNull()
  })

  it('finishes loading immediately in demo mode', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.loading).toBe(false)
  })

  it('authenticates after demoSignIn', () => {
    const { result } = renderHook(() => useAuth())

    act(() => {
      result.current.demoSignIn()
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(localStorage.getItem(DEMO_KEY)).toBe('true')
  })

  it('de-authenticates after signOut', async () => {
    const { result } = renderHook(() => useAuth())

    act(() => {
      result.current.demoSignIn()
    })
    expect(result.current.isAuthenticated).toBe(true)

    await act(async () => {
      await result.current.signOut()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem(DEMO_KEY)).toBeNull()
  })

  it('persists auth across hook instances', () => {
    const { result: first } = renderHook(() => useAuth())

    act(() => {
      first.current.demoSignIn()
    })

    const { result: second } = renderHook(() => useAuth())
    expect(second.current.isAuthenticated).toBe(true)
  })

  it('syncs state across multiple active instances', () => {
    const { result: a } = renderHook(() => useAuth())
    const { result: b } = renderHook(() => useAuth())

    act(() => {
      a.current.demoSignIn()
    })

    expect(b.current.isAuthenticated).toBe(true)
  })

  it('signIn throws in demo mode', async () => {
    const { result } = renderHook(() => useAuth())
    await expect(result.current.signIn('a@b.com', 'pass')).rejects.toThrow(
      'Firebase not configured',
    )
  })

  it('restores session from localStorage', () => {
    localStorage.setItem(DEMO_KEY, 'true')

    const { result } = renderHook(() => useAuth())
    expect(result.current.isAuthenticated).toBe(true)
  })
})
