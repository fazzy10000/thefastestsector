import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBoundary from '../../components/ErrorBoundary'

function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Kaboom!')
  return <div>All good</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>,
    )
    expect(screen.getByText('All good')).toBeInTheDocument()
  })

  it('renders error UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Oops')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument()
  })

  it('clears all localStorage keys on reset', () => {
    localStorage.setItem('tfs_articles', 'data')
    localStorage.setItem('tfs_articles_v', '3')
    localStorage.setItem('tfs_demo_auth', 'true')
    localStorage.setItem('tfs_dark_mode', 'true')
    localStorage.setItem('tfs_settings', '{}')

    const reloadMock = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadMock },
      writable: true,
    })

    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    )

    fireEvent.click(screen.getByRole('button', { name: /reset/i }))

    expect(localStorage.getItem('tfs_articles')).toBeNull()
    expect(localStorage.getItem('tfs_articles_v')).toBeNull()
    expect(localStorage.getItem('tfs_demo_auth')).toBeNull()
    expect(localStorage.getItem('tfs_dark_mode')).toBeNull()
    expect(localStorage.getItem('tfs_settings')).toBeNull()
  })

  it('logs the error to console', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    )

    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})
