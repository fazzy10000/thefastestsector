import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const STORAGE_KEY = 'tfs_dark_mode'

async function loadHook() {
  // Dynamic import so each test gets a fresh module state
  vi.resetModules()
  const mod = await import('../../hooks/useDarkMode')
  return mod.useDarkMode
}

describe('useDarkMode', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('defaults to light mode when no preference is stored', async () => {
    const useDarkMode = await loadHook()
    const { result } = renderHook(() => useDarkMode())
    expect(result.current.dark).toBe(false)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('restores dark mode from localStorage', async () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    const useDarkMode = await loadHook()
    const { result } = renderHook(() => useDarkMode())
    expect(result.current.dark).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('restores light mode from localStorage', async () => {
    localStorage.setItem(STORAGE_KEY, 'false')
    const useDarkMode = await loadHook()
    const { result } = renderHook(() => useDarkMode())
    expect(result.current.dark).toBe(false)
  })

  it('toggles dark mode on and off', async () => {
    const useDarkMode = await loadHook()
    const { result } = renderHook(() => useDarkMode())

    act(() => result.current.toggle())
    expect(result.current.dark).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    act(() => result.current.toggle())
    expect(result.current.dark).toBe(false)
    expect(localStorage.getItem(STORAGE_KEY)).toBe('false')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('syncs across multiple hook instances', async () => {
    const useDarkMode = await loadHook()
    const { result: a } = renderHook(() => useDarkMode())
    const { result: b } = renderHook(() => useDarkMode())

    act(() => a.current.toggle())
    expect(b.current.dark).toBe(true)
  })

  it('respects system preference when no stored value', async () => {
    ;(window.matchMedia as ReturnType<typeof vi.fn>).mockImplementation(
      (q: string) => ({
        matches: q === '(prefers-color-scheme: dark)',
        media: q,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    )

    const useDarkMode = await loadHook()
    const { result } = renderHook(() => useDarkMode())
    expect(result.current.dark).toBe(true)

    // Restore default mock
    ;(window.matchMedia as ReturnType<typeof vi.fn>).mockImplementation(
      (q: string) => ({
        matches: false,
        media: q,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    )
  })
})
