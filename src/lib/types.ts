import { DEFAULT_PAGE_CONTENT } from './siteContentDefaults'

export type ContentType = 'news' | 'results' | 'opinion'

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  news: 'News',
  results: 'Results',
  opinion: 'Opinion',
}

export interface Author {
  id: string
  name: string
  bio: string
  avatar: string
  twitter: string
  instagram: string
  linkedin: string
}

/** Curated Meet the Team page entry (About). May link to an author or be a custom extra. */
export interface TeamPageMember {
  id: string
  authorId: string
  userId: string
  name: string
  roleTitle: string
  bio: string
  avatar: string
  twitter: string
  instagram: string
  linkedin: string
  sortOrder: number
  /** Published articles credited to this person (by author id or name). */
  articleCount: number
}

export interface Article {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  featuredImage: string
  category: Category
  contentType: ContentType
  tags: string[]
  author: string
  authorId: string
  editor?: string
  editorId?: string
  /** Staff who completed review (admin panel credit) */
  reviewedBy?: string
  reviewedById?: string
  reviewedAt?: number | null
  status: 'draft' | 'ready_for_review' | 'published' | 'scheduled'
  featured: boolean
  scheduledAt: number | null
  createdAt: number
  updatedAt: number
  publishedAt: number | null
}

export interface ArticleVersion {
  content: string
  title: string
  excerpt: string
  editedBy: string
  editedAt: number
}

export type UserRole = 'admin' | 'editor' | 'author' | 'seo'

/** Site-wide SEO config stored in Firestore `seo_settings/global` or localStorage `tfs_seo_settings`. */
export interface GlobalSEOSettings {
  defaultMetaTitleTemplate: string
  defaultMetaDescription: string
  ogImageUrl: string
  googleAnalyticsId: string
  canonicalUrlBase: string
  /** `true` = allow indexing for that page type; `false` = noindex */
  robotsDirectives: {
    home: boolean
    article: boolean
    category: boolean
    search: boolean
    static: boolean
  }
}

export const DEFAULT_SEO_SETTINGS: GlobalSEOSettings = {
  defaultMetaTitleTemplate: '{page} | The Fastest Sector',
  defaultMetaDescription: '',
  ogImageUrl: '',
  googleAnalyticsId: '',
  canonicalUrlBase: '',
  robotsDirectives: {
    home: true,
    article: true,
    category: true,
    search: false,
    static: true,
  },
}

/** Per-article overrides in Firestore `seo_overrides/{articleId}` or localStorage `tfs_seo_overrides`. */
export interface ArticleSEOOverride {
  metaTitle: string
  metaDescription: string
  focusKeyphrase: string
  noIndex: boolean
}

export interface AppUser {
  uid: string
  email: string
  displayName: string
  role: UserRole
  createdAt: number
}

export interface Invite {
  id: string
  email: string
  role: UserRole
  createdBy: string
  createdAt: number
  used: boolean
}

export type Category =
  | 'formula-1'
  | 'feeder-series'
  | 'formula-e'
  | 'indycar'
  | 'exclusive'
  | 'f1-academy'
  | 'other'

export const CATEGORY_LABELS: Record<Category, string> = {
  'formula-1': 'Formula 1',
  'feeder-series': 'Feeder Series',
  'formula-e': 'Formula E',
  'indycar': 'IndyCar',
  'exclusive': 'Exclusive',
  'f1-academy': 'F1 Academy',
  'other': 'Other',
}

export const CATEGORY_COLORS: Record<Category, string> = {
  'formula-1': 'bg-badge-f1',
  'feeder-series': 'bg-badge-feeder',
  'formula-e': 'bg-badge-fe',
  'indycar': 'bg-badge-indycar',
  'exclusive': 'bg-badge-exclusive',
  'f1-academy': 'bg-badge-f1',
  'other': 'bg-badge-news',
}

export interface PolicySection {
  heading: string
  paragraphs: string[]
  bullets: string[]
  afterBullets?: string[]
}

export interface SitePageContent {
  title: string
  seoDescription: string
  lastUpdated: string
  sections: PolicySection[]
  /** Legacy HTML field — migrated to sections on load. */
  content?: string
}

export interface JoinPageSettings {
  title: string
  seoDescription: string
  intro: string
  benefitsHeading: string
  benefits: string[]
}

export interface FooterValueProp {
  title: string
  desc: string
}

export interface FooterSettings {
  newsletterLabel: string
  newsletterHeadline: string
  newsletterBody: string
  valueProps: FooterValueProp[]
  legalDisclaimer: string
}

export interface SiteSettings {
  ourStory: string
  socialLinks: {
    twitter: string
    instagram: string
    linkedin: string
    tiktok: string
    discord: string
    email: string
  }
  siteName: string
  siteTagline: string
  contactEmail: string
  legalLocation: string
  privacyPolicy: SitePageContent
  editorialPolicy: SitePageContent
  correctionsPolicy: SitePageContent
  terms: SitePageContent
  joinPage: JoinPageSettings
  footer: FooterSettings
}

export const DEFAULT_SETTINGS: SiteSettings = {
  ourStory:
    'The Fastest Sector was created to give a platform to motorsport fans to share their love for motorsport, as well as their creativity and writing skills. What started as a small team of five in 2021, and has seen members come and go, has now expanded to a large team, always eager to share content with you.',
  socialLinks: {
    twitter: 'https://x.com/_TFSofficial',
    instagram: 'https://www.instagram.com/thefastestsector/',
    linkedin: 'https://www.linkedin.com/company/the-fastest-sector',
    tiktok: 'https://www.tiktok.com/@thefastestsector',
    discord: 'https://discord.com/invite/mxn8S2rgKC',
    email: 'mailto:thefastestsector@gmail.com',
  },
  siteName: 'The Fastest Sector',
  siteTagline: 'Home of quick, quirky and reliable motorsport content.',
  ...DEFAULT_PAGE_CONTENT,
}

export interface RaceEvent {
  id: string
  name: string
  circuit: string
  location: string
  country: string
  countryCode: string
  date: string // ISO date string
  endDate: string
  series: 'f1' | 'f2' | 'f3' | 'fe' | 'indycar' | 'f1-academy'
  round: number
  status: 'upcoming' | 'completed' | 'live'
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface Quiz {
  id: string
  title: string
  slug: string
  description: string
  category: Category
  featuredImage: string
  questions: QuizQuestion[]
  status: 'draft' | 'published'
  createdAt: number
  updatedAt: number
}

export type NewsletterEdition = 'all' | 'f1' | 'feeder-series' | 'indycar' | 'formula-e'

export const NEWSLETTER_EDITION_LABELS: Record<NewsletterEdition, string> = {
  all: 'All subscribers',
  f1: 'F1 Edition',
  'feeder-series': 'Feeder Series Edition',
  indycar: 'IndyCar Edition',
  'formula-e': 'Formula E Edition',
}

export interface Newsletter {
  id: string
  subject: string
  previewText: string
  content: string
  edition: NewsletterEdition
  status: 'draft' | 'sent'
  recipientCount: number
  createdAt: number
  updatedAt: number
  sentAt: number | null
  createdBy: string
}

export interface NewsletterSubscriber {
  id: string
  email: string
  source: string
  edition: string
  status: string
  createdAt: number
}

export interface MediaAsset {
  id: string
  url: string
  name: string
  alt: string
  tags: string[]
  createdAt: number
  updatedAt: number
  createdBy: string
}
