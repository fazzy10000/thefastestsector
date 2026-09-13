import { DEFAULT_PAGE_CONTENT } from './siteContentDefaults'
import {
  htmlContentToSections,
  normalizePolicySections,
} from './policyContent'
import { DEFAULT_SETTINGS, type PolicySection, type SitePageContent, type SiteSettings } from './types'

function isLegacyPrivacyContent(sections: PolicySection[]): boolean {
  const headings = new Set(sections.map((section) => section.heading.toLowerCase()))
  return headings.has('who we are') || headings.has('information we collect')
}

function mergePageContent(
  stored: Partial<SitePageContent> | undefined,
  fallback: SitePageContent,
): SitePageContent {
  const fromSections = normalizePolicySections(stored?.sections)
  const fromLegacyHtml = stored?.content?.trim()
    ? normalizePolicySections(htmlContentToSections(stored.content))
    : []
  const sections = fromSections.length
    ? fromSections
    : fromLegacyHtml.length
      ? fromLegacyHtml
      : fallback.sections

  return {
    title: stored?.title?.trim() || fallback.title,
    seoDescription: stored?.seoDescription?.trim() || fallback.seoDescription,
    lastUpdated: stored?.lastUpdated?.trim() || fallback.lastUpdated,
    sections,
  }
}

export function mergeSettings(stored: Partial<SiteSettings> | null | undefined): SiteSettings {
  const base = stored ?? {}

  return {
    siteName: base.siteName?.trim() || DEFAULT_SETTINGS.siteName,
    siteTagline: base.siteTagline?.trim() || DEFAULT_SETTINGS.siteTagline,
    ourStory: base.ourStory?.trim() || DEFAULT_SETTINGS.ourStory,
    contactEmail: base.contactEmail?.trim() || DEFAULT_PAGE_CONTENT.contactEmail,
    legalLocation: base.legalLocation?.trim() || DEFAULT_PAGE_CONTENT.legalLocation,
    socialLinks: {
      twitter: base.socialLinks?.twitter?.trim() || DEFAULT_SETTINGS.socialLinks.twitter,
      instagram: base.socialLinks?.instagram?.trim() || DEFAULT_SETTINGS.socialLinks.instagram,
      linkedin: base.socialLinks?.linkedin?.trim() || DEFAULT_SETTINGS.socialLinks.linkedin,
      tiktok: base.socialLinks?.tiktok?.trim() || DEFAULT_SETTINGS.socialLinks.tiktok,
      discord: base.socialLinks?.discord?.trim() || DEFAULT_SETTINGS.socialLinks.discord,
      email:
        base.socialLinks?.email?.trim() ||
        `mailto:${base.contactEmail?.trim() || DEFAULT_PAGE_CONTENT.contactEmail}`,
    },
    privacyPolicy: (() => {
      const merged = mergePageContent(base.privacyPolicy, DEFAULT_PAGE_CONTENT.privacyPolicy)
      if (base.privacyPolicy?.sections?.length && isLegacyPrivacyContent(merged.sections)) {
        return DEFAULT_PAGE_CONTENT.privacyPolicy
      }
      return merged
    })(),
    editorialPolicy: mergePageContent(base.editorialPolicy, DEFAULT_PAGE_CONTENT.editorialPolicy),
    correctionsPolicy: mergePageContent(
      base.correctionsPolicy,
      DEFAULT_PAGE_CONTENT.correctionsPolicy,
    ),
    terms: mergePageContent(base.terms, DEFAULT_PAGE_CONTENT.terms),
    joinPage: {
      title: base.joinPage?.title?.trim() || DEFAULT_PAGE_CONTENT.joinPage.title,
      seoDescription:
        base.joinPage?.seoDescription?.trim() || DEFAULT_PAGE_CONTENT.joinPage.seoDescription,
      intro: base.joinPage?.intro?.trim() || DEFAULT_PAGE_CONTENT.joinPage.intro,
      benefitsHeading:
        base.joinPage?.benefitsHeading?.trim() || DEFAULT_PAGE_CONTENT.joinPage.benefitsHeading,
      benefits:
        base.joinPage?.benefits?.filter(Boolean).length
          ? base.joinPage.benefits.filter(Boolean)
          : DEFAULT_PAGE_CONTENT.joinPage.benefits,
    },
    footer: {
      newsletterLabel:
        base.footer?.newsletterLabel?.trim() || DEFAULT_PAGE_CONTENT.footer.newsletterLabel,
      newsletterHeadline:
        base.footer?.newsletterHeadline?.trim() || DEFAULT_PAGE_CONTENT.footer.newsletterHeadline,
      newsletterBody:
        base.footer?.newsletterBody?.trim() || DEFAULT_PAGE_CONTENT.footer.newsletterBody,
      valueProps:
        base.footer?.valueProps?.filter((item) => item.title.trim()).length
          ? base.footer.valueProps
          : DEFAULT_PAGE_CONTENT.footer.valueProps,
      legalDisclaimer:
        base.footer?.legalDisclaimer?.trim() || DEFAULT_PAGE_CONTENT.footer.legalDisclaimer,
    },
  }
}
