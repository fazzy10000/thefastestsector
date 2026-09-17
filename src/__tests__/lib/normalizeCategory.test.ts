import { describe, it, expect } from 'vitest'
import { normalizeCategory } from '../../lib/normalizeCategory'
import { displayAuthorName } from '../../lib/formatAuthor'

describe('normalizeCategory', () => {
  it('keeps known non-other categories', () => {
    expect(normalizeCategory('indycar', 'Some Grand Prix', 'slug')).toBe('indycar')
  })

  it('maps F1 Academy articles out of other', () => {
    expect(
      normalizeCategory('other', 'F1 Academy adds extra day to U.S. round', 'f1-academy-adds-extra-day'),
    ).toBe('f1-academy')
  })

  it('does not treat IndyCar grands prix as Formula 1', () => {
    expect(
      normalizeCategory('other', 'OnlyBulls Grand Prix of Portland', 'portland-gp'),
    ).toBe('other')
  })
})

describe('displayAuthorName', () => {
  it('strips role suffixes', () => {
    expect(displayAuthorName('Ellie Roddy | Motorsports Writer')).toBe('Ellie Roddy')
  })
})
