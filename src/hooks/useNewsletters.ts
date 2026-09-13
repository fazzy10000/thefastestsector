import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import type { Newsletter, NewsletterEdition, NewsletterSubscriber } from '../lib/types'

function uniqueByEmail(items: NewsletterSubscriber[]): NewsletterSubscriber[] {
  const seen = new Set<string>()
  const out: NewsletterSubscriber[] = []
  for (const item of items) {
    const email = item.email.trim().toLowerCase()
    if (!email || seen.has(email)) continue
    seen.add(email)
    out.push({ ...item, email })
  }
  return out
}

export function useNewsletters() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([])
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNewsletters = useCallback(async () => {
    const data = await api<{ newsletters: Newsletter[] }>('/api/newsletters')
    setNewsletters(data.newsletters)
    return data.newsletters
  }, [])

  const fetchSubscribers = useCallback(async () => {
    const data = await api<{ subscribers: NewsletterSubscriber[] }>('/api/newsletter-subscribers')
    const list = uniqueByEmail(data.subscribers)
    setSubscribers(list)
    return list
  }, [])

  useEffect(() => {
    Promise.all([fetchNewsletters(), fetchSubscribers()])
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }, [fetchNewsletters, fetchSubscribers])

  const getNewsletter = useCallback(async (id: string): Promise<Newsletter | null> => {
    try {
      const data = await api<{ newsletter: Newsletter }>(`/api/newsletters/${id}`)
      return data.newsletter
    } catch {
      return null
    }
  }, [])

  const createNewsletter = useCallback(async (data: Omit<Newsletter, 'id'>) => {
    const res = await api<{ id: string }>('/api/newsletters', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    await fetchNewsletters()
    return res.id
  }, [fetchNewsletters])

  const updateNewsletter = useCallback(
    async (id: string, data: Partial<Newsletter>) => {
      await api(`/api/newsletters/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
      await fetchNewsletters()
    },
    [fetchNewsletters],
  )

  const deleteNewsletter = useCallback(
    async (id: string) => {
      await api(`/api/newsletters/${id}`, { method: 'DELETE' })
      await fetchNewsletters()
    },
    [fetchNewsletters],
  )

  const recipientsFor = useCallback(
    (edition: NewsletterEdition, list: NewsletterSubscriber[] = subscribers) => {
      if (edition === 'all') return list
      return list.filter((s) => s.edition === edition || s.edition === 'all')
    },
    [subscribers],
  )

  return {
    newsletters,
    subscribers,
    loading,
    fetchNewsletters,
    fetchSubscribers,
    getNewsletter,
    createNewsletter,
    updateNewsletter,
    deleteNewsletter,
    removeNewsletter: deleteNewsletter,
    recipientsFor,
  }
}
