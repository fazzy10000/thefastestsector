import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '../../hooks/useAuth'

const DEMO_KEY = 'tfs_demo_auth'

describe('useAuth (demo mode)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('auto-authenticates in demo mode without login', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.isDemo).toBe(true)
    expect(result.current.user).toBeNull()
    expect(result.current.uid).toBe('demo-admin')
    expect(localStorage.getItem(DEMO_KEY)).toBe('true')
  })

  it('finishes loading immediately in demo mode', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.loading).toBe(false)
  })

  it('demoSignIn keeps an admin session', () => {
    const { result } = renderHook(() => useAuth())

    act(() => {
      result.current.demoSignIn()
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.role).toBe('admin')
    expect(localStorage.getItem(DEMO_KEY)).toBe('true')
  })

  it('signOut re-establishes the demo session so admin stays usable', async () => {
    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.signOut()
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(localStorage.getItem(DEMO_KEY)).toBe('true')
  })

  it('persists auth across hook instances', () => {
    const { result: first } = renderHook(() => useAuth())
    expect(first.current.isAuthenticated).toBe(true)

    const { result: second } = renderHook(() => useAuth())
    expect(second.current.isAuthenticated).toBe(true)
  })

  it('signIn throws in demo mode', async () => {
    const { result } = renderHook(() => useAuth())
    await expect(result.current.signIn('a@b.com', 'pass')).rejects.toThrow(
      'Firebase not configured',
    )
  })

  it('grants admin permissions in demo mode', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.can('manage_users')).toBe(true)
    expect(result.current.can('edit_any_article')).toBe(true)
  })
})
