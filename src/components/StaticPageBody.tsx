import { renderSiteContent } from '../lib/renderSiteContent'
import type { PolicySection, SiteSettings } from '../lib/types'

interface StaticPageBodyProps {
  sections: PolicySection[]
  settings: SiteSettings
}

function renderInlineText(text: string, settings: SiteSettings) {
  const resolved = renderSiteContent(text, settings)
  const email = settings.contactEmail

  if (email && resolved.includes(email)) {
    const parts = resolved.split(email)
    return parts.map((part, index) => (
      <span key={index}>
        {part}
        {index < parts.length - 1 && (
          <a href={`mailto:${email}`} className="text-primary hover:underline">
            {email}
          </a>
        )}
      </span>
    ))
  }

  return resolved
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
