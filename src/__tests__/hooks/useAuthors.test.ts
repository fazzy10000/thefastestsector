import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuthors } from '../../hooks/useAuthors'
import { SAMPLE_AUTHORS } from '../../lib/sampleAuthors'

const LS_KEY = 'tfs_authors'

describe('useAuthors', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('seeds sample authors on first load', () => {
    const { result } = renderHook(() => useAuthors())
    expect(result.current.authors.length).toBe(SAMPLE_AUTHORS.length)
    expect(result.current.loading).toBe(false)
  })

  it('persists authors in localStorage', () => {
    renderHook(() => useAuthors())
    const stored = JSON.parse(localStorage.getItem(LS_KEY) || '[]')
    expect(stored.length).toBe(SAMPLE_AUTHORS.length)
  })

  it('getAuthor returns an author by ID', async () => {
    const { result } = renderHook(() => useAuthors())
    const found = await result.current.getAuthor('elliejournalisedaily')
    expect(found).not.toBeNull()
    expect(found!.name).toBe('Ellie Roddy | Motorsports Writer')
  })

  it('getAuthor returns null for unknown ID', async () => {
    const { result } = renderHook(() => useAuthors())
    const found = await result.current.getAuthor('nonexistent')
    expect(found).toBeNull()
  })

  it('getAuthorByName finds by case-insensitive name', async () => {
    const { result } = renderHook(() => useAuthors())
    const found = await result.current.getAuthorByName('leslie')
    expect(found).not.toBeNull()
    expect(found!.id).toBe('sportswithleslie')
  })

  it('saveAuthor creates a new author', async () => {
    const { result } = renderHook(() => useAuthors())

    await act(async () => {
      await result.current.saveAuthor({
        id: 'author-new',
        name: 'New Writer',
        bio: 'Writes things',
        avatar: '',
        twitter: '',
        instagram: '',
        linkedin: '',
      })
    })

    expect(result.current.authors.length).toBe(SAMPLE_AUTHORS.length + 1)
    const found = await result.current.getAuthor('author-new')
    expect(found!.name).toBe('New Writer')
  })

  it('saveAuthor updates an existing author', async () => {
    const { result } = renderHook(() => useAuthors())
    const original = await result.current.getAuthor('elliejournalisedaily')

    await act(async () => {
      await result.current.saveAuthor({ ...original!, bio: 'Updated bio' })
    })

    const updated = await result.current.getAuthor('elliejournalisedaily')
    expect(updated!.bio).toBe('Updated bio')
    expect(result.current.authors.length).toBe(SAMPLE_AUTHORS.length)
  })

  it('removeAuthor deletes an author', async () => {
    const { result } = renderHook(() => useAuthors())

    await act(async () => {
      await result.current.removeAuthor('elliejournalisedaily')
    })

    expect(result.current.authors.length).toBe(SAMPLE_AUTHORS.length - 1)
    const found = await result.current.getAuthor('elliejournalisedaily')
    expect(found).toBeNull()
  })

  it('recovers from corrupted localStorage data', () => {
    localStorage.setItem(LS_KEY, 'not-json{{{')
    const { result } = renderHook(() => useAuthors())
    expect(result.current.authors.length).toBe(SAMPLE_AUTHORS.length)
  })

  it('filters out authors with missing required fields', () => {
    localStorage.setItem(LS_KEY, JSON.stringify([
      { id: '', name: 'Missing ID', bio: '', avatar: '', twitter: '', instagram: '', linkedin: '' },
      { id: 'has-id', name: '', bio: '', avatar: '', twitter: '', instagram: '', linkedin: '' },
      { id: 'valid', name: 'Valid Author', bio: 'ok', avatar: '', twitter: '', instagram: '', linkedin: '' },
    ]))
    const { result } = renderHook(() => useAuthors())
    expect(result.current.authors.length).toBe(1)
    expect(result.current.authors[0].name).toBe('Valid Author')
  })
})
