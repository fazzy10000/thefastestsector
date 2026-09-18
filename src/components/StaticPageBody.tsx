import { Link } from 'react-router-dom'
import { renderSiteContent } from '../lib/renderSiteContent'
import type { PolicySection, SiteSettings } from '../lib/types'

interface StaticPageBodyProps {
  sections: PolicySection[]
  settings: SiteSettings
}

function renderInlineText(text: string, settings: SiteSettings) {
  const resolved = renderSiteContent(text, settings)
  const email = settings.contactEmail

  type Part = { type: 'text' | 'email' | 'contact'; value: string }
  const parts: Part[] = [{ type: 'text', value: resolved }]

  const splitBy = (needle: string, type: 'email' | 'contact') => {
    const next: Part[] = []
    for (const part of parts) {
      if (part.type !== 'text' || !part.value.includes(needle)) {
        next.push(part)
        continue
      }
      const chunks = part.value.split(needle)
      chunks.forEach((chunk, index) => {
        if (chunk) next.push({ type: 'text', value: chunk })
        if (index < chunks.length - 1) next.push({ type, value: needle })
      })
    }
    parts.length = 0
    parts.push(...next)
  }

  if (email) splitBy(email, 'email')
  splitBy('Contact page', 'contact')

  return parts.map((part, index) => {
    if (part.type === 'email') {
      return (
        <a key={index} href={`mailto:${part.value}`} className="text-primary hover:underline">
          {part.value}
        </a>
      )
    }
    if (part.type === 'contact') {
      return (
        <Link key={index} to="/contact" className="text-primary hover:underline">
          {part.value}
        </Link>
      )
    }
    return <span key={index}>{part.value}</span>
  })
}

export default function StaticPageBody({ sections, settings }: StaticPageBodyProps) {
  return (
    <div className="static-page-content max-w-none space-y-6 text-text-secondary dark:text-white/70 leading-relaxed">
      {sections.map((section, index) => (
        <section key={`${section.heading}-${index}`}>
          {section.heading && (
            <h2 className="text-xl font-bold text-text-primary dark:text-white mb-2">
              {section.heading}
            </h2>
          )}
          {section.paragraphs.map((paragraph, paragraphIndex) => (
            <p key={paragraphIndex} className="mb-3">
              {renderInlineText(paragraph, settings)}
            </p>
          ))}
          {section.bullets.length > 0 && (
            <ul className="list-disc pl-5 space-y-1 mb-3">
              {section.bullets.map((bullet, bulletIndex) => (
                <li key={bulletIndex}>{renderInlineText(bullet, settings)}</li>
              ))}
            </ul>
          )}
          {section.afterBullets?.map((paragraph, paragraphIndex) => (
            <p key={`after-${paragraphIndex}`} className="mb-3">
              {renderInlineText(paragraph, settings)}
            </p>
          ))}
        </section>
      ))}
    </div>
  )
}
