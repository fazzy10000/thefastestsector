// Captures the start-to-finish "posting an article" walkthrough screenshots
// for the Admin Guide Google Doc. Creates a realistic draft article through
// the real UI (so the SEO panel scores green), screenshotting each stage.
import { chromium } from 'playwright'
import { mkdirSync } from 'fs'
import { join } from 'path'

const base = process.env.BASE_URL || 'http://localhost:5173'
const email = process.env.SHOT_EMAIL || 'screenshot-admin@tfs.local'
const password = process.env.SHOT_PASSWORD || 'ScreenshotAdmin1!'
const outDir = join(process.cwd(), 'tmp-screenshots')
mkdirSync(outDir, { recursive: true })

const TITLE = 'Monaco Grand Prix 2026: What We Learned on Sunday'
const SLUG = 'monaco-grand-prix-2026-what-we-learned-on-sunday'
const EXCERPT =
  'The strategy calls, standout drives and title-race fallout from a dramatic Sunday in Monte Carlo.'
const META_DESC =
  'Our full debrief from the Monaco Grand Prix: the strategy calls, the standout drives and the moments that decided a dramatic Sunday in Monte Carlo.'
const KEYPHRASE = 'Monaco Grand Prix'
const TAGS = 'monaco, race-report, strategy'

const INTRO =
  'The Monaco Grand Prix has a habit of rewriting the championship script, and this year was no exception. By the time the chequered flag fell on Sunday evening, the paddock had five fresh storylines to argue about — and at least two pit walls had some explaining to do.'
const H2A = '## The start decided more than the strategy'
const PARA2 =
  'Pole position matters everywhere, but around the streets of Monte Carlo it is practically the whole race. The run down to Sainte Devote stayed clean, yet the order behind the leader was scrambled by a bold double overcut that nobody on the pit wall saw coming. From lap six onwards the leading pair controlled the pace, backing the field into a train that stretched all the way through the tunnel. It was a masterclass in track position — and a reminder that qualifying on Saturday is still the most important forty minutes of the weekend.'
const PARA3 =
  'Further back, the rookies impressed. Two of them ran inside the points for most of the afternoon, and both treated the barriers with a respect their lap times did not suggest. Expect their names to feature heavily in the silly-season chatter over the next month.'
const H2B = '## Tyres, timing and one very brave call'
const PARA4 =
  'The safety car on lap thirty-one turned a quiet afternoon into a strategist\'s nightmare. One team gambled on slicks staying alive for fifty laps; another stacked both cars and somehow got away with it. The Monaco Grand Prix rewards nerve, and the bravest call of the day came from the midfield, where an undercut executed to the tenth of a second jumped three cars in one stop. When the field settled, the podium had a shape nobody had predicted on Thursday.'
const CLOSING =
  'The championship picture is tighter than ever heading into the European summer. If Sunday proved anything, it is that the Monaco Grand Prix still writes its own rules — and the title contenders would do well to remember it.'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

async function shot(name) {
  const file = join(outDir, `${name}.png`)
  await page.screenshot({ path: file, fullPage: false })
  console.log('saved', name)
}

async function elementShot(locator, name) {
  await locator.scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)
  const file = join(outDir, `${name}.png`)
  await locator.screenshot({ path: file })
  console.log('saved', name)
}

// Screenshot the union bounding box of several locators (page coordinates).
async function clipUnion(locators, name, pad = 12) {
  // Scroll everything into view FIRST (the admin scrolls in an inner
  // container, so coordinates measured between scrolls would be stale).
  for (const loc of locators) await loc.scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)
  // Measure in VIEWPORT coordinates (screenshot clip crops the viewport, so
  // adding scroll offsets produces wrong crops on scrolled pages).
  const rects = []
  for (const loc of locators) {
    const handle = await loc.elementHandle()
    const r = await handle.evaluate((el) => {
      const b = el.getBoundingClientRect()
      return { x: b.x, y: b.y, w: b.width, h: b.height }
    })
    rects.push(r)
  }
  const vp = page.viewportSize()
  const x1 = Math.max(0, Math.min(...rects.map((r) => r.x)) - pad)
  const y1 = Math.max(0, Math.min(...rects.map((r) => r.y)) - pad)
  const x2 = Math.min(vp.width, Math.max(...rects.map((r) => r.x + r.w)) + pad)
  const y2 = Math.min(vp.height, Math.max(...rects.map((r) => r.y + r.h)) + pad)
  const file = join(outDir, `${name}.png`)
  await page.screenshot({ path: file, clip: { x: x1, y: y1, width: x2 - x1, height: y2 - y1 } })
  console.log('saved', name)
}

function panel(h3text) {
  return page.locator('div.bg-white', { has: page.locator(`h3:text-is("${h3text}")`) }).last()
}

// --- Login ---
await page.goto(`${base}/admin/login`, { waitUntil: 'networkidle', timeout: 60000 })
await page.fill('input[type="email"], input[name="email"]', email)
await page.fill('input[type="password"], input[name="password"]', password)
await Promise.all([
  page.waitForURL(/\/admin(?!\/login)/, { timeout: 30000 }).catch(() => null),
  page.click('button[type="submit"]'),
])
await page.waitForTimeout(1200)

// The built-in interactive tour auto-starts on first login for a fresh
// browser profile — dismiss it so it doesn't sit over the screenshots.
async function dismissTour() {
  const skip = page.locator('text=Skip tour').first()
  if (await skip.isVisible().catch(() => false)) {
    await skip.click()
    await page.waitForTimeout(500)
    console.log('dismissed tour')
  }
}
// Also mark the tour as seen for this user so the auto-start timer never
// fires mid-capture (it can start after the visibility check above).
await page.evaluate(async () => {
  const r = await fetch('/api/auth/me')
  const d = await r.json()
  const uid = d.user?.uid || d.user?.id
  if (uid) localStorage.setItem(`tfs_admin_tour_seen_${uid}`, String(Date.now()))
})
await dismissTour()

// Clean up any leftover article from a previous run so slug/autofill behave
const leftover = await page.evaluate(async (slug) => {
  const r = await fetch(`/api/articles/by-slug/${slug}`)
  if (!r.ok) return null
  const d = await r.json()
  return d.article?.id || null
}, SLUG)
if (leftover) {
  await page.evaluate((id) => fetch(`/api/articles/${id}`, { method: 'DELETE' }), leftover)
  console.log('deleted leftover article', leftover)
}

// Grab a featured image URL from existing content
const featuredUrl = await page.evaluate(async () => {
  const r = await fetch('/api/articles?limit=20')
  const d = await r.json()
  const a = (d.articles || []).find((x) => x.featuredImage)
  return a ? a.featuredImage : ''
})
console.log('featured image url found:', Boolean(featuredUrl))

// --- Stage 1: blank New Article page ---
await page.goto(`${base}/admin/new`, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(1000)
await shot('40-post-new-article')

// --- Stage 2: title (slug autofills) + excerpt ---
const titleInput = page.locator('input[placeholder="Article title"]')
await titleInput.click()
await titleInput.pressSequentially(TITLE, { delay: 5 })
await page.waitForTimeout(400)
const excerptBox = page.locator('textarea[placeholder="Write a short excerpt..."]')
await excerptBox.fill(EXCERPT)
await page.waitForTimeout(300)
await clipUnion([titleInput, excerptBox], '41-post-title-slug', 16)

// --- Stage 2b: category + content type in the sidebar ---
await page.locator('div.bg-white:has(h3:text-is("Category")) select').selectOption('formula-1')
await page.waitForTimeout(200)
await clipUnion([panel('Category'), panel('Content Type')], '42-post-category-type', 12)

// --- Stage 3: write the body in the editor ---
const editorEl = page.locator('.ProseMirror')
await editorEl.click()
const typeBlock = async (text) => {
  await page.keyboard.type(text, { delay: 0 })
  await page.keyboard.press('Enter')
}
await typeBlock(INTRO)
await typeBlock(H2A)
await typeBlock(PARA2)
await typeBlock(PARA3)
await typeBlock(H2B)
await typeBlock(PARA4)
await page.keyboard.type(CLOSING, { delay: 0 })
await page.waitForTimeout(500)

// scroll the toolbar to the top of the viewport and take a full viewport shot
const toolbar = page.locator('div.bg-gray-50:has(input[type="file"])').first()
await toolbar.evaluate((el) => el.scrollIntoView({ block: 'start' }))
await page.evaluate(() => window.scrollBy(0, -80))
await page.waitForTimeout(400)
await shot('43-post-editor-toolbar')

// --- Stage 3b: media picker (Choose from library) ---
await page.locator('button[title="Choose from library"]').click()
await page.waitForTimeout(1200)
await shot('44-post-media-picker')
await page.locator('button[aria-label="Close"]').click()
await page.waitForTimeout(400)

// --- Stage 4: featured image ---
if (featuredUrl) {
  await page.locator('input[placeholder="Or paste image URL"]').fill(featuredUrl)
  await page.waitForTimeout(1200)
}
await elementShot(panel('Featured Image'), '45-post-featured-image')

// --- Stage 5: author, edited by, tags ---
const authorSelect = page.locator('div.bg-white:has(h3:text-is("Author")) select')
const authorOptions = await authorSelect.locator('option').count()
if (authorOptions > 1) await authorSelect.selectOption({ index: 1 })
const editorSelect = page.locator('div.bg-white:has(h3:text-is("Edited by")) select')
const editorOptions = await editorSelect.locator('option').count()
if (editorOptions > 2) await editorSelect.selectOption({ index: 2 })
else if (editorOptions > 1) await editorSelect.selectOption({ index: 1 })
await page.locator('input[placeholder="tag1, tag2, tag3"]').fill(TAGS)
await page.waitForTimeout(300)
await clipUnion([panel('Author'), panel('Tags')], '46-post-author-tags', 12)

// --- Stage 6: SEO panel, filled until green ---
await page.locator('input[placeholder="e.g. Verstappen 2027"]').fill(KEYPHRASE)
const seoPanel = page
  .locator('div.bg-white.rounded-xl', { has: page.locator('label:text-is("Focus Keyphrase")') })
  .last()
await seoPanel.locator('textarea').fill(META_DESC)
await page.waitForTimeout(800)
await elementShot(seoPanel, '47-post-seo-panel')

// --- Stage 7: schedule panel with a date picked ---
const when = new Date(Date.now() + 3 * 86400000)
when.setHours(9, 0, 0, 0)
const pad2 = (n) => String(n).padStart(2, '0')
const dtValue = `${when.getFullYear()}-${pad2(when.getMonth() + 1)}-${pad2(when.getDate())}T09:00`
await page.locator('input[type="datetime-local"]').fill(dtValue)
await page.waitForTimeout(400)
await elementShot(panel('Schedule'), '48-post-schedule')
await page.locator('button:has-text("Clear")').click()
await page.waitForTimeout(300)

// --- Stage 8: save as draft -> dashboard confirmation ---
await page.getByRole('button', { name: /Draft/ }).click()
await page.waitForURL(/\/admin$/, { timeout: 30000 }).catch(() => null)
await page.waitForTimeout(1500)
await shot('50-post-dashboard-draft')

// --- Stage 7b (needs edit mode): full button bar with Preview + History ---
const articleId = await page.evaluate(async (slug) => {
  const r = await fetch(`/api/articles/by-slug/${slug}`)
  const d = await r.json()
  return d.article?.id || null
}, SLUG)
if (!articleId) throw new Error('draft article not found after save')
await page.goto(`${base}/admin/edit/${articleId}`, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(1500)
const headerBar = page
  .locator('div.mb-6', { has: page.getByRole('button', { name: 'Publish' }) })
  .first()
await elementShot(headerBar, '49-post-buttons')

// --- Stage 9: preview as a reader ---
await page.goto(`${base}/article/${SLUG}?preview=true`, { waitUntil: 'networkidle', timeout: 60000 })
await page.waitForTimeout(1800)
await shot('51-post-preview')

await browser.close()
console.log('done')
