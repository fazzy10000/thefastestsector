import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import type { NewsletterTemplate } from '../lib/newsletterHtml'
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
  const [customTemplates, setCustomTemplates] = useState<NewsletterTemplate[]>([])
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

  const fetchCustomTemplates = useCallback(async () => {
    try {
      const data = await api<{ templates: NewsletterTemplate[] }>('/api/newsletter-templates')
      setCustomTemplates(data.templates)
      return data.templates
    } catch {
      setCustomTemplates([])
      return []
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchNewsletters(), fetchSubscribers(), fetchCustomTemplates()])
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }, [fetchNewsletters, fetchSubscribers, fetchCustomTemplates])

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

  const createCustomTemplate = useCallback(
    async (input: {
      name: string
      description?: string
      subject?: string
      previewText?: string
      html: string
    }) => {
      const res = await api<{ id: string }>('/api/newsletter-templates', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      await fetchCustomTemplates()
      return res.id
    },
    [fetchCustomTemplates],
  )

  const deleteCustomTemplate = useCallback(
    async (id: string) => {
      await api(`/api/newsletter-templates/${id}`, { method: 'DELETE' })
      await fetchCustomTemplates()
    },
    [fetchCustomTemplates],
  )

  const recipientsFor = useCallback(
    (edition: NewsletterEdition, list: NewsletterSubscriber[] = subscribers) => {
      const active = list.filter((s) => s.status !== 'unsubscribed')
      if (edition === 'all') return active
      return active.filter((s) => s.edition === edition || s.edition === 'all')
    },
    [subscribers],
  )

  return {
    newsletters,
    subscribers,
    customTemplates,
    loading,
    fetchNewsletters,
    fetchSubscribers,
    fetchCustomTemplates,
    getNewsletter,
    createNewsletter,
    updateNewsletter,
    deleteNewsletter,
    removeNewsletter: deleteNewsletter,
    createCustomTemplate,
    deleteCustomTemplate,
    recipientsFor,
  }
}
