import type { SiteSettings } from './types'

export function renderSiteContent(html: string, settings: SiteSettings): string {
  const replacements: Record<string, string> = {
    '{{siteName}}': settings.siteName,
    '{{contactEmail}}': settings.contactEmail,
    '{{legalLocation}}': settings.legalLocation,
    '{{siteTagline}}': settings.siteTagline,
  }

  return Object.entries(replacements).reduce(
    (content, [token, value]) => content.replaceAll(token, value),
    html,
  )
}
