import { useEffect, useState } from 'react'
import { normalizeExternalUrl } from '../lib/normalizeExternalUrl'

export type AdPlacement = 'article-sidebar' | 'home' | 'in-article'

type ActiveAd = {
  id: string
  placement: string
  imageUrl: string
  targetUrl: string
  html: string
}

export default function AdSlot({
  placement,
  className = '',
}: {
  placement: AdPlacement
  className?: string
}) {
  const [ad, setAd] = useState<ActiveAd | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/ads/active?placement=${encodeURIComponent(placement)}`)
      .then((res) => (res.ok ? res.json() : { ad: null }))
      .then((data: { ad: ActiveAd | null }) => {
        if (!cancelled) setAd(data.ad)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [placement])

  if (!ad) return null
  if (!ad.imageUrl && !ad.html) return null

  const href = normalizeExternalUrl(ad.targetUrl) || '#'

  const recordClick = () => {
    try {
      fetch(`/api/ads/${ad.id}/click`, { method: 'POST', keepalive: true }).catch(() => {})
    } catch {
      // ignore
    }
  }

  return (
    <div className={`overflow-hidden ${className}`}>
      <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-white/40 mb-1.5 text-center">
        Advertisement
      </p>
      {ad.html ? (
        <div
          onClick={recordClick}
          className="rounded-lg overflow-hidden"
          dangerouslySetInnerHTML={{ __html: ad.html }}
        />
      ) : (
        <a
          href={href}
          target="_blank"
          rel="noopener sponsored"
          onClick={recordClick}
          className="block rounded-lg overflow-hidden border border-gray-100 dark:border-white/10"
        >
          <img src={ad.imageUrl} alt="Advertisement" className="w-full h-auto" loading="lazy" />
        </a>
      )}
    </div>
  )
}
