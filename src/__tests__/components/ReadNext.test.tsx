import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ReadNext from '../../components/ReadNext'
import { SAMPLE_ARTICLES } from '../../lib/sampleData'

describe('ReadNext', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo) => {
        const url = String(input)
        if (url.startsWith('/api/articles')) {
          return new Response(JSON.stringify({ articles: SAMPLE_ARTICLES }), { status: 200 })
        }
        return new Response(JSON.stringify({}), { status: 200 })
      }),
    )
  })

  it('renders recommended articles excluding the current one', async () => {
    const current = SAMPLE_ARTICLES[0]
    render(
      <MemoryRouter>
        <ReadNext current={current} />
      </MemoryRouter>,
    )
    await waitFor(() => {
      expect(screen.getByText('Read Next')).toBeInTheDocument()
    })
    expect(screen.queryByText(current.title)).not.toBeInTheDocument()
  })
})
