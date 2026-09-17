import type { UserRole } from '../../lib/types'

export type TourStep = {
  id: string
  /** Admin route the step lives on — the tour navigates there if needed. */
  route: string
  /** Matches a data-tour="…" attribute on the target element. */
  target: string
  title: string
  body: string
}

export type TourFocus = 'writing' | 'seo'

/** Dispatched on window to start the admin tour with an optional focus. */
export const ADMIN_TOUR_EVENT = 'tfs-admin-tour'

/** Prefer the SEO tools tour on SEO/Sitemap routes, or for the seo role. */
export function resolveTourFocus(role: UserRole, pathname: string, forced?: TourFocus): TourFocus {
  if (forced) return forced
  if (role === 'seo') return 'seo'
  if (pathname.startsWith('/admin/seo') || pathname.startsWith('/admin/sitemap')) return 'seo'
  return 'writing'
}

function seoTourSteps(role: UserRole): TourStep[] {
  const forSeoRole = role === 'seo'

  return [
    {
      id: 'welcome',
      route: '/admin/seo',
      target: 'seo-header',
      title: 'SEO tools walkthrough',
      body: forSeoRole
        ? "This tour walks through the SEO tools you'll use day to day — site defaults, article overrides, the sitemap, settings and traffic. Rerun anytime via “Take the tour” or the button on this page."
        : 'This tour covers the SEO dashboard and related tools. You can also run the article-posting tour from the Dashboard via “Take the tour”.',
    },
    {
      id: 'sidebar',
      route: '/admin/seo',
      target: 'sidebar-nav',
      title: 'SEO lives in the sidebar',
      body: forSeoRole
        ? 'As the SEO manager you get the SEO dashboard, Sitemap and site Settings, plus Media and Traffic & Insights. Writing/publishing is handled by the editorial team.'
        : 'SEO, Sitemap and Settings are the main places for search work. The rest of the sidebar is editorial and ops.',
    },
    {
      id: 'seo-header',
      route: '/admin/seo',
      target: 'seo-header',
      title: 'Save when you’re done',
      body: 'Changes to site-wide SEO settings only stick after you hit Save SEO settings in the top-right. Per-article overrides have their own Save inside each row.',
    },
    {
      id: 'seo-defaults',
      route: '/admin/seo',
      target: 'seo-defaults',
      title: 'Site-wide defaults',
      body: 'Set the default title template, meta description, Open Graph image, Analytics ID, canonical base URL, and which page types Google should index. These apply everywhere unless an article overrides them.',
    },
    {
      id: 'seo-checklist',
      route: '/admin/seo',
      target: 'seo-checklist',
      title: 'Site health at a glance',
      body: 'The checklist scores the whole site — missing meta descriptions, featured images, duplicate slugs — and shows an overall percentage. Work down the red items first.',
    },
    {
      id: 'seo-articles',
      route: '/admin/seo',
      target: 'seo-articles',
      title: 'Per-article SEO overrides',
      body: 'Every published article is scored here. Click a row to set a custom meta title, description, focus keyphrase, or noindex — without rewriting the article. Use Generate meta descriptions to fill gaps from excerpts in bulk.',
    },
    {
      id: 'nav-sitemap',
      route: '/admin',
      target: 'nav-sitemap',
      title: 'Check the sitemap',
      body: 'Sitemap lists every URL we tell search engines about. Handy after a new article goes live — confirm it’s in the list.',
    },
    {
      id: 'sitemap-viewer',
      route: '/admin/sitemap',
      target: 'sitemap-header',
      title: 'Browse & search URLs',
      body: 'Search to find a slug, switch between Tree and List views, and expand groups by type. The public file is /sitemap.xml — this page is a friendly viewer of the same data.',
    },
    {
      id: 'nav-settings',
      route: '/admin',
      target: 'nav-settings',
      title: 'Site Settings',
      body: 'Tagline, policies, join page, footer and social links live under Settings. Social URLs also feed the SEO health checklist.',
    },
    {
      id: 'settings-panel',
      route: '/admin/settings',
      target: 'settings-panel',
      title: 'Tabs for each area',
      body: 'Use the tabs along the top — General for name and tagline, Policies for legal pages, Social for profile links. Hit Save Settings when you’re finished.',
    },
    {
      id: 'nav-stats',
      route: '/admin',
      target: 'nav-stats',
      title: 'Traffic & Insights',
      body: 'See what’s getting read — views, top pages, referrers and countries. Useful for spotting which stories and categories to push harder in search.',
    },
    {
      id: 'stats-header',
      route: '/admin/stats',
      target: 'stats-header',
      title: 'Three tabs of data',
      body: 'Traffic is the short-term picture, Insights is the long view (best day, top categories/authors), and Subscribers is the newsletter list. That’s private counting — nothing goes to Google Analytics from here.',
    },
    {
      id: 'nav-new-article',
      route: '/admin',
      target: 'nav-new-article',
      title: forSeoRole ? 'You can write drafts too' : 'Live score while editing',
      body: forSeoRole
        ? 'SEO users can open New Article and save drafts. Publishing and scheduling stay with editors and admins — hand them a ready draft when it’s good.'
        : 'Open any article (or New Article) to use the live SEO panel while editing. Publishing still works as usual for your role.',
    },
    {
      id: 'editor-seo-panel',
      route: '/admin/new',
      target: 'editor-seo-panel',
      title: 'Live SEO score in the editor',
      body: forSeoRole
        ? 'While drafting, the SEO panel under the story scores title length, keyphrase usage, meta description and more. Aim for green before asking an editor to publish. That’s the tour — enjoy!'
        : 'The SEO panel scores the article live — title and meta length, keyphrase usage, featured image, word count. Aim for green checks before publishing. That’s the tour — enjoy!',
    },
  ]
}

function writingTourSteps(role: UserRole): TourStep[] {
  const sidebarBody: Record<UserRole, string> = {
    admin:
      'Articles, quizzes, media, newsletters, ads and SEO tools all live here — plus Team and Settings, which only admins see. You have access to every section. Tip: open the SEO page and hit “Take the SEO tour” for the search tools walkthrough.',
    editor:
      'Articles, quizzes and media live here, along with the Authors, Newsletters and Ads sections you manage as an editor. Team and site Settings are admin-only.',
    author:
      "As an author you'll mostly use Dashboard, New Article, Quizzes and Media. Sections like Authors, Newsletters and Settings are handled by editors and admins.",
    seo:
      'As the SEO manager you get the SEO dashboard, Sitemap and site Settings, plus Media and Traffic & Insights.',
  }

  return [
    {
      id: 'welcome',
      route: '/admin',
      target: 'dashboard-header',
      title: 'Welcome to TFS Admin',
      body: 'This quick tour walks you through posting an article from start to finish. You can rerun it anytime via “Take the tour” at the bottom of the sidebar.',
    },
    {
      id: 'sidebar',
      route: '/admin',
      target: 'sidebar-nav',
      title: 'Everything lives in the sidebar',
      body: sidebarBody[role],
    },
    {
      id: 'new-article',
      route: '/admin',
      target: 'nav-new-article',
      title: 'Start here: New Article',
      body: 'Every story starts with this button. The tour will take you into the editor now — no need to click.',
    },
    {
      id: 'title-slug',
      route: '/admin/new',
      target: 'editor-title',
      title: 'Title and slug',
      body: 'Type your headline here. The URL slug is generated automatically underneath as you type — you can fine-tune it before publishing.',
    },
    {
      id: 'category-type',
      route: '/admin/new',
      target: 'editor-category',
      title: 'Category & content type',
      body: 'Pick the racing series this belongs to. Just below, choose a content type — News, Results or Opinion — which controls how the article is presented.',
    },
    {
      id: 'writing',
      route: '/admin/new',
      target: 'editor-body',
      title: 'Write your article',
      body: 'The editor supports headings, lists, quotes, links, images and video. Use the toolbar to format, upload media, or insert from the library via the folder icon.',
    },
    {
      id: 'tags-excerpt',
      route: '/admin/new',
      target: 'editor-tags',
      title: 'Tags & excerpt',
      body: 'Add comma-separated tags so readers can find related coverage. The excerpt box under the title is the short summary shown in previews and search results.',
    },
    {
      id: 'featured-image',
      route: '/admin/new',
      target: 'editor-featured-image',
      title: 'Featured image',
      body: 'Upload an image or pick one from the media library — every article needs one. You can also paste a URL, and edit the image in place once set.',
    },
    {
      id: 'edited-by',
      route: '/admin/new',
      target: 'editor-edited-by',
      title: 'Credit an editor',
      body: 'If someone else reviewed or edited the piece, pick them here. It appears as a smaller “Edited by” credit under the author byline.',
    },
    {
      id: 'seo-panel',
      route: '/admin/new',
      target: 'editor-seo-panel',
      title: 'Check your SEO score',
      body: 'The SEO panel scores the article live — title and meta length, keyphrase usage, featured image, word count. Aim for green checks before publishing.',
    },
    {
      id: 'save-publish',
      route: '/admin/new',
      target: 'editor-actions',
      title: 'Draft, publish or schedule',
      body:
        role === 'author'
          ? 'Save Draft keeps your piece private for review. Publishing and scheduling are reserved for editors and admins — they’ll put it live when it’s ready.'
          : 'Save Draft keeps it private; Publish puts it live immediately. To schedule, pick a date in the Schedule card on the right and a Schedule button appears. Authors can save drafts only — publishing is editor/admin.',
    },
    {
      id: 'dashboard-review',
      route: '/admin',
      target: 'dashboard-list',
      title: 'Back on the Dashboard',
      body:
        role === 'author'
          ? 'Every article lands here with its status — published, draft or scheduled. Filter with the tabs above. Publishing and deleting are reserved for editors and admins. That’s the tour — happy writing!'
          : 'Every article lands here with its status — published, draft or scheduled. Filter with the tabs above, click a status badge to toggle publish/draft, or edit any time. That’s the tour — happy writing!',
    },
  ]
}

/**
 * Role- and context-aware tour steps.
 * - seo role → always SEO tools tour
 * - on /admin/seo or /admin/sitemap → SEO tools tour (admins included)
 * - otherwise → article posting tour for admin/editor/author
 */
export function getTourSteps(
  role: UserRole,
  opts?: { pathname?: string; focus?: TourFocus },
): TourStep[] {
  const focus = resolveTourFocus(role, opts?.pathname || '/admin', opts?.focus)
  if (focus === 'seo') return seoTourSteps(role)
  return writingTourSteps(role)
}
