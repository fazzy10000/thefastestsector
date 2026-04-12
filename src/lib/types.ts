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
  status: 'draft' | 'published' | 'scheduled'
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
}

export const DEFAULT_SETTINGS: SiteSettings = {
  ourStory:
    'The Fastest Sector was created to give a platform to motorsport fans to share their love for motorsport, as well as their creativity and writing skills. What started as a small team of five in 2021, and has seen members come and go, has now expanded to a large team, always eager to share content with you.',
  socialLinks: {
    twitter: 'https://x.com',
    instagram: 'https://instagram.com',
    linkedin: 'https://linkedin.com',
    tiktok: 'https://tiktok.com',
    discord: 'https://discord.gg',
    email: 'mailto:contact@thefastestsector.com',
  },
  siteName: 'The Fastest Sector',
  siteTagline: 'Home of quick, quirky and reliable motorsport content.',
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
  series: 'f1' | 'fe' | 'indycar' | 'f1-academy'
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
