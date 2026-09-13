import type { SitePageContent, SiteSettings } from './types'
import {
  DEFAULT_CORRECTIONS_SECTIONS,
  DEFAULT_EDITORIAL_SECTIONS,
  DEFAULT_FOOTER_LEGAL_DISCLAIMER,
  DEFAULT_PRIVACY_SECTIONS,
  DEFAULT_TERMS_SECTIONS,
} from './policyContent'

export const DEFAULT_PAGE_CONTENT: Pick<
  SiteSettings,
  | 'privacyPolicy'
  | 'terms'
  | 'editorialPolicy'
  | 'correctionsPolicy'
  | 'joinPage'
  | 'footer'
  | 'contactEmail'
  | 'legalLocation'
> = {
  contactEmail: 'thefastestsector@gmail.com',
  legalLocation: 'Dublin, Ireland',
  privacyPolicy: {
    title: 'Privacy Policy',
    seoDescription: 'How The Fastest Sector collects, uses, and protects your information.',
    lastUpdated: 'August 2026',
    sections: DEFAULT_PRIVACY_SECTIONS,
  },
  editorialPolicy: {
    title: 'Editorial Policy',
    seoDescription: 'Our editorial mission, standards, independence, and approach at The Fastest Sector.',
    lastUpdated: 'August 2026',
    sections: DEFAULT_EDITORIAL_SECTIONS,
  },
  correctionsPolicy: {
    title: 'Corrections & Updates Policy',
    seoDescription: 'How The Fastest Sector handles corrections and updates to our reporting.',
    lastUpdated: 'August 2026',
    sections: DEFAULT_CORRECTIONS_SECTIONS,
  },
  terms: {
    title: 'Terms & Conditions',
    seoDescription: 'Terms of use for The Fastest Sector website and content.',
    lastUpdated: 'August 2026',
    sections: DEFAULT_TERMS_SECTIONS,
  },
  joinPage: {
    title: 'Join The Fastest Sector Team',
    seoDescription: 'Apply to join The Fastest Sector as a motorsport writer or content creator.',
    intro:
      'Are you over 18 and would like to join a group of women from across the globe in creating fun and interesting motorsport content?',
    benefitsHeading: 'Why join us?',
    benefits: [
      'Build your creative / editorial portfolio',
      'Gain real experience with a growing platform',
      'Be part of a supportive, women-led media team',
    ],
  },
  footer: {
    newsletterLabel: 'Newsletter',
    newsletterHeadline: 'Get Sector Sweep Delivered',
    newsletterBody:
      'Exclusive motorsport insights, news and results. Straight to your inbox.',
    valueProps: [
      { title: 'Fast', desc: 'Breaking news as it happens from every series.' },
      { title: 'In-Depth', desc: "Expert analysis and insights you won't find anywhere else." },
      { title: 'Data Driven', desc: 'Stats, trends and data that bring the story to life.' },
      { title: 'Fan Focused', desc: 'Interactive features that put you at the heart of the action.' },
    ],
    legalDisclaimer: DEFAULT_FOOTER_LEGAL_DISCLAIMER,
  },
}

export function emptyPageContent(title: string): SitePageContent {
  return {
    title,
    seoDescription: '',
    lastUpdated: new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    sections: [{ heading: '', paragraphs: [''], bullets: [] }],
  }
}
