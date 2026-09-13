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

/**
 * Role-aware tour steps. Capabilities verified against worker/auth.ts +
 * worker/api.ts: every role (incl. seo) may create/publish articles via
 * `edit_own_article`; deleting needs `edit_any_article` (admin/editor);
 * the SEO dashboard needs `manage_seo` (admin/seo); Team is admin-only.
 * The seo role's tour still centres on the SEO dashboard + overrides,
 * since writing is handled by the editorial roles.
 */
export function getTourSteps(role: UserRole): TourStep[] {
  const sidebarBody: Record<UserRole, string> = {
    admin:
      'Articles, quizzes, media, newsletters, ads and SEO tools all live here — plus Team and Settings, which only admins see. You have access to every section.',
    editor:
      'Articles, quizzes and media live here, along with the Authors, Newsletters and Ads sections you manage as an editor. Team and site Settings are admin-only.',
    author:
      "As an author you'll mostly use Dashboard, New Article, Quizzes and Media. Sections like Authors, Newsletters and Settings are handled by editors and admins.",
    seo:
      'As the SEO manager you get the SEO dashboard, Sitemap and site Settings, plus Media and Traffic & Insights. Articles are written by the editorial team — this tour shows where your tools live.',
  }

  const welcome: TourStep = {
    id: 'welcome',
    route: '/admin',
    target: 'dashboard-header',
    title: 'Welcome to TFS Admin',
    body:
      role === 'seo'
        ? "This quick tour shows the SEO tools you'll use day to day. You can rerun it anytime via “Take the tour” at the bottom of the sidebar."
        : 'This quick tour walks you through posting an article from start to finish. You can rerun it anytime via “Take the tour” at the bottom of the sidebar.',
  }

  const sidebar: TourStep = {
    id: 'sidebar',
    route: '/admin',
    target: 'sidebar-nav',
    title: 'Everything lives in the sidebar',
    body: sidebarBody[role],
  }

  if (role === 'seo') {
    return [
      welcome,
      sidebar,
      {
        id: 'nav-seo',
        route: '/admin',
        target: 'nav-seo',
        title: 'Your home base: the SEO dashboard',
        body: 'All site-wide and per-article SEO tools are in here. The tour heads there now — no need to click.',
      },
      {
        id: 'seo-checklist',
        route: '/admin/seo',
        target: 'seo-checklist',
        title: 'Site health at a glance',
        body: 'The checklist scores the whole site — meta descriptions, featured images, duplicate slugs. Site-wide defaults (title template, OG image, robots rules) live just above it.',
      },
      {
        id: 'seo-articles',
        route: '/admin/seo',
        target: 'seo-articles',
        title: 'Per-article SEO overrides',
        body: 'Every published article is scored here. Click a row to override its meta title, description and focus keyphrase without touching the article itself — or bulk-generate missing meta descriptions.',
      },
      {
        id: 'dashboard-review',
        route: '/admin',
        target: 'dashboard-list',
        title: 'Articles live on the Dashboard',
        body: 'Writing and publishing is handled by the writers; their articles appear here. You can open any article to check its live SEO panel score. That’s the tour — enjoy!',
      },
    ]
  }

  // Full article-posting flow for admin, editor and author.
  return [
    welcome,
    sidebar,
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
          ? 'Save Draft keeps it private; Publish puts it live immediately — authors can publish their own work. To schedule instead, pick a date in the Schedule card on the right.'
          : 'Save Draft keeps it private; Publish puts it live immediately. To schedule, pick a date in the Schedule card on the right and a Schedule button appears.',
    },
    {
      id: 'dashboard-review',
      route: '/admin',
      target: 'dashboard-list',
      title: 'Back on the Dashboard',
      body:
        role === 'author'
          ? 'Every article lands here with its status — published, draft or scheduled. Filter with the tabs above or click a status badge to toggle it. Deleting articles is reserved for editors and admins. That’s the tour — happy writing!'
          : 'Every article lands here with its status — published, draft or scheduled. Filter with the tabs above, click a status badge to toggle publish/draft, or edit any time. That’s the tour — happy writing!',
    },
  ]
}
